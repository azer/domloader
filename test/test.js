var test_api = function(test){
  var dep = new domloader.Dependency();
  compare( dep.url, null );
  compare( dep.state, domloader.UNINITIALIZED );
  compare( typeof dep.getEmitter, "function" );
  assert( dep.callbacks.error );
  assert( dep.callbacks.ready );
  
  var ind = new domloader.Index();
  compare( ind.dependencies.length, 0 );
  compare( ind.ns, null );
  compare( ind.wd, "http://dev.kodfabrik.com/domloader/test" );
  compare( typeof ind.load, "function" );
  compare( typeof ind.setNS, "function" );

  test.callback();
}

var test_observable = function(test){
  var o = new domloader.Observable();
  o.callbacks.foobar = [];
  o.callbacks.foobar.push(function(a,r,g,s){
    for(var i=0;++i<5;)
      compare(i,arguments[i-1]);
    test.callback();
  });
  o.getEmitter('foobar')(1,2,3,4);
}

var test_import = function(test){
  var ind = new domloader.Index();
  ind.src = 'docs/root.xml';
  ind.wd = 'docs';
  ind.callbacks['import'].push(function(req){
    try {
      assert( ind.ns.foobar );
      compare( ind.ns.test.length, 3);
      compare( ind.dependencies.length, 7 );
      compare( ind.dependencies[0].constructor, domloader.ObjectDp );
      compare( ind.dependencies[0].src, "docs/objdp1.js" );
      compare( ind.dependencies[0].name, "objdp1" );
      compare( ind.dependencies[0].properties.length, 2 );
      compare( ind.dependencies[0].properties[0].name, 'version' );
      compare( ind.dependencies[0].properties[0].match, '1\\.0rc\\d*' );
      compare( ind.dependencies[0].properties[1].name, 'foobar' );
      compare( ind.dependencies[1].src, "docs/objdp2.js" );
      compare( ind.dependencies[1].name, "objdp2" );
      compare( ind.dependencies[1].properties[0].name, 'version' );
      compare( ind.dependencies[1].properties[0].match, '1\\.0rc\\d*' );
      compare( ind.dependencies[1].properties[1].name, 'foobar' );
      compare( ind.dependencies[1].properties[1].match, '\\w+' );
      compare( ind.dependencies[2].constructor, domloader.ObjectDp );
      compare( ind.dependencies[2].src, "docs/objdp3.js" );
      compare( ind.dependencies[2].name, "objdp3" );
      compare( ind.dependencies[3].constructor, domloader.Module );
      compare( ind.dependencies[3].src, "docs/foo.js" );
      compare( ind.dependencies[4].constructor, domloader.Stylesheet );
      compare( ind.dependencies[4].src, "docs/foo.css" );
      compare( ind.dependencies[5].constructor, domloader.Index );
      compare( ind.dependencies[5].dependencies.length, 3 );
      compare( ind.dependencies[5].dependencies[0].constructor, domloader.Module );
      compare( ind.dependencies[5].dependencies[0].src, 'docs/child1/foo.js' );
      compare( ind.dependencies[5].dependencies[1].constructor, domloader.Stylesheet );
      compare( ind.dependencies[5].dependencies[1].src, 'docs/child1/foo.css' );
      compare( ind.dependencies[5].dependencies[2].constructor, domloader.Index );
      compare( ind.dependencies[5].dependencies[2].src, 'docs/child1/../child3.xml' );
      compare( ind.dependencies[5].dependencies[2].dependencies.length, 0 );
      assert( ind.dependencies[5].dependencies[2].ns.child3 );
      compare( ind.dependencies[6].constructor, domloader.Index );
      compare( ind.dependencies[6].dependencies.length, 0 );
      compare( ind.dependencies[6].ns, null );
    } catch(exc) {
      test.error = exc;
    }
    test.callback();
  });
  ind.callbacks.error.push(function(error){
    test.error = error;
    test.callback();
  });
  ind.importDocument();
}

var test_load = function(test){
  window.objdp1 = null, window.objdp2 = { "version":"1.0rc1", "foobar":"f" }, objdp3 = null;

  var ind = new domloader.Index();
  ind.src = 'docs/root.xml';
  ind.wd = 'docs';
  ind.callbacks['import'].push(function(){
    ind.load();
  });
  ind.callbacks.load.push(function(){
    try {
      assert( window.foobar );
      compare( window.test.length, 3 );
      assert( window["docs/foo.js"] );
      assert( window["docs/child1/foo.js"] );
      assert( objdp1 );
      assert( objdp2 );
      assert( objdp3 );
    } catch(exc){
      test.error = exc;
    }
    test.callback();
  });
  ind.callbacks.error.push(function(error){
    test.error = error;
    test.callback();
  });
  ind.importDocument();
}

var test_loadfn = function(test){
  window["docs/child1/foo.js"] = null;
  domloader.load('docs/child1/index.xml',function(){
    assert( window["docs/child1/foo.js"] );
    test.callback();
  });
}
