WithEvents = require '../../lib/Eventable.js'

class EObject extends  WithEvents

eventCount = (o) -> (key for key of o.__events).length
listeningCount = (o) -> (key for key of o.__listeningTo).length

QUnit.module 'Events'

test 'Basic callback adding and removing with on/off', ->
  name = 'e'
  cb = ->

  o = new EObject
  o.on name, cb
  strictEqual eventCount(o), 1, 'using on(name, cb) adds to __events'
  o.off name, cb
  strictEqual eventCount(o), 0,
    'using off(name, cb) removes event node when empty'

  o = new EObject
  o.on name, cb
  o.off()
  deepEqual o.__events, {}, 'off() clears all'

test 'Basic callback adding/removing with listenTo and stopListening', ->
  name = 'e'
  o = new EObject
  p = new EObject
  f = -> strictEqual this, p, 'listenTo cb in correct context'

  p.listenTo o, name, f
  strictEqual listeningCount(p), 1, 'listeningTo updated on listenTo'
  strictEqual p.__listeningTo[o.__listenId], o, 'listenId setup'
  strictEqual eventCount(o), 1, 'event handler added to listenee'
  o.trigger name

  p.stopListening o
  strictEqual eventCount(o), 0, 'events empty'
  strictEqual listeningCount(p), 0, 'listening empty'

test 'Value of this when left unset', ->
  name = 'e'

  o = new EObject
  o.on name, -> strictEqual this, o, 'callback with on() is same as object'
  o.trigger name

  o = new EObject
  p = new EObject
  p.listenTo o, name, -> strictEqual this, p,
    'set with listenTo is object that is listening'
  o.trigger name

