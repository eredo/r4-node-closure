require(__dirname + '/../../lib/runtime.js');

goog.provide('test.App');
goog.require('test.Start');

var bla = new test.Start();
bla.addEventListener('test', function(evt) {
  console.log('Event fired', evt);
});
bla.test();
