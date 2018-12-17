var _ = require('lodash');
var Promise = require('bluebird');
var ConcurrencyError = require('tapeworm').ConcurrencyError;
var DuplicateCommitError = require('tapeworm').DuplicateCommitError;

var RemotePartition = function (client, partitionId) {
  this._client = client;
  this._partitionId = partitionId;
};

RemotePartition.prototype._promisify = function (value, callback) {
  return Promise.resolve(value).nodeify(callback);
};

RemotePartition.prototype.open = function () {
  var self = this;
  return new Promise((resolve) => {
    resolve(self);
  });
};

RemotePartition.prototype.loadSnapshot = function (streamId, callback) {
  var payload = {
    loadSnapshot: {
      streamId: streamId
    }
  };
  this._client.request(payload, callback)
};

RemotePartition.prototype.queryStream = function (streamId, fromEventSequence, callback) {
  if (typeof fromEventSequence === 'function') {
    callback = fromEventSequence;
    fromEventSequence = -1;
  }
  var payload = {
    queryCommits: {
      streamId: streamId,
      fromSequence: fromEventSequence
    }
  };
  this._client.request(payload, function (err, res) {
    callback(err, _.get(res, 'commits'))
  })
};

RemotePartition.prototype.truncateStreamFrom = function (streamId, commitSequence, remove, callback) {
  throw new Error('truncateStreamFrom Not supported for remote partition (read-only)');
};

RemotePartition.prototype.applyCommitHeader = function (commitId, header, callback) {
  throw new Error('_storeSnapshots Not supported for remote partition (read-only)');
};

RemotePartition.prototype._storeSnapshots = function (snapshots, callback) {
  throw new Error('_storeSnapshots Not supported for remote partition (read-only)');
};

RemotePartition.prototype.storeSnapshot = function (streamId, snapshot, version, callback) {
  throw new Error('_storeSnapshot Not supported for remote partition (read-only)');
};

RemotePartition.prototype.removeSnapshots = function (ids, callback) {
  throw new Error('removeSnapshots Not supported for remote partition (read-only)');
};

RemotePartition.prototype.append = function (commit, callback) {
  throw new Error('append Not supported for remote partition (read-only)');
};

RemotePartition.prototype.markAsDispatched = function (commit, callback) {
  throw Error('not implemented (read-only)');
};

RemotePartition.prototype.getUndispatched = function (callback) {
  throw Error('not implemented (read-only)');
};

RemotePartition.prototype.queryAll = function (callback) {
  throw new Error('queryAll Not supported for remote partition');
};

module.exports = RemotePartition;
