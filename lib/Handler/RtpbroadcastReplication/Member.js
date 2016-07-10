var RtpbroadcastReplicationMember = function(role, upstream) {
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
