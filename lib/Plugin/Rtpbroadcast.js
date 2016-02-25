var _ = require('underscore');
var Mountpoint = require('./Rtpbroadcast/Mountpoint');

function PluginRtpbroadcast(server) {
  this.server = server;
  this.mountpoints = [];
  this.infoSession = null;
  this.mountpointsSession = null;
  this.watchSession = null;
}

PluginRtpbroadcast.prototype.getUpstreamPlugin = function() {
  return _.find(this.server.upstream.plugins, function(plugin) {
    return plugin instanceof this.constructor;
  }.bind(this));
};

PluginRtpbroadcast.prototype.onRegister = function() {
  return this.listenForMountpointInfo();
};

PluginRtpbroadcast.prototype.onUnregister = function() {
  return Promise.all([
    this.closeInfoSession(),
    this.closeMountpointsSession(),
    this.closeWatchSession()
  ]);
};

PluginRtpbroadcast.prototype.onSetUpstream = function() {
  if (null === this.upstream) {
    this.upstream.off('mountpoint-change');
    return Promise.all([
      this.closeMountpointsSession(),
      this.closeWatchSession()
    ]);
  } else {
    this.upstream.on('mountpoint-change', this.replicateUpstreamMountpoints.bind(this));
    return Promise.all([
      this.openMountpointsSession(),
      this.openWatchSession()
    ]).then(function() {
      this.replicateUpstreamMountpoints();
    }.bind(this))
  }
};


PluginRtpbroadcast.prototype.listenForMountpointInfo = function() {
  var self = this;
  return this.server.getConnection()
    .then(function(connection) {
      return self.infoSession = connection.createSession();
    })
    .then(function(session) {
      return session.attachPlugin('rtpbroadcast');
    })
    .then(function(plugin) {
      plugin.on('message', function(message) {
        if (message['body']['request'] === 'mountpoint-info') {
          self.updateMountpoints(message['body']['data']);
        }
      });
      // add transaction
      return plugin.sendTransaction('upgrade connection');
    });
};

PluginRtpbroadcast.prototype.closeInfoSession = function() {
  return this.infoSession.destroy().finally(function() {
    this.infoSession = null;
  }.bind(this));
};

PluginRtpbroadcast.prototype.replicateUpstreamMountpoints = function() {
  var upstreamMountpointsIds = _.pluck(this.getUpstreamPlugin().mountpoints, 'id');
  var mountpointsIds = _.pluck(this.mountpoints, 'id');

  _.difference(upstreamMountpointsIds, mountpointsIds).forEach(function(mountpointId) {
    this.removeMountpoint(mountpointId);
  }.bind(this));

  this.differentMountpoints(mountpointsIds, upstreamMountpointsIds).forEach(function(mountpointId) {
    this.createMountpoint(mountpointId);
  }.bind(this));
};

PluginRtpbroadcast.prototype.createMountpoint = function(mountpointId) {
  return this.getMountpointsSession()
    .then(function(session) {
      return session.attachPlugin('rtpbroadcast');
    })
    .then(function(plugin) {
      // probably should check transaction response
      return plugin.send('create-mountpoint', mountpointId);
    });
};

PluginRtpbroadcast.prototype.removeMountpoint = function(mountpoint) {
  this.getMountpointsSession().detachPlugin(mountpoint.pluginId);
};


PluginRtpbroadcast.prototype.openMountpointsSession = function() {
  if (this.mountpointsSession) {
    throw new Error('Mountpoints session already present');
  }
  return this.server.getConnection()
    .then(function(connection) {
      return this.mountpointsSession = connection.createSession();
    }.bind(this));
};

PluginRtpbroadcast.prototype.getMountpointsSession = function() {
  return this.mountpointsSession;
};

PluginRtpbroadcast.prototype.closeMountpointsSession = function() {
  return this.mountpointsSession.destroy().finally(function() {
    this.mountpointsSession = null;
  }.bind(this));
};


PluginRtpbroadcast.prototype.openWatchSession = function() {
  if (this.watchSession) {
    throw new Error('Watch session already present');
  }
  return this.server.upstream.getConnection()
    .then(function(connection) {
      return this.watchSession = connection.createSession();
    }.bind(this));
};

PluginRtpbroadcast.prototype.getWatchSession = function() {
  return this.watchSession;
};

PluginRtpbroadcast.prototype.closeWatchSession = function() {
  return this.watchSession.destroy().finally(function() {
    this.watchSession = null;
  }.bind(this));
};


PluginRtpbroadcast.prototype.updateMountpoints = function(mountpointsData) {
  var realMountpoints = mountpointsData.map(function(mountpointInfo) {
    return new Mountpoint(this, mountpointInfo['id'], mountpointInfo['pluginId']);
  }.bind(this));

  this.differentMountpoints(realMountpoints, this.mountpoints).forEach(function(mountpoint) {
    this.watchUpstream(mountpoint);
  }.bind(this));

  this.differentMountpoints(this.mountpoints, realMountpoints).forEach(function(mountpoint) {
    this.stopWatchUpstream(mountpoint);
  }.bind(this));

  this.mountpoints = realMountpoints;
  this.emit('mountpoint-change');
};

PluginRtpbroadcast.prototype.watchUpstream = function() {
  return this.getWatchSession()
    .then(function(session) {
      return session.attachPlugin('rtpbroadcast');
    })
    .then(function(plugin) {
      return plugin.sendTransaction('watch-udp');
    });
};

PluginRtpbroadcast.prototype.stopWatchUpstream = function(mountpoint) {
  return this.getWatchSession().detachPlugin(mountpoint.pluginId);
};

PluginRtpbroadcast.prototype.differentMountpoints = function(mountpoints1, mountpoints2) {
  return _.reject(this.mountpoints, function(mountpoint) {
    return _.find(realMountpoints, function(realMountpoint) {
      return realMountpoint.id === mountpoint.id;
    });
  });
};

module.exports = PluginRtpbroadcast;
