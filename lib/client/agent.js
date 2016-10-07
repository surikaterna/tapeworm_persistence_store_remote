var Subscriber = require('./event_stream_sub');
var Synchronizer = require('./event_stream_sync');
var Client = require('./rrtw_client');
var util = require('./util');

var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Agent = function(socket, partition) {
	EventEmitter.call(this);
	this._client = new Client(socket, '/tw');
	this._partition = partition;
	this._synchronizer = new Synchronizer(this._partition);
	this._subscriber = new Subscriber(this._client, this._versionProvider.bind(this), this._commitsCallback.bind(this));
}

inherits(Agent, EventEmitter);

Agent.prototype.start = function() {
	// :)
};


Agent.prototype.stop = function() {
	// :(
};

Agent.prototype.subscribe = function(streamId) {
	var handle = this._subscriber.subscribe(streamId);
	return handle;
}

Agent.prototype._commitsCallback = function(commits) {
	var self = this;
	if(commits && commits.length > 0) {
		var commit = commits[0];
		var streamId = commit.streamId;
		var aggregateType = commit.aggregateType;
		this._synchronizer._processCommits(commits, streamId).then(function(conflicted) {
			// console.log("MERGE RESULT: " + conflicted);
			if(conflicted) {
				self.emit('conflict', {
					streamId: streamId,
					aggregateType: aggregateType
				});
			}
		});
	}
};
Agent.prototype._versionProvider = function(streamId) {
	// console.log(">>" + streamId);
	return this._partition._queryStream(streamId).then(function(localCommits) {
		// console.log(">>" + localCommits.length);
		var lastCommit = util.getLastAuthorizedCommitSequence(localCommits);
		return lastCommit;
	});
}

module.exports = Agent;