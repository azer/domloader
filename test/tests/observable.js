var observable = domloader.require('./libs/observable');

var test_observable = function(test){
  var Observable = observable.Observable;
  var o = new Observable();
  o.callbacks.foobar = [];
  o.callbacks.foobar.push(function(a,r,g,s){
    for(var i=0;++i<5;)
      compare(i,arguments[i-1]);
    test.callback();
  });
  o.getEmitter('foobar')(1,2,3,4);
};
