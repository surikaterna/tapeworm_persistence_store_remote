var _ = require('lodash');

module.exports.getLastAuthorizedCommitSequence = function(commits) {
	var commit = _.findLast(commits, function(commit) {return commit.authorative !== undefined ? commit.authorative : false});

	if(!commit) {
		return -1;
	} else {
		return commit.commitSequence;
	}
}

module.exports.getLastCommitSequence = function(commits) {
	if(!commits || commits.length === 0) {
		return -1;
	} else {
		return commits[commits.length-1].commitSequence;
	}
}

module.exports.commitsMatch = function(commit1, commit2) {
	return false;
}