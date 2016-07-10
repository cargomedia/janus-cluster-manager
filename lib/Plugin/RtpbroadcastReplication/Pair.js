var util = require('util');
var EventEmitter = require('events');
var Promise = require('bluebird');
var Context = require('../../Context');
var log = require('../../Logger').getLogger();
var Mountpoint = require('./Mountpoint');
var MountpointList = require('./MountpointList');

/**
 * @param {Member} downstream
 * @param {Member} upstream
 * @constructor
 */
function RtpbroadcastReplicationPair(downstream, upstream) {
  RtpbroadcastReplicationPair.super_.call(this);
  
  /** @type {Member} */
  this.downstream = downstream;
  
  /** @type {Member} */
  this.upstream = upstream;

  this.downstreamSession = null;
  this.upstreamSession = null;
  
  /** @type {RtpbroadcastReplicationMountpointList} */
  this.mountpoints = new MountpointList();
  log.info('Created replica pair', new Context(this.toJSON()));
}

util.inherits(RtpbroadcastReplicationPair, EventEmitter);

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationPair.prototype.register = function() {
  var logContext = this.toJSON();
  log.debug('Registering replica pair', logContext);
  return Promise.all([
      this.openDownstreamSession(),
      this.openUpstreamSession()
    ])
    .then(function() {
      log.info('Registered replica pair', logContext);
      this.listenForMountpointInfo();
    }.bind(this))
    .catch(function(error) {
      log.warn('Failed register of replica pair', logContext.extend({exception: error}));
      throw error;
    });
};

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationPair.prototype.unregister = function() {
  var logContext = this.toJSON();
  log.debug('Removing replica pair', logContext);
  return Promise.all([
    this.closeDownstreamSession(),
    this.closeUpstreamSession()
  ]).then(function() {
    log.info('Removed replica pair', logContext);
  }).catch(function(error) {
    log.warn('Failed remove of replica pair', logContext.extend({exception: error}));
  });
};

/**
 * @returns {Promise}
 */
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

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationPair.prototype.openDownstreamSession = function() {
  if (this.downstreamSession) {
    throw new Error('Downstream session already present');
  }
  return this.downstream.getConnection().createSession()
    .then(function(session) {
      return this.downstreamSession = session;
    }.bind(this));
};

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationPair.prototype.closeDownstreamSession = function() {
  return this.downstreamSession.destroy().finally(function() {
    this.downstreamSession = null;
  }.bind(this));
};


/**
 * @returns {Promise}
 */
RtpbroadcastReplicationPair.prototype.openUpstreamSession = function() {
  if (this.upstreamSession) {
    throw new Error('Upstream session already present');
  }
  return this.upstream.getConnection().createSession()
    .then(function(session) {
      return this.upstreamSession = session;
    }.bind(this));
};

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationPair.prototype.closeUpstreamSession = function() {
  return this.upstreamSession.destroy().finally(function() {
    this.upstreamSession = null;
  }.bind(this));
};

/**
 * @param {Object} mountpointsData
 */
RtpbroadcastReplicationPair.prototype.updateMountpoints = function(mountpointsData) {
  log.debug('Updating mountpoints', this.toJSON());
  var realMountpoints = mountpointsData.map(function(mountpointInfo) {
    return this.createMountpointFromInfo(mountpointInfo);
  }.bind(this));

  var newMountpoints = this.difference(realMountpoints, this.mountpoints);
  newMountpoints.forEach(function(mountpoint) {
    this.mountpoints.add(mountpoint);
    mountpoint.replicate();
  }.bind(this));

  var obsoleteMountpoints = this.difference(this.mountpoints, realMountpoints);
  obsoleteMountpoints.forEach(function(mountpoint) {
    this.mountpoints.remove(mountpoint);
    mountpoint.stopReplication();
  }.bind(this));
  log.debug('Updated mountpoints', this.toJSON());
  this.emit('mountpoint-change');
};

/**
 * @param {Object} infoData
 * @returns {RtpbroadcastReplicationMountpoint}
 */
RtpbroadcastReplicationPair.prototype.createMountpointFromInfo = function(infoData) {
  return new Mountpoint(this, infoData['id'], infoData['streams']);
};

/**
 * @param {RtpbroadcastReplicationMountpoint[]} mountpoints1
 * @param {RtpbroadcastReplicationMountpoint[]} mountpoints2
 * @returns {Array}
 */
RtpbroadcastReplicationPair.prototype.difference = function(mountpoints1, mountpoints2) {
  return _.reject(mountpoints1, function(mountpoint1) {
    return _.find(mountpoints2,
      function(mountpoint2) {
        return mountpoint1.id === mountpoint2.id;
      });
  });
};

RtpbroadcastReplicationPair.prototype.toJSON = function() {
  return {'replica-pair': {downstream: this.downstream.toJSON(), upstream: this.upstream.toJSON(), mountpoints: this.mountpoints.toJSON()}};
};

module.exports = RtpbroadcastReplicationPair;
