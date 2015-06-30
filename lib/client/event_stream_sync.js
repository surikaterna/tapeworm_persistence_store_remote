var _ = require('lodash');
var util = require('./util');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var JobQueue = require('@surikat/job-queue');

var EventStreamSynchronizer = function(tapewormPartition) {
	EventEmitter.call(this);
	this._partition = tapewormPartition;
}

inherits(EventStreamSynchronizer, EventEmitter);



/**
 * commits arrived form server
 */
EventStreamSynchronizer.prototype._processCommits = function(commits, streamId) {
	var self = this;
	return this._partition._queryStream(streamId).then(function(localCommits) {
		return self._processCommitsLocal(commits, localCommits, streamId);
	});
}

EventStreamSynchronizer.prototype._processCommitsLocal = function(commits, localCommits, streamId) {
	var skipSeq = util.getLastAuthorizedCommitSequence(localCommits);
	var lastLocalSeq = util.getLastCommitSequence(localCommits);
	var seenSequence = lastLocalSeq;
	for(var i=0; i<commits.length; i++) {
		var commit = commits[i];
	
		//do we need to process this commit
		if(commit.commitSequence > skipSeq) {
			var result = this._processCommit(commit, commits, localCommits, streamId, seenSequence);
			if(result === false) {
				return;
			}
		}
	};

};

EventStreamSynchronizer.prototype._processCommit = function(commit, commits, localCommits, streamId, seenSequence) {
	var matchingLocalCommit = _.find(localCommits, {commitSequence:commit.commitSequence});
	//no such commit locally. just appen
	if(!matchingLocalCommit) {
		this._applyNewCommit(commit, seenSequence);
	} else {
		console.log("matching");
		//check if matching commits
		return this._applyMergeCommit(commit, matchingLocalCommit, streamId, commits);
	}
	return true;
};

EventStreamSynchronizer.prototype._applyMergeCommit = function(commit, localCommit, streamId, commits) {
	var self = this;
	//similiar enough, just marking this commit was approved by server
	if(util.commitsMatch(commit, localCommit)) {
		this._partition._applyCommitHeader(localCommit, {authorative:true});
	} else {
		//streams out of sync... :'(
		self.emit('conflict', streamId);
		return false;
		self._partition._truncateStreamFrom(streamId, commit.commitSequence).then(function() {
			var i = _.findIndex(commits, {id:commit.id});
			return self._partition.append(_.drop(commits,i+1));
		});
	}	
	return true;
}

EventStreamSynchronizer.prototype._applyNewCommit = function(commit, seenSequence) {
	var newSeq = seenSequence+1;
	if(newSeq === commit.commitSequence) {
		return this._partition.append(commit);
		
	} else {
		throw new Error("Missing commits, gap in commit sequence local: " + newSeq + " server: " + commit.commitSequence);
	}
	// body...
};

module.exports = EventStreamSynchronizer;