var util = require('util');
var _ = require('underscore');
var Pair = require('./RtpbroadcastReplication/Pair');
var Member = require('./RtpbroadcastReplication/Member');
var AbstractPlugin = require('./AbstractPlugin');

function RtpbroadcastReplication() {
  AbstractPlugin.prototype.constructor.call(this);
  
  var self = this;
  this.replicationPairs = [];

  this.cluster.on('register', function(server) {
    server.rtpbroadcast = Member.fromData(server.data['rtpbroadcast']);

    this.cluster.servers.forEach(function(upstream) {
      if (upstream.id === server.rtpbroadcast.upstreamId) {
        self.replicationPairs.push(new Pair(server, upstream));
      }
    });

    this.cluster.servers.forEach(function(downstream) {
      if (downstream.rtpbroadcast.upstreamId === server.id) {
        self.replicationPairs.push(new Pair(downstream, server));
      }
    });
  }.bind(this));

  this.cluster.on('unregister', function(server) {
    self.findReplicationPairsByServer(server).forEach(function(pair) {
      self.removePair(pair);
    });
  });
}

util.inherits(RtpbroadcastReplication, AbstractPlugin);

RtpbroadcastReplication.prototype.removePair = function(pair) {
  this.replicationPairs = _.without(this.replicationPairs, pair);
};

RtpbroadcastReplication.prototype.findReplicationPairsByServer = function(server) {
  return _.findAll(this.replicationPairs, function(pair) {
    return pair.downstream === server || pair.upstream === server;
  });
};

RtpbroadcastReplication.prototype.getEdges = function() {
  return _.findAll(this.cluster.servers, function(server) {
    return server.rtpbroadcast.role === Member.ROLES.EDGE;
  });
};

RtpbroadcastReplication.prototype.getEdge = function() {
  return _.chain(this.getEdges())
    .groupBy(function(server) {
      return server.rtpbroadcast.clients.length;
    })
    .toArray().first().shuffle().value().shift();
};

module.exports = RtpbroadcastReplication;
