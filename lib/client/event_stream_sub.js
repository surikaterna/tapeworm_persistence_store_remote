var _ = require('lodash');

var EventStreamSubscriber = function(client, versionProvider) {
	this._subscriptions = {};

	this._versionProvider = versionProvider;
	this._client = client;
}

EventStreamSubscriber.prototype.subscribe = function(streamId) {
	var self = this;
	var sub = this._subscriptions[streamId];
	if(!sub) {
		sub = { count:0, handle: {stop: function() {
			if(!sub.count) {
				throw new Error("Subscription already destroyed");
			}
			else if(--sub.count === 0) {
				self._destroySubscription(sub);
				delete self._subscriptions[streamId];
			}
		}}};
		this._subscriptions[streamId] = sub;
	}
	sub.count++;
	if(sub.count===1) {
		//first subscription for this stream
		self._createSubscription(sub, streamId);
	}
	return sub.handle;
}

EventStreamSubscriber.prototype.activeStreams = function() {
	return _.keys(this._subscriptions);
}

EventStreamSubscriber.prototype._createSubscription = function(sub, streamId) {
	var self = this;
	var currentSequence = 0;
	/*this._getStreamVersion(streamId).then(function(currentSequence) {

	});
	*/
	sub._handle = this._client.subscribe("/tw/subscribe", {streamId: streamId, fromSequence:currentSequence}, function(pkg) {
		console.log(pkg);
		self._publish(pkg.commits);
	});
};

EventStreamSubscriber.prototype._destroySubscription = function(sub, streamId) {
	sub._handle.stop();
};

EventStreamSubscriber.prototype._publish = function(commits) {
	console.log("Commits");
};

module.exports = EventStreamSubscriber;