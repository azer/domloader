var wd = "http://y530/projects/domloader/test";

var test_api = function(test){

 // compare( domloader.Dependency.prototype.__proto__, domloader.Observable.prototype );
  var dep = new domloader.Dependency();
  compare( dep.url, null );
  compare( dep.state, domloader.UNINITIALIZED );
  assert( dep.callbacks.error );
  assert( dep.callbacks.load );
  
 // compare( domloader.Index.prototype.__proto__, domloader.Dependency.prototype );
  var ind = new domloader.Index();
  compare( ind.dependencies.length, 0 );
  compare( ind.ns, null );
  compare( ind.wd, wd );
  compare( typeof ind.load, "function" );
  compare( typeof ind.setNS, "function" );

//  compare( domloader.XMLIndex.prototype.__proto__, domloader.Index.prototype );
  var indXML = new domloader.XMLIndex();
  assert( indXML.callbacks['import'] );
  compare( indXML.wd, wd );
  compare( typeof indXML.importDocument, 'function' );

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

var test_ind_load = function(test){

  var FDp = function(){
    domloader.Dependency.prototype.constructor.call( this );
  };
  domloader.extend( FDp, domloader.Dependency );
  FDp.prototype.load = function(){
    this.getEmitter('load')();
  };

  var ind = new domloader.Index();
  ind.ns = { "foobar":{}, "test":[1,2,3] };
  ind.dependencies.push(new FDp(), new  FDp(), new  FDp());
  ind.callbacks.error.push( function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  ind.callbacks.load.push( function(){
    try {
      compare( ind.state, domloader.LOAD );
    } catch(excinfo){
      test.error = excinfo;
    }
    test.callback();
  });
  ind.load();
  compare( ind.state, domloader.LOADING );
}

var test_ind_load_err = function(test){
  var ind = new domloader.Index();
  ind.dependencies.push(new domloader.Dependency(), new  domloader.Dependency(), new  domloader.Dependency());
  ind.callbacks.error.push( function(error){
    try {
      compare( ind.state, domloader.ERROR );
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
}

var test_ind_ns = function(test){
  var ind = new domloader.Index();
  ind.ns = { "foobar":314 };
  ind.setNS();
  compare(window.foobar, 314);
  test.callback();
}

var test_json_import = function(test){
  var ind = new domloader.JSONIndex();
  ind.src = 'docs/json/root.json';
  ind.wd = 'docs/json';
  ind.callbacks['import'].push(function(req){
    try {
      assert( ind.ns.foobar );
      compare( ind.ns.test.length, 3);
      compare( ind.dependencies.length, 7 );
      compare( ind.dependencies[0].constructor, domloader.ObjectDp );
      compare( ind.dependencies[0].src, "docs/json/objdp1.js" );
      compare( ind.dependencies[0].name, "objdp1" );
      compare( ind.dependencies[0].properties.length, 2 );
      compare( ind.dependencies[0].properties[0].name, 'version' );
      compare( ind.dependencies[0].properties[0].match, '1\\.0rc\\d*' );
      compare( ind.dependencies[0].properties[1].name, 'foobar' );
      compare( ind.dependencies[1].src, "docs/json/objdp2.js" );
      compare( ind.dependencies[1].name, "objdp2" );
      compare( ind.dependencies[1].properties[0].name, 'version' );
      compare( ind.dependencies[1].properties[0].match, '1\\.0rc\\d*' );
      compare( ind.dependencies[1].properties[1].name, 'foobar' );
      compare( ind.dependencies[1].properties[1].match, '\\w+' );
      compare( ind.dependencies[2].constructor, domloader.ObjectDp );
      compare( ind.dependencies[2].src, "docs/json/objdp3.js" );
      compare( ind.dependencies[2].name, "objdp3" );
      compare( ind.dependencies[3].constructor, domloader.Module );
      compare( ind.dependencies[3].src, "docs/json/foo.js" );
      compare( ind.dependencies[4].constructor, domloader.Stylesheet );
      compare( ind.dependencies[4].src, "docs/json/foo.css" );
      compare( ind.dependencies[5].constructor, domloader.JSONIndex );
      compare( ind.dependencies[5].dependencies.length, 3 );
      compare( ind.dependencies[5].dependencies[0].constructor, domloader.Module );
      compare( ind.dependencies[5].dependencies[0].src, 'docs/json/child1/foo.js' );
      compare( ind.dependencies[5].dependencies[1].constructor, domloader.Stylesheet );
      compare( ind.dependencies[5].dependencies[1].src, 'docs/json/child1/foo.css' );
      compare( ind.dependencies[5].dependencies[2].constructor, domloader.JSONIndex );
      compare( ind.dependencies[5].dependencies[2].src, 'docs/json/child1/../child3.json' );
      compare( ind.dependencies[5].dependencies[2].dependencies.length, 0 );
      assert( ind.dependencies[5].dependencies[2].ns.child3 );
      compare( ind.dependencies[6].constructor, domloader.JSONIndex );
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

var test_xml_import = function(test){
  var ind = new domloader.XMLIndex();
  ind.src = 'docs/xml/root.xml';
  ind.wd = 'docs/xml';
  ind.callbacks['import'].push(function(req){
    try {
      assert( ind.ns.foobar );
      compare( ind.ns.test.length, 3);
      compare( ind.dependencies.length, 7 );
      compare( ind.dependencies[0].constructor, domloader.ObjectDp );
      compare( ind.dependencies[0].src, "docs/xml/objdp1.js" );
      compare( ind.dependencies[0].name, "objdp1" );
      compare( ind.dependencies[0].properties.length, 2 );
      compare( ind.dependencies[0].properties[0].name, 'version' );
      compare( ind.dependencies[0].properties[0].match, '1\\.0rc\\d*' );
      compare( ind.dependencies[0].properties[1].name, 'foobar' );
      compare( ind.dependencies[1].src, "docs/xml/objdp2.js" );
      compare( ind.dependencies[1].name, "objdp2" );
      compare( ind.dependencies[1].properties[0].name, 'version' );
      compare( ind.dependencies[1].properties[0].match, '1\\.0rc\\d*' );
      compare( ind.dependencies[1].properties[1].name, 'foobar' );
      compare( ind.dependencies[1].properties[1].match, '\\w+' );
      compare( ind.dependencies[2].constructor, domloader.ObjectDp );
      compare( ind.dependencies[2].src, "docs/xml/objdp3.js" );
      compare( ind.dependencies[2].name, "objdp3" );
      compare( ind.dependencies[3].constructor, domloader.Module );
      compare( ind.dependencies[3].src, "docs/xml/foo.js" );
      compare( ind.dependencies[4].constructor, domloader.Stylesheet );
      compare( ind.dependencies[4].src, "docs/xml/foo.css" );
      compare( ind.dependencies[5].constructor, domloader.XMLIndex );
      compare( ind.dependencies[5].dependencies.length, 3 );
      compare( ind.dependencies[5].dependencies[0].constructor, domloader.Module );
      compare( ind.dependencies[5].dependencies[0].src, 'docs/xml/child1/foo.js' );
      compare( ind.dependencies[5].dependencies[1].constructor, domloader.Stylesheet );
      compare( ind.dependencies[5].dependencies[1].src, 'docs/xml/child1/foo.css' );
      compare( ind.dependencies[5].dependencies[2].constructor, domloader.XMLIndex );
      compare( ind.dependencies[5].dependencies[2].src, 'docs/xml/child1/../child3.xml' );
      compare( ind.dependencies[5].dependencies[2].dependencies.length, 0 );
      assert( ind.dependencies[5].dependencies[2].ns.child3 );
      compare( ind.dependencies[6].constructor, domloader.XMLIndex );
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

var test_loadfn = function(test){
  window["docs/xml/child1/foo.js"] = null;
  domloader.load('docs/xml/child1/index.xml',function(){
    assert( window["docs/xml/child1/foo.js"] );
    test.callback();
  },function(excInfo){ 
    test.error = excInfo;
    test.callback();
  });
}
