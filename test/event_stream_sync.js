var Tapeworm = require('tapeworm');
var Commit = require('tapeworm').Commit;

var should = require('should');

var EventStreamSynchronizer = require('..').Client.EventStreamSynchronizer;

function getSynchronizer() {

 	return new EventStreamSynchronizer();
}

describe('EventStreamSynchronizer', function() {
	var tapeworm = null;
	var part = null;
	var synchronizer = null;

	beforeEach(function(done) {
		tapeworm = new Tapeworm();
		tapeworm.openPartition('blondie').then(function(blondie) {
			part = blondie;
			synchronizer = new EventStreamSynchronizer(part);
			done();
		});
	})

	describe('#_processCommits', function() {
		it('should do nothing if commits matches', function(done) {
			var commits = [new Commit('1', 'location', '1', 0, [{id:'1', type:'alloha'}]), new Commit('2', 'location', '1', 1, [{id:'2', type:'alloha'}])];
			part.append(commits).then(function() {
				synchronizer._processCommits(commits, '1');
				done();
			});
		});
	});
	describe('#_applyNewCommit', function() {

		it('should add if seq ok', function(done) {
			var commits = [new Commit('1', 'location', '1', 0, [{id:'1', type:'alloha'}]), new Commit('2', 'location', '1', 1, [{id:'2', type:'alloha'}])];
			part.append(commits).then(function() {
				synchronizer._applyNewCommit(new Commit('3', 'location', '1', 2, [{id:'1', type:'alloha'}]), 1).then(function() {
					done();
				});
			});
		});
		it('should throw if skipping seq', function(done) {
			var commits = [new Commit('1', 'location', '1', 0, [{id:'1', type:'alloha'}]), new Commit('2', 'location', '1', 1, [{id:'2', type:'alloha'}])];
			part.append(commits).then(function() {
				should.throws(function() {
					synchronizer._applyNewCommit(new Commit('3', 'location', '1', 3, [{id:'1', type:'alloha'}]), 1).then(function() {
					});
				});
				done();
			});
		});

	});

});
