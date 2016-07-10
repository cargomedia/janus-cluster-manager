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
Cluster.prototype.register = function(member) {
  var self = this;
  if (self._has(member)) {
    return Promise.reject(new Error('Member already present'));
  }

  return member.openConnection().then(function(connection) {
    self.add(member);
    self.emit('register', member);

    connection.on('close', function() {
      self.remove(member);
      self.emit('unregister', member);
    });
  });
};

/**
 * @param {Member} member
 */
Cluster.prototype.add = function(member) {
  this.members.push(member);
};

/**
 * @param {Member} member
 */
Cluster.prototype.remove = function(member) {
  this.members = _.without(this.members, member);
};

/**
 * @param {Member} member
 * @returns {Boolean}
 * @private
 */
Cluster.prototype._has = function(member) {
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
