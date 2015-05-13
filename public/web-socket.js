var endpoints = Rx.Observable.just('ws://localhost:3000/talk_people');

// Create some observers so we can see when we open and close the socket.
var closes = new Rx.Subject();
closes.subscribe(x => {
  $('.socket-status').text('closed');
  $('.socket-spinner').hide();
  console.info('socket closed')
});

var opens = new Rx.Subject();
opens.subscribe(x => {
  $('.socket-status').text('open');
  $('.socket-spinner').show();
  console.info('socket opened')
});

var socket = new RxSocketSubject({ connections: endpoints, closingObserver: closes, openObserver: opens });

var multiplexer = socket.multiplex();

// make an observable of each checkbox's change events
var thinkersChecked = Rx.Observable.fromEvent($('input[value="thinkers"]'), 'change');
var phoneUsersChecked = Rx.Observable.fromEvent($('input[value="phone_users"]'), 'change');
var legCrossersChecked = Rx.Observable.fromEvent($('input[value="leg_crossers"]'), 'change');

var exponent = 0;

// merge them together
Rx.Observable.merge(thinkersChecked, phoneUsersChecked, legCrossersChecked)
  // filter out events where the checkbox is *not* checked
  .filter(e => e.target.checked)
  // map it to the value (the key we use to subscribe/unsubscribe)
  .map(e => e.target.value)
  // flatMap to a multiplexed socket data stream!
  .flatMap(key => multiplexer(
    // our subscription message
    { type: 'sub', key: key }, 
    // our unsubscription message
    { type: 'unsub', key: key }, 
    // a filter to select the data for this stream
    request => ((data) => data.key === request.key))
      // but only take them until the checkbox is unchecked
      .takeUntil(Rx.Observable.fromEvent($(`input[value="${key}"]`), 'change').take(1))
      // if the stream errors retry when...
      .retryWhen(errors => {
        if(window.onLine) {
          // if we're online, try an exponential step back
          return Rx.Observable.timer(Math.min(30000, Math.pow(2, exponent++) + 100));
        } else {
          // if we're offline, wait for the network to come back
          return Rx.Observable.fromEvent(window, 'online').take(1);
        }
      })
      // finally remove the spinner when the stream ends
      .finally(() => (console.log(key), $('.spinner-' + key).hide()))
      // if we get a successful message, reset our exponent for retry step back
      .do(() => exponent = 0))
      // also let's log out successful messages, just because
      .do(({ key, value }) => console.log('%s: %s', key, value))
      // show a spinner for the stream
      .do(({ key }) => $('.spinner-' + key).show())
  // now subscribe to the whole thing to wire it up
  .subscribe(
    // each successful message, update the DOM
    ({ key, value }) => $('.results-' + key).text(value),
    // on error, log it out
    (err) => console.error(err));

