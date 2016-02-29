var util = require('util');
var EventEmitter = require('events');
var Promise = require('bluebird');
var Mountpoint = require('./Mountpoint');
var MountpointList = require('./MountpointList');


function RtpbroadcastReplicationPair(downstream, upstream) {
  RtpbroadcastReplicationPair.super_.call(this);
  this.downstream = downstream;
  this.upstream = upstream;

  this.downstreamSession = null;
  this.upstreamSession = null;
  this.mountpoints = new MountpointList;
}

util.inherits(RtpbroadcastReplicationPair, EventEmitter);

RtpbroadcastReplicationPair.prototype.register = function() {
  return Promise.all([
      this.openDownstreamSession(),
      this.openUpstreamSession()
    ])
    .then(this.listenForMountpointInfo.bind(this));
};

RtpbroadcastReplicationPair.prototype.unregister = function() {
  return Promise.all([
    this.closeDownstreamSession(),
    this.closeUpstreamSession()
  ]);
};


RtpbroadcastReplicationPair.prototype.listenForMountpointInfo = function() {
  var self = this;
  return this.upstreamSession.attachPlugin('rtpbroadcast')
    .then(function(plugin) {
      plugin.on('message', function(message) {
        if (message['body']['request'] === 'mountpoint-info') {
          self.updateMountpoints(message['body']['data']);
        }
      });
      // add transaction
      return plugin.send('upgrade connection');
    });
};

RtpbroadcastReplicationPair.prototype._createSession = function(server) {
  return server.getConnection()
    .then(function(connection) {
      return connection.createSession();
    });
};

RtpbroadcastReplicationPair.prototype.openDownstreamSession = function() {
  if (this.downstreamSession) {
    throw new Error('Downstream session already present');
  }
  return this._createSession(this.downstream)
    .then(function(session) {
      return this.downstreamSession = session;
    }.bind(this));
};

RtpbroadcastReplicationPair.prototype.closeDownstreamSession = function() {
  return this.downstreamSession.destroy().finally(function() {
    this.downstreamSession = null;
  }.bind(this));
};


RtpbroadcastReplicationPair.prototype.openUpstreamSession = function() {
  if (this.upstreamSession) {
    throw new Error('Upstream session already present');
  }
  return this._createSession(this.upstream)
    .then(function(session) {
      return this.upstreamSession = session;
    }.bind(this));
};

RtpbroadcastReplicationPair.prototype.closeUpstreamSession = function() {
  return this.upstreamSession.destroy().finally(function() {
    this.upstreamSession = null;
  }.bind(this));
};


RtpbroadcastReplicationPair.prototype.updateMountpoints = function(mountpointsData) {
  var self = this;
  var realMountpoints = mountpointsData.map(function(mountpointInfo) {
    return self.createMountpointFromInfo(mountpointInfo);
  });

  var newMountpoints = this.mountpoints.missing(realMountpoints);
  newMountpoints.forEach(function(mountpoint) {
    self.mountpoints.add(mountpoint);
    mountpoint.replicate();
  });

  var obsoleteMountpoints = this.mountpoints.reject(realMountpoints);
  obsoleteMountpoints.forEach(function(mountpoint) {
    self.mountpoints.remove(mountpoint);
    mountpoint.stopReplication();
  });
  this.emit('mountpoint-change');
};

RtpbroadcastReplicationPair.prototype.createMountpointFromInfo = function(infoData) {
  return new Mountpoint(this, infoData['id'], infoData['streams']);
};


module.exports = RtpbroadcastReplicationPair;
