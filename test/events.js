var test      = require('tape');
var _         = require('underscore');
var Eventable = require('../lib/Eventable.js');

function keyCount(h) { return _.keys(h).length; }

test('Basic callback adding and removing with on/off', function(t) {

  var o    = new Eventable();
  var cb   = function() { };
  var name = 'e';

  t.plan(3);

  o.on(name, cb);
  t.strictEqual(keyCount(o.__events), 1, 'using on() adds to __events');
  o.off(name, cb);
  t.strictEqual(keyCount(o.__events), 0, 'using off() removes event node when empty');

  o = new Eventable();
  o.on(name, cb);
  o.off();
  t.deepEqual(o.__events, {}, 'off() clears all');

});

test('Basic callback adding/removing with listenTo and stopListening', function(t) {
  var name = 'e';
  var o = new Eventable();
  var p = new Eventable();
  function f() { t.strictEqual(this, p, 'listenTo cb in correct context'); } 

  t.plan(6);

  p.listenTo(o, name, f);
  t.strictEqual(keyCount(p.__listeningTo), 1, 'listeningTo updated on listenTo');
  t.strictEqual(p.__listeningTo[o.__listenId], o, 'listenId setup');
  t.strictEqual(keyCount(o.__events), 1, 'event handler added to listenee');
  o.trigger(name); // fire
  p.stopListening(o);
  t.strictEqual(keyCount(o.__events), 0, 'events empty');
  t.strictEqual(keyCount(p.__listeningTo), 0, 'listening empty');
});

test('Value of this when left unset', function(t) {
  var name = 'e';
  var o = new Eventable();

  t.plan(2);

  o.on(name, function() {
    t.strictEqual(this, o, 'callback with on() is same as object');
  });

  o.trigger(name); // fire

  o = new Eventable();
  var p = new Eventable();
  p.listenTo(o, name, function() {
    t.strictEqual(this, p, 'set with listenTo is object that is listening');
  });
  o.trigger(name); // fire
});
