var mixin_     = require('typedef').mixin;
var Observable = require('./Observable.js');

module.exports = Binding;
mixin_(Binding, Observable);

/**
 * A class used to connect a source object and property to a target object and
 * property. Effectively allows two objects to be in sync. Especially useful
 * when the source object is an Observable type.
 * @constructor
 * @extends Observable
 * @param {Observable} source Object to set as the source of the binding.
 * @param {String} prop Name of the property we want to be set as the source.
 */
function Binding(source, prop)
{
  /**
   * Determines which directions the binding operates in.
   * @type {Binding.modes}
   */
  this.mode           = Binding.modes.ONE_WAY;

  this._source        = source;
  this._property      = prop;
  this._valueWhenNull = null;

  if (source && prop)
    this.setSource(source, prop);
}

/**
 * Determine if the binding operates in one or two way mode
 * @enum
 */
Binding.modes = {
  /**
   * Binding only maintains sync from the source to the target. Changes in the
   * target have no effect on the source.
   */
  ONE_WAY: 1,

  /**
   * Binding maintains the sync in both directions. Either the source or the
   * target changing will update the other.
   */
  TWO_WAY: 2
};

/**
 * The source of this binding has been changed, or the source itself has
 * changed.
 * @event
 */
Binding.SOURCE_CHANGE = 'Binding#SOURCE_CHANGE';

/**
 * Point this binding at a target object to keep in sync with our source.
 * @param {Object} target Any object to target.
 * @param {String} prop Name of the property we want to target.
 */
Binding.prototype.setTarget = function(target, prop)
{
  // Start off setting the target and setup event for future changes on this
  // binding, making sure to bind to the target's context to ensure we can
  // unbind later
  var _this = this;
  target[prop] = this.value;
  this.on(
    Binding.SOURCE_CHANGE,
    function() { target[prop] = _this.value; },
    target
  );

  // Two way?
  if (this.mode === Binding.modes.TWO_WAY && target.on) {
    this.listenTo(target, Observable.CHANGE, function() {
      this.value = target[prop];
    });
  }
};

/**
 * Unbind events assoicated with updating the target. Target's value wont
 * change, but future changes in source will not affect it
 * @param {Object} target Object to stop targeting
 */
Binding.prototype.removeTarget = function(target)
{
  this.off(Binding.SOURCE_CHANGE, null, target);
  this.stopListening(target);
};

/**
 * Change the source of data the binding is pointing at.
 * @param {Observable} source Object to set as the source of the binding.
 * @param {String} prop Name of the property we want to be set as the source.
 * @fires Binding.SOURCE_CHANGE
 */
Binding.prototype.setSource = function(source, prop)
{
  if (this.source === source && this.prop === prop) return;
  if (this.source) this.stopListening(this.source);

  if (prop) {
    this.source = source;
    this.property = prop;

    // Determine the actual root of the dot-chain prop we need to listen to
    // know whne a change happens
    var _ref = this._resolve();
    var root = _ref.root;

    this.listenTo(
      this.source,
      Observable.PROPERTY_CHANGE(root),
      function() { this.trigger(Binding.SOURCE_CHANGE); }
    );
  } else {
    this.source = this.property = null;
    if (this.valueWhenNull === source) return;
    this.valueWhenNull = source;
  }

  this.trigger(Binding.SOURCE_CHANGE);
};

/**
 * The current evaluated value of the binding. This is based on the current
 * source and property selector / path.
 * @name Binding.prototype.value
 * @type {*}
 */
Object.defineProperty(Binding.prototype, 'value', {
  get: function() {
    if (this.source && this.property) {
      var _ref = this._resolve();
      var source = _ref.source;
      var prop = _ref.property;
      return source ? source[prop] : null;
    } else {
      return this.valueWhenNull;
    }
  },

  set: function(v) {
    if (this.source && this.property) {
      var _ref = this._resolve();
      var source = _ref.source;
      if (!source) return;
      var prop = _ref.property;
      source[prop] = v;
    } else if (this.valueWhenNull !== v) {
      this.valueWhenNull = v;
      this.trigger(Binding.SOURCE_CHANGE);
    }
  }
});

// Resolve any dot-style property into an actual source / property pair
// e.g. 'person.address', 'zip' -> 'address', 'zip'
Binding.prototype._resolve = function()
{
  var source = this.source;
  var property = this.property;
  var parts = property.split('.');
  var root = parts[0];

  for (var index = 0; index < parts.length - 1; index++) {
    var part = parts[index];
    source   = source[part];
    property = parts[index + 1];
  }

  return {
    source: source,
    property: property,
    root: root
  };
};
