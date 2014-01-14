var mixin_         = require('typedef').mixin;
var Eventable      = require('./Eventable.js');
var ChangeNotifier = require('./ChangeNotifier.js');

module.exports = Observable;
mixin_(Observable, Eventable);
mixin_(Observable, ChangeNotifier);

/**
 * A class that let's us install observable properties that signal changes via
 * the ChangeNotifier interface.
 * @mixin
 * @extends Eventable
 * @extends ChangeNotifier
 */
function Observable()
{

}

/**
 * Install an observable property onto this object.
 * @param {Observable} obj Target object to install the observable one.
 * @param {String} prop Property name of the observable.
 * @param {*=} val Initial value of the observable property.
 */
Observable.registerProperty = function(obj, prop, val)
{
  var _prop = '_' + prop;

  // Ensure that we have the appropriate hidden trackers on an object for
  // resolving dependencies
  if (!obj.__frames || !obj.__deps)
    Object.defineProperties(obj, {
      __frames: {
        configurable: true,
        value: []
      },
      __deps: {
        configurable: true,
        value: {}
      },
    });

  // Create the private hidden member, either as a normal value or a
  // getter/setter in the case of a function (computed value)
  var descriptor = {
    configurable: true
  };
  if (val instanceof Function) {
    descriptor = {
      configurable: true,
      get: function() { return this._getComputedValue(prop, val); }
    };
  } else {
    descriptor = {
      writable: true,
      configurable: true,
      value: val !== undefined ? val : obj[prop]
    };
  }

  // Create hidden actual value
  Object.defineProperty(obj, _prop, descriptor);

  // create getters and setters that trigger events
  Object.defineProperty(obj, prop, {
    enumberable: true,
    configurable: true,
    get: function() { return this.getProperty(prop); },
    set: function(val) { return this.setProperty(prop, val); }
  });
};

/**
 * Add an instance-specific observable property to this object.
 * @param {String} prop Property name of the observable.
 * @param {*=} val Initial value of the observable property.
 */
Observable.prototype.registerProperty = function(prop, val)
{
  return Observable.registerProperty(this, prop, val);
};

/**
 * Get the value of an observable property, tracking access along the way.
 * @param {String} prop Property name to get.
 * @return {*} The value of the property.
 */
Observable.prototype.getProperty = function(prop)
{
  this._trackAccess(prop);
  return this['_' + prop];
};

/**
 * Set an obsvervable property, tracking any necesary information about
 * dependencies as we go.
 * @param {String} prop Property name.
 * @param {*} val Property value.
 */
Observable.prototype.setProperty = function(prop, val)
{
  this._trackAccess(prop);
  var _prop = '_' + prop;
  var oldVal = this[_prop];
  if (val === oldVal) return;

  // Stop listening to the old value and proxy up change on our new one
  var _this = this;
  if (oldVal && oldVal.off) this.stopListening(oldVal, Observable.CHANGE);
  if (val && val.on) this.listenTo(
    val,
    Observable.CHANGE,
    function() { _this.triggerPropertyChange(prop); }
  );

  this[_prop] = val;
  this.triggerPropertyChange(prop);
  this._triggerDependencies(prop);
};

/**
 * Static method to cleanly install observable properties on a class's
 * prototype.
 * @param {Object.<String,*>} hash Map of property names to initial values.
 */
Observable.observable = function(hash)
{
  if (this === Observable)
    throw new Error('cannot call observable on Observable');
  for (var prop in hash) {
    var val = hash[prop];
    Observable.registerProperty(this.prototype, prop, val);
  }
};

// Run a member function whilst tracking all deps
Observable.prototype._getComputedValue = function(prop, fn)
{
  // Fill the frame will all the accessed values and record them as
  // dependencies for this property
  this.__frames.push([]);
  var val = fn.call(this);
  this.__deps[prop] = this.__frames.pop();
  return val;
};

// Mark access to a property by recording it in the top-most frame
Observable.prototype._trackAccess = function(prop)
{
  var frames = this.__frames;
  if (!frames.length) return;

  frames[frames.length -1].push(prop);
};

// Recursively determine all dependencies of a property
Observable.prototype._getDependencies = function(prop)
{
  var deps = this.__deps[prop];

  // Trivial case, no deps, only itself
  if (!deps) return [prop];

  // The dependencies of prop are the dependencies of its deps, recusively
  var ret = [];
  for (var n = 0; n < deps.length; n++) {
    var p = deps[n];
    ret = ret.concat(this._getDependencies(p));
  }

  return ret;
};

// Sick
Observable.prototype._expandDependencies = function(deps)
{
  var ret = [];
  for (var n = 0; n < deps.length; n++) {
    var p = deps[n];
    ret = ret.concat(this._getDependencies(p));
  }
  return ret;
};

// Fire off all depedent property change events
Observable.prototype._triggerDependencies = function(prop)
{
  for (var p in this.__deps) {
    var deps = this.__deps[p];
    deps = this._expandDependencies(deps);
    if (~deps.indexOf(prop))
      this.triggerPropertyChange(p);
  }
};

