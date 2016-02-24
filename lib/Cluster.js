var _ = require('underscore');
var Server = require('./JanusServer');
var PluginRtpbroadcast = require('./Plugin/Rtpbroadcast');

function Cluster() {
  this.servers = [];
  this.plugins = [];
  this.plugins.push(PluginRtpbroadcast);
}

Cluster.prototype.hasServer = function(server) {
  return _.contains(this.servers, server);
};

Cluster.prototype.register = function(serverId, upstreamId, webSocketAddres) {
  var server = new Server(serverId, upstreamId, webSocketAddres);
  this.plugins.forEach(function(plugin) {
    server.addPlugin(new plugin(server));
  });

  if (this.hasServer(server)) {
    throw new Error('Server already present');
  }
  this._addServer(server);
  return server.openConnection().then(function(connection) {
    _.each(this.findServersByUpstream(server), function(child){
      child.setUpstream(server);
    });
    server.onRegister();
    connection.on('close', function() {
      this.unregister(server);
    }.bind(this));
  }.bind(this));
};

Cluster.prototype.unregister = function(server) {
  _.each(this.findServersByUpstream(server), function(child){
    child.setUpstream(null);
  });
  server.onUnregister();
  this._removeServer(server);
};

Cluster.prototype._removeServer = function(server) {
  this.servers = _.without(this.servers, server);
};

Cluster.prototype._addServer = function(server) {
  this.servers.push(server);
};

Cluster.prototype.findServersByUpstream = function(upstream) {
  return _.findAll(this.servers, function(server) {
    return server.upstreamId = upstream.id;
  });
};

module.exports = Cluster;
