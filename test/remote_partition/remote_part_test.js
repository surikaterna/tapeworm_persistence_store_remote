var should = require('should');
var Tapeworm = require('tapeworm');
var Commit = require('tapeworm').Commit;
var SocketMock = require('socket.io-mock');
var TapewormSyncServer = require('../../lib/server');
var RemoteDriver = require('../../lib/client/remote_persistence');
var Client = require('../../lib/client/rrtw_client');

var autobus = {
  leave: function () {}
};

describe('Remote server/client', function () {
  var socketServer, socketClient, clientTapeworm, tapeworm, serverPartition = null, clientPartition = null;

  beforeEach(function (done) {
    socketServer = new SocketMock();
    socketClient = socketServer.socketClient;
    var rrtwClient = new Client(socketClient, '/tw');
    var remotePartition = new RemoteDriver(rrtwClient, 'blondie');

    clientTapeworm = new Tapeworm(remotePartition);

    tapeworm = new Tapeworm();
    tapeworm.openPartition('blondie').then(function(blondie) {
      serverPartition = blondie;
      clientTapeworm.openPartition('blondie').then(function (blondie2) {
        clientPartition = blondie2;
        done();
      });
    });
  });

  it('#socketMock should work', function (done) {
    socketClient.on('ping', function (message) {
      message.should.equal('Hello');
      socketClient.emit('pong', 'heya');
    });
    socketServer.on('pong', function (message) {
      message.should.equal('heya');
      done();
    });
    socketServer.emit('ping', 'Hello');
  });

  it.only('#server should work', function (done) {
    const tapewormSyncServer = new TapewormSyncServer(serverPartition, autobus);
    serverPartition.storeSnapshot('1', { test: 'success' }, 2, function () {
      clientPartition.loadSnapshot('1', function (err, res) {
        res.snapshot.test.should.equal('success');
        done();
      });
    });
    tapewormSyncServer.addSocket(socketServer);
  });
});
