var endpoints = Rx.Observable.just('ws://localhost:3000/talk_people');

var closes = new Rx.Subject();

var opens = new Rx.Subject();
opens.subscribe(x => console.info('socket opened'));

var socket = new RxSocketSubject({ connections: endpoints, closingObserver: closes, openObserver: opens });


var multiplexer = socket.multiplex();

$('.stream-option').each(function(i, checkbox) {
  var changes = Rx.Observable.fromEvent(checkbox, 'change');
  var checks = changes.filter(e => e.target.checked);
  var unchecks = changes.filter(e => !e.target.checked);

  checks.map(e => e.target.value)
    .flatMap(value => {
      return multiplexer(`sub:${value}`, `unsub:${value}`, request => ((data) => data.key === request.key))
        .takeUntil(unchecks.take(1));
    })
    .subscribe(console.log.bind(console), console.error.bind(console));
});