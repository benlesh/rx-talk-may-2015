var express = require('express');
var path = require('path');

var app = express();
var expressWs = require('express-ws')(app);
var rx = require('rx');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/babel/browser.js', function(req, res) {
  res.sendFile(path.join(__dirname, 'node_modules/babel-core/browser.min.js'));
});

var possible = ['apples', 'oranges', 'bananas', 'apricots', 'aardvarks', 'beavers', 'whatever'];

app.get('/autocomplete', function(req, res) {
  var q = req.query.q;

  var results = possible.filter(function(p) {
    return p.indexOf(q) === 0;
  });

  setTimeout(function(){
    res.send(results);
  }, 1000);
});

var thinkers = new rx.Subject();
var phone_users = new rx.Subject();
var leg_crossers = new rx.Subject();

var streams = {
  'thinkers': thinkers,
  'phone_users': phone_users,
  'leg_crossers': leg_crossers
};

rx.Observable.interval(1000)
  .map(function(x) { return 20 + Math.round(Math.sin(x * .1) * 20); })
  .subscribe(thinkers);

rx.Observable.interval(1000)
  .map(function(x) { return 30 + Math.round(Math.cos(x * .1) * 30); })
  .subscribe(phone_users);

rx.Observable.interval(1000)
  .map(function(x) { return 10 + Math.round(Math.sin((52 + x) * .12) * 10); })
  .subscribe(leg_crossers);


app.ws('/talk_people', function(ws) {
  var subscriptions = {};

  var disposeAll = function(){
    for(var key in subscriptions) {
      if(subscriptions.hasOwnProperty(key) && subscriptions[key]) {
        subscriptions[key].dispose();
        subscriptions[key] = null;
      }
    }
  };

  ws.on('message', function(msg) {
    var data = JSON.parse(msg);
    var key = data.key;
    var type = data.type;
    if(type === 'sub') {
      subscriptions[key] = streams[key]
        .map(function(value) { return { key: key, value: value }; })
        .map(function(value) { return JSON.stringify(value); })
        .subscribe(function(json) {
          console.log('sending', json);
          ws.send(json);
        });
    }
    else if(type === 'unsub') {
      if(subscriptions[key]) {
        subscriptions[key].dispose();
        subscriptions[key] = null;
      }
    }
  });

  ws.on('error', disposeAll);

  ws.on('close', disposeAll);
});


var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});