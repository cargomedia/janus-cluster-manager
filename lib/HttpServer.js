var _ = require('underscore');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var Context = require('./context');
var log = require('./logger').getLogger();

var JanusServer = require('./JanusServer');

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
}

HttpServer.prototype.register = function(req, res, next) {
  var params = _.extend({}, req.params, req.body);
  var logContext = new Context({httpRequest: params});
  log.debug('Registering janus server', logContext);

  var id = params['id'];
  var webSocketAddress = params['webSocketAddress'];
  var data = params['data'];
  var server = new JanusServer(id, webSocketAddress, data);

  this.cluster.register(server)
    .then(function() {
      res.send({success: 'Server registered'});
      return next();
    }).catch(function(error) {
      log.error('Could not register janus server', logContext.extend({exception: error}));
      res.send({error: 'Could not register server: ' + error.message});
      return next();
    });
};

HttpServer.prototype.start = function() {
  var self = this;
  return new Promise(function(resolve) {
      self.server.listen(self.port, function() {
        log.info('Http server started at port ' + self.port);
        resolve();
      });
    }
  );
};

module.exports = HttpServer;
