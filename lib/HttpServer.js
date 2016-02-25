var _ = require('underscore');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var Promise = require('bluebird');

/**
 * @param {Number} port
 * @param {Cluster} cluster
 * @constructor
 */
function HttpServer(port, cluster) {
  this.port = port;
  this.cluster = cluster;

  var app = express();
  var router = express.Router();
  this.server = http.createServer(app);

  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(router);
  app.disable('x-powered-by');
  app.disable('etag');

  router.post('/register', this.register.bind(this));

  app.use(function(err, req, res, next) {
    var errorMessage = err.message || 'Unexpected error';
    serviceLocator.get('logger').error(errorMessage);
    res.status(err.code || 500).send({error: errorMessage});
  });
}

HttpServer.prototype.register = function(req, res, next) {
  var params = _.extend({}, req.params, req.body);
  var id = params['id'];
  var upstreamId = params['upstreamId'];
  var webSocketAddress = params['webSocketAddress'];

  this.cluster.register(id, upstreamId, webSocketAddress)
    .then(function() {
      next();
    })
    .catch(next);
};

HttpServer.prototype.start = function() {
  var self = this;
  return new Promise(function(resolve) {
      self.server.listen(self.port, function() {
        resolve();
      });
    }
  );
};

module.exports = HttpServer;
