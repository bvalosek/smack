module.exports = Eventable;

var nextId = 0;

/**
 * Event firing and receiving class. Allows us to listen to events on an other
 * object, or listen to events on ourselves.
 * @mixin
 */
function Eventable()
{

}

/**
 * Bind a callback to be fired when an event on this object is emitted.
 * @param {String} name Event name.
 * @param {Function} callback Event callback.
 * @param {Object=} context Event callback context.
 * @return {Eventable} This object.
 */
Eventable.prototype.on = function(name, callback, context)
{
  if (!name || !callback) return this;

  this.__events = this.__events || {};
  this.__events[name] = this.__events[name] || [];

  this.__events[name].push({
    callback: callback,
    context: context || this
  });

  return this;
};

/**
 * Trigger all registered event callbacks registered on this object.
 * @param {String} name Event name.
 * @param {Object=} param Paramter to pass to event handler.
 * @return {Eventable} This Object.
 */
Eventable.prototype.trigger = function(name, param)
{
  if (!this.__events || !name || !this.__events[name])
    return this;

  for (var n = 0; n < this.__events[name].length; n++) {
    var info = this.__events[name][n];
    info.callback.call(info.context, param);
  }

  return this;
};

/**
 * Remove event callbacks from this object.
 * @param {String=} name Event name.
 * @param {Function=} callback Event callback.
 * @param {Object=} context Event callback context.
 * @return {Eventable} This object.
 */
Eventable.prototype.off = function(name, callback, context)
{
  if (!this.__events) return this;

  // Clear all on no args
  if (!name && !callback && !context) {
    this.__events = {};
    return this;
  }

  // Either a single event name or all of them
  var names = [];
  if (name)
    names.push(name);
  else
    for (var key in this.__events)
      names.push(key);

  // Potentially remove any entries from the list
  for (var n = 0; n < names.length; n++) {
    var _name = names[n];
    var entries = this.__events[_name];
    if (!entries) continue;

    var newEntries = [];
    for (var m = 0; m < entries.length; m++) {
      var entry = entries[m];
      var cb = !callback || callback === entry.callback;
      var ct = !context || context === entry.context;

      // If both conditions are met, this entry wont make it into the new list
      if (cb && ct) continue;
      newEntries.push(entry);
    }

    // Replace or delete
    if (newEntries.length)
      this.__events[_name] = newEntries;
    else
      delete this.__events[_name];
  }

  return this;
};

/**
 * Let this object keep track of a callback on other Eventable object.
 * @param {Eventable} other The object to listen to.
 * @param {String} name The event name.
 * @param {Function} callback The event callback.
 * @return {Eventable} This object.
 */
Eventable.prototype.listenTo = function(other, name, callback)
{
  if (!other || !name || !callback) return this;
  if (!(other.on instanceof Function)) return this;

  this.__listeningTo = this.__listeningTo || {};

  // Install an ID on the other
  var id = other.__listenId = other.__listenId || ('l' + nextId++);
  this.__listeningTo[id] = other;

  other.on(name, callback, this);

  return this;
};

/**
 * Remove any callbacks on another Eventable that we are listening for.
 * @param {Eventable=} other The object to listen to.
 * @param {String=} name The event name.
 * @param {Function=} callback The event callback.
 * @return {Eventable} This object.
 */
Eventable.prototype.stopListening = function(other, name, callback)
{
  if (!this.__listeningTo) return this;

  if (other && other.off instanceof Function) {
    other.off(name, callback, this);

    // Clearing out everything
    if (!name && !callback)
      delete this.__listeningTo[other.__listenId];

  } else {
    for (var id in this.__listeningTo) {
      var o = this.__listeningTo[id];
      o.off(name, callback, this);

      // Clearing out everything
      if (!name && !callback)
        delete this.__listeningTo[id];
    }
  }

  return this;
};


