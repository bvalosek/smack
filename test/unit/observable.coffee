ObservableObject = require '../../lib/Observable.js'

QUnit.module 'ObservableObject'

test 'Simple change triggers', 4, ->
  class O extends ObservableObject
    constructor: ->
      super

    @observable prop: 123

  t = new O

  o = new O
  o.on ObservableObject.CHANGE, -> ok true, 'change event triggered'
  strictEqual o.prop, 123, 'initial value'

  o.prop = 234
  o.prop = 234 # nop
  o.prop = null
  o.prop = null # nop
  o.prop = undefined
  o.prop = undefined # nop

test 'specific prop change', 1, ->
  class O extends ObservableObject
    @observable
      foo: 111
      bar: 222

  o = new O
  o.onPropertyChange foo: -> ok true, 'foo changed'
  o.foo = 444
  o.foo = 444 #nop
  o.bar = 444 #nop

test 'observable observable', 4, ->
  class O extends ObservableObject
    @observable
      foo: 111
      bar: 222

  o = new O
  p = new O

  o.onPropertyChange foo: -> ok true, 'foo changed'

  o.foo = p
  p.foo = 333
  p.bar = 345
  o.bar = 444 # nop
  o.foo = null
  p.foo = 555 # nop
  p.bar = 666 # nop

test 'computed basics', 3, ->

  class O extends ObservableObject
    @observable
      firstName: 'John'
      lastName: 'Doe'
      name: -> "#{@firstName} #{@lastName}"

  o = new O
  o.onPropertyChange name: -> ok true, 'name changed'
  strictEqual o.name, 'John Doe', 'basic access with default observables'
  o.firstName = 'Bob'
  strictEqual o.name, 'Bob Doe', 'basic access with mutated observables'

test 'computed with code branches', 6, ->

  class Person extends ObservableObject
    @observable
      firstName: 'John'
      lastName: 'Doe'
      hideName: true
      name: ->
        if @hideName then '***' else "#{@firstName} #{@lastName}"

  p = new Person
  p.onPropertyChange name: -> ok true, 'name changed'

  strictEqual p.name, '***', 'inital val'
  p.firstName = 'Bob'
  strictEqual p.name, '***', 'change out of path doesnt effect'
  p.hideName = false # trigger
  strictEqual p.name, 'Bob Doe', 'branch condition change'
  p.lastName = 'Saget' # trigger
  strictEqual p.name, 'Bob Saget', 'branch condition change'

test 'nested deps', 8, ->

  class Obv extends ObservableObject
    @observable
      firstName: 'Pat'
      lastName: 'Doe'
      gender: 'male'
      title: -> if @gender is 'male' then 'Mr.' else 'Ms.'
      fullName: -> "#{@title} #{@firstName} #{@lastName}"
      greeting: -> "Hello, #{@fullName}!"

  o = new Obv
  o.onPropertyChange fullName: -> ok true, 'fullName changed'
  o.onPropertyChange greeting: -> ok true, 'greeting changed'

  strictEqual o.greeting, 'Hello, Mr. Pat Doe!'
  strictEqual o.fullName, 'Mr. Pat Doe', 'init value'
  o.gender = 'female' # trigger 2x
  strictEqual o.fullName, 'Ms. Pat Doe', 'changed value'
  o.gender = 'male' # trigger 2x
  o.gender = 'male' # nop
  strictEqual o.greeting, 'Hello, Mr. Pat Doe!'

test 'throw on attempting to mutate prototype of base class', ->
  throws ->
    ObservableObject.observable someProp: 123

