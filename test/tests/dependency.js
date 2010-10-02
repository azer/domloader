var states = domloader.require('./states');
var dependency = domloader.require('./dependency');



var test_dependency = function(test){
  var dp = new dependency.Dependency();
  compare( dp.cacheForce, true );
  assert( dp.callbacks.error )
  assert( dp.callbacks.load )
  assert( dp.state == states.UNINITIALIZED );
  assert( dp.load );
  test.callback();
};

