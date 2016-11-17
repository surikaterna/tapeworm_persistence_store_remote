var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var Handle = function (stop) {
  EventEmitter.call(this);
  this.stop = stop;
};
inherits(Handle, EventEmitter);

module.exports = Handle;
