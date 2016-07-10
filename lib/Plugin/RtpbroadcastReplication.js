var util = require('util');
var _ = require('underscore');
var Pair = require('./RtpbroadcastReplication/Pair');
var Member = require('./RtpbroadcastReplication/Member');
var AbstractPlugin = require('./AbstractPlugin');

function RtpbroadcastReplication() {
  RtpbroadcastReplication.super_.call(this);
  
  var self = this;
  this.replicationPairs = [];

  this.cluster.on('register-member', function(member) {
    member.rtpbroadcast = Member.fromData(member.data['rtpbroadcast']);

    this.cluster.members.forEach(function(upstream) {
      if (upstream.id === member.rtpbroadcast.upstreamId) {
        self.replicationPairs.push(new Pair(member, upstream));
      }
    });

    this.cluster.members.forEach(function(downstream) {
      if (downstream.rtpbroadcast.upstreamId === member.id) {
        self.replicationPairs.push(new Pair(downstream, member));
      }
    });
  }.bind(this));

  this.cluster.on('unregister-member', function(member) {
    self.findReplicationPairsByMember(member).forEach(function(pair) {
      self.removePair(pair);
    });
  });
}

util.inherits(RtpbroadcastReplication, AbstractPlugin);

/**
 * @param {RtpbroadcastReplicationPair} pair
 */
RtpbroadcastReplication.prototype.removePair = function(pair) {
  this.replicationPairs = _.without(this.replicationPairs, pair);
};

/**
 * @param {Member} member
 * @returns {RtpbroadcastReplicationPair}
 */
RtpbroadcastReplication.prototype.findReplicationPairsByMember = function(member) {
  return _.select(this.replicationPairs, function(pair) {
    return pair.downstream === member || pair.upstream === member;
  });
};

/**
 * @returns {Member[]}
 */
RtpbroadcastReplication.prototype.getEdges = function() {
  return _.select(this.cluster.members, function(member) {
    return member.rtpbroadcast.role === Member.ROLES.EDGE;
  });
};

/**
 * @returns {Member|null}
 */
RtpbroadcastReplication.prototype.getEdge = function() {
  return _.chain(this.getEdges())
    .groupBy(function(member) {
      return member.rtpbroadcast.clients.length;
    })
    .toArray().first().shuffle().value().shift();
};

RtpbroadcastReplication.prototype.installHttpHandlers = function(router) {
  var plugin = this;
  router.get('/rtpbroadcast/edge-server', function(req, res, next) {
    var member = plugin.getEdge();
    if (!member) {
      res.send({error: 'Edge server not found'});
      return;
    }
    res.send({server: member});
  });
};

module.exports = RtpbroadcastReplication;
