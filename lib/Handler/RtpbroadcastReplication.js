var _ = require('underscore');
var Pair = require('./RtpbroadcastReplication/Pair');

function RtpbroadcastReplication(cluster) {
  var self = this;

  this.cluster = cluster;
  this.replicationPairs = [];

  this.cluster.on('register', function(server) {
    var upstreamId = server.data['rtpbroadcast']['upstream'];

    this.cluster.servers.forEach(function(upstream) {
      if (upstream.id === upstreamId) {
        self.replicationPairs.push(new Pair(server, upstream));
      }
    });

    this.cluster.servers.forEach(function(downstream) {
      if (downstream.upstreamId === server.id) {
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

RtpbroadcastReplication.prototype.findReplicationPairsByServer = function(server) {
  return _.findAll(this.replicationPairs, function(pair) {
    return pair.downstream === server || pair.upstream === server;
  });
};

module.exports = PluginRtpbroadcast;
