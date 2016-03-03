var Promise = require('bluebird');
var util = require('util');
var EventEmitter = require('events');

function RtpbroadcastReplicationMountpoint(replicationPair, id) {
  RtpbroadcastReplicationMountpoint.super_.call(this);
  this.id = id;
  this.replicationPair = replicationPair;

  this.watchPlugin = null;
  this.createPlugin = null;
}

util.inherits(RtpbroadcastReplicationMountpoint, EventEmitter);


RtpbroadcastReplicationMountpoint.prototype.replicate = function() {
  var self = this;
  return self.stopReplication()
    .then(function() {
      return self._createMountpointOnDownstream();
    })
    .then(function(mountpointData) {
      return self._watchOnUpstream(mountpointData);
    })
    .then(function() {
      this.on('destroy', function() {
        self.replicate();
      });
    });
};

RtpbroadcastReplicationMountpoint.prototype.stopReplication = function() {
  this.removeListener('destroy');
  return this._stopWatchOnUpstream()
    .then(function() {
      return this._stopMountpointOnDownstream();
    }.bind(this));
};

RtpbroadcastReplicationMountpoint.prototype._createMountpointOnDownstream = function() {
  var self = this;
  return this.replicationPair.downstreamSession.attachPlugin('rtpbroadast')
    .then(function(plugin) {
      self.createPlugin = plugin;
      plugin.on('destroy', function() {
        self.createPlugin = null;
        self.emit('destroy');
      });
      return plugin;
    })
    .then(function(plugin) {
      return plugin.send('create-mountpoint').returns('mountpoint-data');
    });
};

RtpbroadcastReplicationMountpoint.prototype._stopMountpointOnDownstream = function() {
  if (null === this.createPlugin) {
    return Promise.resolve();
  }
  return this.createPlugin.destroy();
};

RtpbroadcastReplicationMountpoint.prototype._watchOnUpstream = function(mountpointData) {
  var self = this;
  return this.replicationPair.upstreamSession.attachPlugin('rtpbroadast')
    .then(function(plugin) {
      self.watchPlugin = plugin;
      plugin.on('destroy', function() {
        self.watchPlugin = null;
        self.emit('destroy');
      });
      return plugin;
    })
    .then(function(plugin) {
      return plugin.send('watch-udp', mountpointData);
    });
};

RtpbroadcastReplicationMountpoint.prototype._stopWatchOnUpstream = function() {
  if (null === this.watchPlugin) {
    return Promise.resolve();
  }
  return this.watchPlugin.destroy();
};

module.exports = RtpbroadcastReplicationMountpoint;
