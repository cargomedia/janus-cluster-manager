function JanusServer(id, upstreamId, webSocketAddress) {
  this.id = id;
  this.upstreamId = upstreamId;
  this.upstream = null;
  this.webSocketAddress = webSocketAddress;
  this.connection = null;
  this.plugins = [];
}

JanusServer.prototype.addPlugin = function(plugin) {
  this.plugins.push(plugin);
};

JanusServer.prototype.onRegister = function() {
  this.plugins.forEach(function(plugin) {
    plugin.onRegister();
  });
};

JanusServer.prototype.onUnregister = function() {
  this.plugins.forEach(function(plugin) {
    plugin.onUnregister();
  });
};

JanusServer.prototype.openConnection = function() {
  if (null !== this.connection) {
    throw new Error('Connection already opened');
  }
  return janus.createConnection(this.webSocketAddress).then(function(connection) {
    this.connection = connection;
    return connection;
  }.bind(this))
};

JanusServer.prototype.getConnection = function() {
  if (null === this.connection) {
    throw new Error('Connection does not exist');
  }
  return this.connection;
};

JanusServer.prototype.setUpstream = function(server) {
  this.upstream = server;
  this.plugins.forEach(function(plugin) {
    plugin.onSetUpstream();
  });
};

module.exports = JanusServer;
