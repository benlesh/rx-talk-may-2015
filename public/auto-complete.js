var q = document.querySelector('#q');
var resultList = document.querySelector('#results');

var Observable = Rx.Observable;

var keyups = Rx.Observable.fromEvent(q, 'keyup');

keyups.throttle(500)
  .map(() => q.value)
  .flatMapLatest(query => Rx.DOM.ajax({
    method: 'GET',
    url: '/autocomplete?q=' + query,
    responseType: 'json'
  }))
  .map(r => r.response)
  .map(results => results.reduce((html, result) => `${html}<li>${result}</li>`, ''))
  .subscribe(resultsHTML => resultList.innerHTML = resultsHTML, 
    err => console.error(err));