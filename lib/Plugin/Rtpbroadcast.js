var _ = require('underscore');
var Mountpoint = require('mountpoint');

function PluginRtpbroadcast(server) {
  this.server = server;
  this.mountpoints = [];
  this.infoSession = null;
  this.createSession = null;
  this.watchUpstreamSession = null;
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
    this.closeCreateSession(),
    this.closeWatchUpstreamSession()
  ]);
};

PluginRtpbroadcast.prototype.onSetUpstream = function() {
  if (null === this.upstream) {
    this.upstream.off('mountpoint-change');
    return Promise.all([
      this.closeCreateSession(),
      this.closeWatchUpstreamSession()
    ]);
  } else {
    this.upstream.on('mountpoint-change', this.replicateUpstreamMountpoints.bind(this));
    return Promise.all([
      this.openCreateSession(),
      this.openWatchUpstreamSession()
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
  return this.getCreateSession()
    .then(function(session) {
      return session.attachPlugin('rtpbroadcast');
    })
    .then(function(plugin) {
      // probably should check transaction response
      return plugin.send('create-mountpoint', mountpointId);
    });
};

PluginRtpbroadcast.prototype.removeMountpoint = function(mountpoint) {
  this.getCreateSession().detachPlugin(mountpoint.pluginId);
};


PluginRtpbroadcast.prototype.openCreateSession = function() {
  if (this.createSession) {
    throw new Error('Mountpoints session already present');
  }
  return this.server.getConnection()
    .then(function(connection) {
      return this.createSession = connection.createSession();
    }.bind(this));
};

PluginRtpbroadcast.prototype.getCreateSession = function() {
  return this.createSession;
};

PluginRtpbroadcast.prototype.closeCreateSession = function() {
  return this.createSession.destroy().finally(function() {
    this.createSession = null;
  }.bind(this));
};


PluginRtpbroadcast.prototype.openWatchUpstreamSession = function() {
  if (this.watchUpstreamSession) {
    throw new Error('Watch session already present');
  }
  return this.server.upstream.getConnection()
    .then(function(connection) {
      return this.watchUpstreamSession = connection.createSession();
    }.bind(this));
};

PluginRtpbroadcast.prototype.getWatchUpstreamSession = function() {
  return this.watchUpstreamSession;
};

PluginRtpbroadcast.prototype.closeWatchUpstreamSession = function() {
  return this.watchUpstreamSession.destroy().finally(function() {
    this.watchUpstreamSession = null;
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
  return this.getWatchUpstreamSession()
    .then(function(session) {
      return session.attachPlugin('rtpbroadcast');
    })
    .then(function(plugin) {
      return plugin.sendTransaction('watch-udp');
    });
};

PluginRtpbroadcast.prototype.stopWatchUpstream = function(mountpoint) {
  return this.getWatchUpstreamSession().detachPlugin(mountpoint.pluginId);
};

PluginRtpbroadcast.prototype.differentMountpoints = function(mountpoints1, mountpoints2) {
  return _.reject(this.mountpoints, function(mountpoint) {
    return _.find(realMountpoints, function(realMountpoint) {
      return realMountpoint.id === mountpoint.id;
    });
  });
};

module.exports = PluginRtpbroadcast;
