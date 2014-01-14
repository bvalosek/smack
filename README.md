# Smack

[![Build Status](https://travis-ci.org/bvalosek/smack.png?branch=master)](https://travis-ci.org/bvalosek/smack)
[![NPM version](https://badge.fury.io/js/smack.png)](http://badge.fury.io/js/smack)

A small Javascript library for events, observable objects, and data binding.

## Installation

**Smack** is meant to be used with [Browserify](http://browserify.org/), so
install it with npm:

```
npm install smack
```

## Usage

`Eventable`, `ChangeNotifier`, and `Observable` can be either used directly as
class constructors (e.g, `new Eventable()`), or as mixins with something like
[typedef.mixin](https://github.com/bvalosek/typedef).

### mixin `Eventable`

Run-of-the-mill events mixin. Similar to the Backbone Events API.

```javascript
var Eventable = require('smack').Eventable;

var thing = new Eventable();

thing.on('shout', function(message) {
  console.log(message + '!');
});

thing.trigger('shout', 'Hello');
// Hello!

var another = new Eventable();
another.listenTo(thing, 'shout', function() {
  console.log('thing is shouting!');
});

thing.trigger('shout', 'Hey');
// Hey!
// thing is shouting!
```

### mixin `ChangeNotifier`

Mixin that uses events to signal to other objects that a change has occured.
It serves as a standardized interface for handling object change and property
change notifications.

The example below uses a `mixin` funciton that simply adds the methods on the
`prototype` property of one object to another.

```javascript
var ChangeNotifier = require('smack').ChangeNotifier;
var mixin_         = require('typedef').mixin;

mixin_(Hero, ChangeNotifier);

function Hero()
{
  this.hp     = 100;
  this.status = 'alive';
}

Hero.prototype.takeDamage(amount)
{
  this.hp = Math.max(0, this.hp - amount);
  if (this.hp > 0) return;

  this.status = 'dead';
  this.triggerPropertyChange('status');
}

...

var guy = new Hero();

guy.onPropertyChange({
  status: function() { console.log('status is now: ' + guy.status); }
});

```

### mixin `Observable`

An object that has all the methods of `Eventable` and `ChangeNotifier` mixed
in, with some helpful methods to automatically wire up certain properties to
fire change events.

```
var Observable = require('smack').Observable;
var Eventable  = require('smack').Eventable;
var mixin_     = require('typedef').mixin;

mixin_(Person, Observable);

function Person()
{

}

Person.observable({
  name: 'John',
  age: 27
});

...

var bob = new Person();

bob.onPropertyChange({
  name: function() { console.log('name changed!'); }
});

bob.name = 'Bob'
// name changed!

bob.name = 'Bob';
// [nothing]

bob.name = 'Bobby';
// name changPerson name changeded!
```

### class `Binding`

...

## Tern Support

The library files are all decorated with [JSDoc](http://usejsdoc.org/)-style
annotations that work great with the [Tern](http://ternjs.net/) code interence
system. Combined with the Node plugin (see this project's `.tern-project`
file`), you can have intelligent autocomplete for methods in this library.

## Testing

Unit testing is done by [QUnit](http://qunitjs.com/) and can be run from the
command line via [Grunt](http://gruntjs.com/).

Testing requires [node/npm](http://nodejs.org) and
[grunt-cli](https://github.com/gruntjs/grunt-cli) to be installed on your
system.

To ensure you have the required apps:

```
npm install -g grunt-cli
```

Then install all the dev dependencies and run the tests:

```
npm install
grunt test
```

## License
Copyright 2014 Brandon Valosek

**Smack** is released under the MIT license.


