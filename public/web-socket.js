var endpoints = Rx.Observable.just('ws://localhost:3000/talk_people');

var closes = new Rx.Subject();
closes.subscribe(x => console.info('socket closed'));

var opens = new Rx.Subject();
opens.subscribe(x => console.info('socket opened'));

var socket = new RxSocketSubject({ connections: endpoints, closingObserver: closes, openObserver: opens });

var multiplexer = socket.multiplex();

// make an observable of each checkbox's change events
var thinkersChecked = Rx.Observable.fromEvent($('input[value="thinkers"]'), 'change');
var phoneUsersChecked = Rx.Observable.fromEvent($('input[value="phone_users"]'), 'change');
var legCrossersChecked = Rx.Observable.fromEvent($('input[value="leg_crossers"]'), 'change');

// merge them together
Rx.Observable.merge(thinkersChecked, phoneUsersChecked, legCrossersChecked)
  // filter out events where the checkbox is *not* checked
  .filter(e => e.target.checked)
  // map it to the value (the key we use to subscribe)
  .map(e => e.target.value)
  // flatMap to a multiplexed socket data stream!
  .flatMap(key => multiplexer(`sub:${key}`, `unsub:${key}`, request => ((data) => data.key === request.key))
    // but only take them until the checkbox is unchecked
    .takeUntil(Rx.Observable.fromEvent($(`input[value="${key}"]`), 'change').take(1)))

  // ADDED FUN: uncomment to see a group and scan!
  // // group into grouped observables by the key
  // .groupBy(x => x.key)
  // // flat map because we're going to scan these into arrays and get them back out
  // .flatMap(g => 
  //    // scan the grouped observable and build an array of no more than 20 values
  //    g.scan([], (s, d) => (s.push(d.value), s.slice(s.length - 20, s.length)))
  //    // map to reattach the key to the array of values
  //   .map(s => ({ key: g.key, value: s })))

  .subscribe(({ key, value}) => {
    $('.results-' + key).text(value);
  }, console.error.bind(console));

