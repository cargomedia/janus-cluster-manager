var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var requestPromise = require('request-promise');
var Promise = require('bluebird');

var HttpServer = require('../../lib/HttpServer');
var Cluster = require('../../lib/Cluster');

var port = 8888;

var request = function(method, path, data) {
  var options = {
    method: method,
    uri: 'http://localhost:' + port + '/' + path,
    body: data || {},
    json: true
  };
  return requestPromise(options);
};

describe('HttpServer', function() {
  var httpServer, cluster;

  before(function() {
    cluster = sinon.createStubInstance(Cluster);
    httpServer = new HttpServer(port, cluster);

  });

  it('should store port and cluster', function() {
    expect(httpServer.port).to.be.equal(port);
    expect(httpServer.cluster).to.be.equal(cluster);
  });

  context('when running', function() {

    before(function(done) {
      httpServer.start().then(done);
    });

    context('when receives /register request', function() {
      var requestRegister;

      before(function() {
        cluster.register.returns(Promise.resolve());
        requestRegister = function() {
          return request('POST', 'register', {id: 'server-id', upstreamId: 'upstream-id', webSocketAddress: 'websocket-address'});
        }
      });

      it('should register', function(done) {
        requestRegister().finally(function() {
          expect(cluster.register.callCount).to.be.equal(1);
          done();
        });
      });

      context('on successful cluster register', function() {
        it('should send success', function(done) {
          requestRegister().then(function(response) {
            expect(response).have.property('success', 'Server registered');
            done();
          }).catch(done);
        });
      });

      context('on unsuccessful register', function() {

        beforeEach(function() {
          cluster.register.restore();
          sinon.stub(cluster, 'register', function() {
            return Promise.reject(new Error('register-error'));
          });
        });

        it('should send error', function(done) {
          requestRegister().then(function(response) {
            expect(response).have.property('error', 'Could not register server: register-error');
            done();
          }).catch(done);
        });
      });
    });
  });
});
