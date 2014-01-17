var extends_   = require('typedef').extends;
var Binding    = require('../lib/Binding.js');
var Observable = require('../lib/Observable.js');

var test = require('tape');

test('Setting source to static', function(t) {
  t.plan(4);

  var b = new Binding();
  b.on(Binding.SOURCE_CHANGE, function() { t.pass('source changed'); });

  b.setSource(123); // fire
  t.strictEqual(b.value, 123, 'static set');
  b.setSource(456); // fire
  t.strictEqual(b.value, 456, 'static set');
  b.setSource(456);

});

test('Setting value directly', function(t) {
  t.plan(4);

  var b = new Binding();
  b.on(Binding.SOURCE_CHANGE, function() { t.pass('source changed'); });

  b.setSource(123); // fire
  t.strictEqual(b.value, 123, 'static set');
  b.setSource(456); // fire
  t.strictEqual(b.value, 456, 'static set');
  b.setSource(456);

});

test('Setting Observable as source', function(t) {
  t.plan(4);

  var o = new Observable();
  o.registerProperty('prop', 123);

  var b = new Binding();
  b.on(Binding.SOURCE_CHANGE, function() { t.pass('source changed'); });

  b.setSource(o, 'prop'); // fire
  o.prop = 456; // fire
  o.prop = 456;
  o.prop = null; // fire
  o.prop = null;
  b.setSource(1234); // fire
  o.prop = 456;

});

test('Setting target', function(t) {
  t.plan(5);

  var o = new Observable();
  o.registerProperty('prop', 123);

  var p = {foo: 456};
  var b = new Binding();

  b.setSource(o, 'prop');
  b.setTarget(p, 'foo');
  t.strictEqual(p.foo, 123, 'init value');
  o.prop = 555;
  t.strictEqual(p.foo, 555, 'changed via source');
  b.value = 666;
  t.strictEqual(p.foo, 666, 'changed via binding value');

  var x = new Observable();
  x.registerProperty('prop', 123);
  var y = new Observable();
  y.registerProperty('prop', 123);
  x.prop = 10;
  y.prop = 20;
  var binding = new Binding();
  binding.setSource(x, 'prop');
  binding.setTarget(y, 'prop');

  t.strictEqual(y.prop, 10, 'target setup');
  x.prop = 15;
  t.strictEqual(y.prop, 15, 'target changed');

});

test('Changing source', function(t) {
  t.plan(5);

  function Obv() { }
  extends_(Obv, Observable);
  Obv.observable({ prop: 123 });

  var a = new Obv();
  var b = new Obv();
  var x = {prop: undefined};
  b.prop = 456;

  var binding = new Binding();
  binding.setSource(a, 'prop');
  binding.setTarget(x, 'prop');
  binding.on(Binding.SOURCE_CHANGE, function() { t.pass(true, 'source changed'); });

  t.strictEqual(x.prop, 123, 'init');
  binding.setSource(b, 'prop');
  t.strictEqual(x.prop, 456, 'target changed on source change');
  a.prop = 'nope';
  binding.setSource('static');
  t.strictEqual(x.prop, 'static', 'source back to static works');

});

test('Two way binding and target removal', function(t) {
  t.plan(8);

  function Obv() { }
  extends_(Obv, Observable);
  Obv.observable({ prop: 123 });

  var a = new Obv();
  var b = new Obv();
  var c = new Obv();

  var binding = new Binding();
  binding.mode = Binding.modes.TWO_WAY;
  binding.setSource(a, 'prop');
  binding.setTarget(b, 'prop');

  t.strictEqual(a.prop, 123, 'init');
  t.strictEqual(b.prop, 123, 'init');
  b.prop = 1;
  t.strictEqual(a.prop, 1, 'target changed source');
  a.prop = 2;
  t.strictEqual(b.prop, 2, 'source changed target');
  binding.setTarget(c, 'prop');
  t.strictEqual(c.prop, 2, 'c init');
  binding.removeTarget(b);
  a.prop = 3;
  t.strictEqual(b.prop, 2, 'source doesnt change target after removal');
  t.strictEqual(c.prop, 3, 'source change still affects bound targets');
  b.prop = 4;
  t.strictEqual(a.prop, 3, 'target doesnt change source after removal');

});

test('Dot notation props', function(t) {
  t.plan(3);

  function Child() { }
  extends_(Child, Observable);
  Child.observable({ prop: 123 });

  function Parent() {
    this.child = new Child();
  }
  extends_(Parent, Observable);
  Parent.observable({ child: null });

  var a = new Parent();
  var x = {val: undefined};
  var c = new Child();
  c.prop = 777;

  var binding = new Binding();
  binding.setSource(a, 'child.prop');
  binding.setTarget(x, 'val');

  t.strictEqual(x.val, 123, 'init val');
  a.child.prop = 456;
  t.strictEqual(x.val, 456, 'change val');
  a.child = c;
  t.strictEqual(x.val, 777, 'change at root');

});
