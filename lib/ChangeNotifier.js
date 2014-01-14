var mixin_         = require('typedef').mixin;
var Eventable      = require('./Eventable.js');

module.exports = ChangeNotifier;
mixin_(ChangeNotifier, Eventable);

/**
 * An object that has functions that can be used to inform a listener it has
 * changed.
 * @mixin
 * @extends Eventable
 */
function ChangeNotifier()
{

}

/**
 * Fired when this object has changed.
 * @event
 */
ChangeNotifier.CHANGE = 'change';

/**
 * A specific property has changed on this object.
 * @param {String} prop Name of the property that has changed.
 * @event
 */
ChangeNotifier.PROPERTY_CHANGE = function(prop)
{
  return ChangeNotifier.CHANGE + ':' + prop;
};

/**
 * Fire a property change notification. Always use this function to manually
 * trigger a property change.
 * @param {String} prop Name of the property that changed.
 */
ChangeNotifier.prototype.triggerPropertyChange = function(prop)
{
  this.trigger(ChangeNotifier.PROPERTY_CHANGE(prop));
  this.trigger(ChangeNotifier.CHANGE);
};

/**
 * Listen for when a property on this object changes. All callbacks are bound
 * to this object.
 * @param {String} prop Property name we want to listen for changes on.
 * @param {function()} f Handler for when the property changes.
 */
ChangeNotifier.prototype.onPropertyChange = function(prop, f)
{
  if (f)
    this.on(ChangeNotifier.PROPERTY_CHANGE(prop), f);
  else
    for (var key in prop)
      this.on(ChangeNotifier.PROPERTY_CHANGE(key), prop[key]);
};

