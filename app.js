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
  .map(function(x) { return Math.round(20 + (Math.sin(x) * 20)); })
  .subscribe(thinkers);

rx.Observable.interval(1000)
  .map(function(x) { return Math.round(30 + (Math.cos(x) * 30)); })
  .subscribe(phone_users);

rx.Observable.interval(1000)
  .map(function(x) { return Math.round(10 + (Math.tan(x) * 10)); })
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
    var parts = data.split(':');
    var type = parts[0];
    var key = parts[1];
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