var extends_   = require('typedef').extends;
var test       = require('tape');
var Observable = require('../lib/Observable.js');

test('Simple change triggers', function(t) {
  t.plan(4);

  var n = new Observable();
  n.registerProperty('prop', 123);

  n.on(Observable.CHANGE, function() {
    t.ok(true, 'changed event triggered');
  });

  t.strictEqual(n.prop, 123, 'initial value');

  n.prop = 234; // fire
  n.prop = 234;
  n.prop = null; // fire
  n.prop = null;
  n.prop = undefined; // fire
  n.prop = undefined;

});

test('Specific property change', function(t) {

  t.plan(1);

  var o = new Observable();
  o.registerProperty('foo', 111);
  o.registerProperty('bar', 222);

  o.onPropertyChange({ foo:  function() { t.pass('foo changed'); }});

  o.foo = 444; // fire
  o.foo = 444;
  o.foo = 444;

});

test('Observable Observables', function(t) {

  t.plan(4);

  function O() { }
  extends_(O, Observable);
  O.observable({ foo: 111, bar: 222 });

  var o = new O();
  var p = new O();

  o.onPropertyChange('foo', function() { t.pass('foo changed'); });

  o.foo = p;
  p.foo = 333;
  p.bar = 345;
  o.bar = 444; // nop
  o.foo = null;
  p.foo = 555; // nop
  p.bar = 666; // nop

});

test('Computed basics', function(t) {
  t.plan(3);

  function O() { }
  extends_(O, Observable);
  O.observable({
    firstName: 'John',
    lastName: 'Doe',
    name: function() { return this.firstName + ' ' + this.lastName; }
  });

  var o = new O();
  o.onPropertyChange({ name: function() { t.pass('name changed'); }});
  t.strictEqual(o.name, 'John Doe', 'Access with default props');
  o.firstName = 'Bob'; // fire
  t.strictEqual(o.name, 'Bob Doe', 'access with changed props');

});

test('Computed properties with code branches', function(t) {

  t.plan(6);

  function Person() { }
  extends_(Person, Observable);
  Person.observable({
    firstName: 'John',
    lastName: 'Doe',
    hideName: true,
    name: function() {
      return this.hideName ?
        '***' :
        this.firstName + ' ' + this.lastName;
    }
  });

  var p = new Person();
  p.onPropertyChange('name', function() { t.pass('name changed'); });

  t.strictEqual(p.name, '***', 'initial value');
  p.firstName = 'Bob'; // fire
  t.strictEqual(p.name, '***', 'change out of path doesnt affect');
  p.hideName = false; // fire
  t.strictEqual(p.name, 'Bob Doe', 'branch condition change');
  p.lastName = 'Saget'; // fire
  t.strictEqual(p.name, 'Bob Saget', 'branch condition change');

});

test('Nested dependencies', function(t) {
  t.plan(8);

  function Person() { }
  extends_(Person, Observable);
  Person.observable({
    firstName: 'Pat',
    lastName: 'Doe',
    gender: 'male',
    title: function() {
      return this.gender === 'male' ? 'Mr.' : 'Ms.';
    },
    fullName: function() {
      return this.title + ' ' + this.firstName + ' ' + this.lastName;
    },
    greeting: function() {
      return 'Hello, ' + this.fullName + '!';
    },
  });

  var o = new Person();
  o.onPropertyChange('fullName', function() { t.pass('fullName changed'); });
  o.onPropertyChange('greeting', function() { t.pass('greeting changed'); });

  t.strictEqual(o.greeting, 'Hello, Mr. Pat Doe!', 'init value');
  t.strictEqual(o.fullName, 'Mr. Pat Doe', 'init value');
  o.gender = 'female'; // fire 2x
  t.strictEqual(o.fullName, 'Ms. Pat Doe', 'message');
  o.gender = 'male'; // fire 2x
  o.gender = 'male';
  t.strictEqual(o.greeting, 'Hello, Mr. Pat Doe!', 'final');

});

test('Throw on attempting to mutate prototype of base class', function(t) {
  t.plan(1);
  t.throws(function() {
    Observable.observable({ foo: 123 });
  });
});

