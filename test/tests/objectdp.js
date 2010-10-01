var objectdp = domloader.require('objectdp');

var test_objectdp = function(test){
  var odp = new objectdp.ObjectDp();
  compare( odp.state, domloader.require('./states').UNINITIALIZED );
  compare( odp.name, null );
  compare( odp.src, null );
  assert( odp.properties );
  test.callback();
};

var test_objectdp_load = function(test){
  var name = 'objdp'+rnd();
  window['deps/objdp1.js#1'] = false;

  var odp = new objectdp.ObjectDp();
  odp.name = name;
  odp.src = 'deps/objdp1.js';
  odp.callbacks.load.push(function(){
    try {
      assert( window['deps/objdp1.js#1'] );
    } catch(exc){
      test.error = exc;
    }
    test.callback();
  });
  odp.callbacks.error.push(function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  odp.load();
};

var test_objectdp_load_2 = function(test){
  var name = 'objdp'+rnd();
  window[name] = false;
  window['deps/objdp1.js#2'] = false;

  var odp = new objectdp.ObjectDp();
  odp.name = name;
  odp.src = 'deps/objdp1.js';
  odp.callbacks.load.push(function(){
    try {
      assert( window['deps/objdp1.js#2'] == false );
    } catch(exc){
      test.error = exc;
    }
    test.callback();
  });
  odp.callbacks.error.push(function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  odp.load();
}

var test_objectdp_load_error = function(test){
  var ObjectDp = domloader.require('objectdp').ObjectDp;
  var name = 'objdp'+rnd();
  var odp = new ObjectDp();
  odp.name = name;
  odp.src = 'non/existing/path';
  odp.callbacks.load.push(function(){
    test.error = new Error('ObjectDp has fired load event despiting the load error');
    test.callback();
  });
  odp.callbacks.error.push(function(excinfo){
    test.callback();
  });
  odp.load();
};

var test_objectdp_state = function(test){
  var ObjectDp = domloader.require('objectdp').ObjectDp;

  var odp = new ObjectDp();

  odp.name = 'NONEXISTENT';
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'domloader';
  odp.refreshState();
  compare( odp.state, states.LOAD );

  odp.name = 'domloader.nonexistent';
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'domloader.require';
  odp.refreshState();
  compare( odp.state, states.LOAD );

  odp.name = 'domloader._jsbuild_.require.call';
  odp.refreshState();
  compare( odp.state, states.LOAD );

  odp.name = 'NONEXISTENT';
  odp.properties = [{ 'name':'nonexistent' }];
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'NONEXISTENT';
  odp.properties = [{ 'name':'nonexistent', 'match':/foobar/ }];
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'nonexistent' }];
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'version', 'match':/foobar/ }];
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'version', 'match':/1.0/ },{ 'name':'foobar' }];
  odp.refreshState();
  compare( odp.state, states.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'version', 'match':/1.[0-9]/ }];
  odp.refreshState();
  compare( odp.state, states.LOAD );

  test.callback();
};
