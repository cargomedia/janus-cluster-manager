function JanusServer(id, webSocketAddress) {
  this.id = id;
  this.webSocketAddress = webSocketAddress;
  this.connection = null;
}

JanusServer.prototype.openConnection = function() {
  var self = this;
  if (null !== this.connection) {
    throw new Error('Connection already opened');
  }
  return janus.createConnection(this.webSocketAddress).then(function(connection) {
    self.connection = connection;
    connection.on('close', function() {
      self.connection = null;
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
