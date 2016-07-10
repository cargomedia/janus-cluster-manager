var Promise = require('bluebird');
var util = require('util');
var EventEmitter = require('events');
var Context = require('../../context');
var log = require('../../logger').getLogger();

/**
 * @param {RtpbroadcastReplicationPair} replicationPair
 * @param {String} id
 * @constructor
 */
function RtpbroadcastReplicationMountpoint(replicationPair, id) {
  RtpbroadcastReplicationMountpoint.super_.call(this);
  this.id = id;
  this.replicationPair = replicationPair;

  this.watchPlugin = null;
  this.createPlugin = null;
}

util.inherits(RtpbroadcastReplicationMountpoint, EventEmitter);

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationMountpoint.prototype.replicate = function() {
  log.debug('Start replicate', new Context(this.toJSON()));
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

/**
 * @returns {Promise}
 */
RtpbroadcastReplicationMountpoint.prototype.stopReplication = function() {
  log.debug('Stop replication', new Context(this.toJSON()));
  this.removeListener('destroy');
  return this._stopWatchOnUpstream()
    .then(function() {
      return this._stopMountpointOnDownstream();
    }.bind(this));
};

/**
 * @returns {Promise}
 * @private
 */
RtpbroadcastReplicationMountpoint.prototype._createMountpointOnDownstream = function() {
  var logContext = new Context(this.toJSON());
  log.debug('Create mountpoint on downstream', logContext);
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
      log.debug('Mountpoint on downstream is created', logContext);
      return plugin.send('create-mountpoint').returns('mountpoint-data');
    });
};

/**
 * @returns {Promise}
 * @private
 */
RtpbroadcastReplicationMountpoint.prototype._stopMountpointOnDownstream = function() {
  log.debug('Stop mountpoint on downstream', new Context(this.toJSON()));
  if (null === this.createPlugin) {
    return Promise.resolve();
  }
  return this.createPlugin.destroy();
};

/**
 * @param {Object} mountpointData
 * @returns {Promise}
 * @private
 */
RtpbroadcastReplicationMountpoint.prototype._watchOnUpstream = function(mountpointData) {
  var logContext = new Context(this.toJSON());
  log.debug('Watch on upstream', logContext);
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
      log.debug('Watch on upstream is success', logContext);
      return plugin.send('watch-udp', mountpointData);
    });
};

/**
 * @returns {Promise}
 * @private
 */
RtpbroadcastReplicationMountpoint.prototype._stopWatchOnUpstream = function() {
  log.debug('Stop watch on upstream', new Context(this.toJSON()));
  if (null === this.watchPlugin) {
    return Promise.resolve();
  }
  return this.watchPlugin.destroy();
};

RtpbroadcastReplicationMountpoint.prototype.toJSON = function() {
  var pair = this.replicationPair;
  return {mountpoint: {id: this.id, pair: {downstream: pair.downstream.id, upstream: pair.upstream.id}}};
};

module.exports = RtpbroadcastReplicationMountpoint;
