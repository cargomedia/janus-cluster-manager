var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var requestPromise = require('request-promise');
var Promise = require('bluebird');

var HttpServer = require('../../lib/HttpServer');
var Cluster = require('../../lib/Cluster');
var Member = require('../../lib/Member');

var port = 8800;

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
    cluster.plugins = [];
    httpServer = new HttpServer(port, cluster);
  });

  it('should store port and cluster', function() {
    expect(httpServer.port).to.be.equal(port);
    expect(httpServer.cluster).to.be.equal(cluster);
  });

  context('when running', function() {

    before(function(done) {
      httpServer.start().then(done, done);
    });

    context('when receives /register request', function() {
      var requestRegister;

      before(function() {
        cluster.registerMember.returns(Promise.resolve());
        requestRegister = function() {
          return request('POST', 'register', {id: 'server-id', webSocketAddress: 'websocket-address', data: 'additional-data'});
        }
      });

      it('should register', function(done) {
        requestRegister().finally(function() {
          expect(cluster.registerMember.callCount).to.be.equal(1);
          var server = cluster.registerMember.firstCall.args[0];
          expect(server).to.be.instanceOf(Member);
          expect(server.id).to.be.equal('server-id');
          expect(server.webSocketAddress).to.be.equal('websocket-address');
          expect(server.data).to.be.equal('additional-data');
          done();
        });
      });

      context('on successful cluster register', function() {
        it('should send success', function(done) {
          requestRegister().then(function(response) {
            expect(response).have.property('success', 'Member registered');
            done();
          }).catch(done);
        });
      });

      context('on unsuccessful register', function() {

        beforeEach(function() {
          cluster.registerMember.restore();
          sinon.stub(cluster, 'registerMember', function() {
            return Promise.reject(new Error('register-error'));
          });
        });

        it('should send error', function(done) {
          requestRegister().then(function(response) {
            
            expect(response).have.property('error', 'Could not register member: register-error');
            done();
          }).catch(done);
        });
      });
    });
  });
});
