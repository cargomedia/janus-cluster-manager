var Context = require('./context');
var log = require('./logger').getLogger();
var JanusConnection = require('janus-gateway-js').JanusConnection;

function Member(id, webSocketAddress, data) {
  this.id = id;
  this.webSocketAddress = webSocketAddress;
  this.data = data;
  this.connection = null;
}

Member.prototype.openConnection = function() {
  if (null !== this.connection) {
    return Promise.reject(new Error('Connection already opened'));
  }
  var member = this;
  return JanusConnection.create('', {address: this.webSocketAddress}).open()
    .then(function(connection) {
      var logContext = new Context(member.toJSON());
      log.info('New member is registered', logContext);
      member.connection = connection;
      connection.on('close', function() {
        log.info('Member\' connection closed', logContext);
        member.connection = null;
      });
      return connection;
    });
};

Member.prototype.getConnection = function() {
  if (null === this.connection) {
    throw new Error('Connection does not exist');
  }
  return this.connection;
};

Member.prototype.toJSON = function() {
  return {id: this.id, webSocketAddress: this.webSocketAddress};
};

module.exports = Member;
