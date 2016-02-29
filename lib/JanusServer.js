var JanusConnection = require('janus-gateway-js').JanusConnection;

function JanusServer(id, webSocketAddress, data) {
  this.id = id;
  this.webSocketAddress = webSocketAddress;
  this.data = data;
  this.connection = null;
}

JanusServer.prototype.openConnection = function() {
  if (null !== this.connection) {
    throw new Error('Connection already opened');
  }
  var server = this;
  return JanusConnection.create('', {address: this.webSocketAddress}).open()
    .then(function(connection) {
      server.connection = connection;
      connection.on('close', function() {
        server.connection = null;
      });
      return connection;
    });
};

JanusServer.prototype.getConnection = function() {
  if (null === this.connection) {
    throw new Error('Connection does not exist');
  }
  return this.connection;
};

module.exports = JanusServer;
