var _ = require('underscore');

/**
 * @param {String} role
 * @param {String} upstream
 * @constructor
 */
var RtpbroadcastReplicationMember = function(role, upstream) {
  if (_.isUndefined(RtpbroadcastReplicationMember.ROLES[role])) {
    throw new Error('Invalid role');
  }
  this.role = role;
  this.upstreamId = upstream;
  this.clients = [];
};

/**
 * @param {Object} data
 * @returns {RtpbroadcastReplicationMember}
 */
RtpbroadcastReplicationMember.fromData = function(data) {
  return new RtpbroadcastReplicationMember(data['role'], data['upstream']);
};

RtpbroadcastReplicationMember.ROLES = {
  EDGE: 'edge',
  REPEATER: 'repeater',
  ORIGIN: 'origin'
};

module.exports = RtpbroadcastReplicationMember;
