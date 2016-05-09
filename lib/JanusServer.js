var Context = require('./context');
var log = require('./logger').getLogger();
var JanusConnection = require('janus-gateway-js').JanusConnection;

function JanusServer(id, webSocketAddress, data) {
  this.id = id;
  this.webSocketAddress = webSocketAddress;
  this.data = data;
  this.connection = null;
}

JanusServer.prototype.openConnection = function() {
  if (null !== this.connection) {
    return Promise.reject(new Error('Connection already opened'));
  }
  var server = this;
  return JanusConnection.create('', {address: this.webSocketAddress}).open()
    .then(function(connection) {
      var logContext = new Context(server.toJSON());
      log.info('New janus server is registered', logContext);
      server.connection = connection;
      connection.on('close', function() {
        log.info('Janus server is closed', logContext);
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

JanusServer.prototype.toJSON = function() {
  return {'janus-server': {id: this.id, webSocketAddress: this.webSocketAddress}};
};

module.exports = JanusServer;
