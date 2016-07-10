var _ = require('underscore');
var util = require('util');
var EventEmitter = require('events');

var Member = require('./Member');

function Cluster() {
  this.members = [];
  this.plugins = [];
}

util.inherits(Cluster, EventEmitter);

/**
 * @param {Member} member
 * @returns {Promise}
 */
Cluster.prototype.registerMember = function(member) {
  var self = this;
  if (self._hasMember(member)) {
    return Promise.reject(new Error('Member already present'));
  }

  return member.openConnection().then(function(connection) {
    self.addMember(member);
    self.emit('register-member', member);

    connection.on('close', function() {
      self.removeMember(member);
      self.emit('unregister-member', member);
    });
  });
};

/**
 * @param {Member} member
 */
Cluster.prototype.addMember = function(member) {
  this.members.push(member);
};

/**
 * @param {Member} member
 */
Cluster.prototype.removeMember = function(member) {
  this.members = _.without(this.members, member);
};

/**
 * @param {Member} member
 * @returns {Boolean}
 * @private
 */
Cluster.prototype._hasMember = function(member) {
  return _.contains(this.members, member);
};

/**
 * @param {AbstractPlugin} plugin
 */
Cluster.prototype.registerPlugin = function(plugin) {
  plugin.setCluster(this);
  this.plugins.push(plugin);
};

module.exports = Cluster;
