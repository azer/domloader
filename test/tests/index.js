var rnd = function(){
  return Math.floor( Math.random()*1000 );
};

var index = domloader.require('./index');

var test_index = function(test){
  var Index = index.Index;
  var ind = new Index();
  assert( ind.dependencies );
  compare( ind.ns, null );
  compare( ind.wd, null );
  test.callback();
};

var test_index_load = function(test){
  var Dependency = domloader.require('./dependency').Dependency,
      Index = index.Index,
      extend = domloader.require('./libs/utils').extend,
      states = domloader.require('./states');

  var _dp = function(){ Dependency.prototype.constructor.call( this ); };
  extend( _dp, Dependency );
  _dp.prototype.load = function(){ this.getEmitter('load')(); };

  var ind = new Index();
  ind.dependencies.push(new _dp, new  _dp, new _dp);
  ind.callbacks.error.push( function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  ind.callbacks.load.push( function(){
    try {
      compare( ind.state, states.LOAD );
    } catch(excinfo){
      test.error = excinfo;
    }
    test.callback();
  });
  ind.load();
  compare( ind.state, states.LOADING );
};

var test_index_load_err = function(test){
  var Dependency = domloader.require('./dependency').Dependency,
      Index = index.Index;

  var ind = new Index();
  ind.dependencies.push(new Dependency(), new Dependency(), new Dependency());
  ind.callbacks.error.push( function(error){
    try {
      compare( ind.state, states.ERROR );
    } catch(excinfo){
      test.error = excinfo;
    }
    test.callback();
  });
  ind.callbacks.load.push( function(){
    test.error = new Error('Index fired load event despiting load error');
    test.callback();
  });
  ind.load();
};

var test_index_ns = function(test){
  var Index = index.Index;

  var keys = [];
  for(var i = -1; ++i < 2; ) keys[i] = 'test_index_ns'+rnd();

  var ind = new Index();
  ind.ns = {};
  ind.ns[ keys[0] ] = 314;
  ind.ns[ keys[1] ] = 159;

  ind.setNS();
  compare(window[ keys[0] ], 314);
  compare(window[ keys[1] ], 159);
  test.callback();
};

var test_index_ns_res = function(test){
  var Index = index.Index;

  var keys = [];
  for(var i = -1; ++i < 5; ) keys[i] = 'test_ind_ns_res'+rnd();

  window[ keys[0] ] = { 'foo':314 };
  window[ keys[0] ][ keys[1] ] = { 'bar':159 };
  window[ keys[0] ][ keys[1] ][ keys[2] ] = { 'baz':265 };

  var ind = new Index();
  ind.ns = {};
  ind.ns[ keys.slice(0,4).join('.') ] = 358;
  ind.ns[ keys[4] ] = 979;

  ind.setNS();

  compare( window[ keys[0] ].foo, 314  );
  compare( window[ keys[0] ][ keys[1] ].bar, 159 );
  compare( window[ keys[0] ][ keys[1] ][ keys[2] ].baz, 265 );

  compare( window[ keys[0] ][ keys[1] ][ keys[2] ][ keys[3] ], 358 );
  compare( window[ keys[4] ], 979 );

  test.callback();
};

