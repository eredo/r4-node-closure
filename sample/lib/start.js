goog.provide('test.Start');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');

test.Start = function() {
  goog.base(this);
};
goog.inherits(test.Start, goog.events.EventTarget);

test.Start.prototype.test = function() {
  var evt = new goog.events.Event('test', this);
  this.dispatchEvent(evt);
};
