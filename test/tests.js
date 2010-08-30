var rnd = function(){
  return Math.floor( Math.random()*1000 );
};

var test_head = function(test){
  assert( domloader.version != undefined );
  assert( domloader.debug != undefined );
  test.callback();
}

var test_ctxmap = function(test){
  assert( domloader.ctxmap );
  assert( domloader.ctxmap.indexTypes );
  assert( domloader.ctxmap.dependencyTypes );
  test.callback();
} 

var test_createElement = function(test){
  var el = domloader.createElement('label');
  compare( el.tagName, 'LABEL' );
  compare( el.nodeType, 1 );
  test.callback();
}

var test_dir = function(test){
  compare( domloader.dir('foo/bar/baz.qux'), 'foo/bar' );
  compare( domloader.dir('../foo/bar/baz.qux'), '../foo/bar' );
  compare( domloader.dir('./foo/bar/baz.qux'), './foo/bar' );
  compare( domloader.dir('http://quux.com/foo/bar/baz.qux'), 'http://quux.com/foo/bar' );
  compare( domloader.dir('foo.bar'), '')
  test.callback();
}

var test_includeScript = function(test){
  window["docs/xml/child1/foo.js"] = null;
  domloader.includeScript("docs/xml/child1/foo.js",function(){
    assert( window['docs/xml/child1/foo.js'] );
    test.callback();
  });
};

var test_isRelativePath = function(test){
  assert( domloader.isRelativePath('foo/bar') );
  assert( domloader.isRelativePath('./foo/bar') );
  assert( domloader.isRelativePath('../foo/bar') );
  assert( !domloader.isRelativePath('/foo/bar') );
  assert( !domloader.isRelativePath('http://foo/bar') );
  assert( !domloader.isRelativePath('https://foo/bar') );
  assert( !domloader.isRelativePath('ftp://foo/bar') );
  test.callback();
}

var test_getIndex = function(test){
  compare( domloader.getIndex([3,4,5],6), -1 );
  compare( domloader.getIndex([3,4,5],5), 2 );
  compare( domloader.getIndex([3,4,5],3), 0 );
  test.callback();
};

var test_partial = function(test){
  compare( domloader.partial(function(){ return this },[],domloader)(), domloader );
  compare( domloader.partial(function(){ return arguments[0]+arguments[1] },[17])(23), 40 );
  test.callback();
};

var test_remove = function(test){
  var l = [17,23,29];
  compare( domloader.remove(l,1).length, 2 );
  compare( domloader.remove(l,1)[1], 29 );
  compare( domloader.remove(l,1)[0], 17 );
  test.callback();
};

var test_resolveNSPath = function(test){
  compare( domloader.resolveNSPath('domloader.foo.bar').childrenNames.length, 2);
  compare( domloader.resolveNSPath('domloader.foo.bar').childrenNames[0], 'foo');
  compare( domloader.resolveNSPath('domloader.foo.bar').childrenNames[1], 'bar');
  compare( domloader.resolveNSPath('domloader.foo.bar').parentObject, domloader);
  test.callback();
};

var test_loadfn = function(test){
  window["docs/xml/child1/foo.js"] = null;
  domloader.load('docs/xml/child1/index.xml',function(){
    try {
      assert( window["docs/xml/child1/foo.js"] );
      assert( window["child1_ns"] );
      test.callback();
    } catch(exc){
      test.error = exc;
      test.callback();
    }
  },function(excInfo){ 
    test.error = excInfo;
    test.callback();
  });
};

var test_observable = function(test){
  var o = new domloader.Observable();
  o.callbacks.foobar = [];
  o.callbacks.foobar.push(function(a,r,g,s){
    for(var i=0;++i<5;)
      compare(i,arguments[i-1]);
    test.callback();
  });
  o.getEmitter('foobar')(1,2,3,4);
};

var test_dependency = function(test){
  var dp = new domloader.Dependency();
  compare( dp.cacheForce, domloader.debug );
  assert( dp.callbacks.error )
  assert( dp.callbacks.load )
  assert( dp.state = domloader.UNINITIALIZED );
  assert( dp.load );
  test.callback();
};

var test_index = function(test){
  var ind = new domloader.Index();
  assert( ind.dependencies );
  compare( ind.ns, null );
  assert( ind.wd.match(/test$/) );
  test.callback();
};

var test_index_load = function(test){
  var _dp = function(){ domloader.Dependency.prototype.constructor.call( this ); };
  domloader.extend( _dp, domloader.Dependency );
  _dp.prototype.load = function(){ this.getEmitter('load')(); };

  var ind = new domloader.Index();
  ind.dependencies.push(new _dp, new  _dp, new _dp);
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
};

var test_index_load_err = function(test){
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
};

var test_index_ns = function(test){
  var keys = [];
  for(var i = -1; ++i < 2; ) keys[i] = 'test_index_ns'+rnd();

  var ind = new domloader.Index();
  ind.ns = {};
  ind.ns[ keys[0] ] = 314;
  ind.ns[ keys[1] ] = 159;

  ind.setNS();
  compare(window[ keys[0] ], 314);
  compare(window[ keys[1] ], 159);
  test.callback();
};

var test_index_ns_res = function(test){
  var keys = [];
  for(var i = -1; ++i < 5; ) keys[i] = 'test_ind_ns_res'+rnd();

  window[ keys[0] ] = { 'foo':314 };
  window[ keys[0] ][ keys[1] ] = { 'bar':159 };
  window[ keys[0] ][ keys[1] ][ keys[2] ] = { 'baz':265 };

  var ind = new domloader.Index();
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

var test_createIndexFile = function(test){
  compare(domloader.ctxmap.dependencyTypes.index, domloader.createIndexFile);
  compare(domloader.ctxmap.dependencyTypes.widget, domloader.createIndexFile);
  compare(domloader.ctxmap.dependencyTypes.application, domloader.createIndexFile);

  var jsInd = domloader.createIndexFile({ src:'nonexisting/file/path.json' });
  compare(jsInd.src, 'nonexisting/file/path.json');
  compare(jsInd.wd, 'nonexisting/file');

  var childJSInd = domloader.createIndexFile({ src:'foo/bar/baz.json' },jsInd);
  compare(childJSInd.src, 'nonexisting/file/foo/bar/baz.json');
  compare(childJSInd.wd, 'nonexisting/file/foo/bar');

  test.callback();
}

var test_indexFile = function(test){
  var indf = new domloader.IndexFile();
  compare( indf.content, null );
  compare( indf.src, null );
  assert( indf.dependencies );
  compare( indf.callbacks.importFileContent, 0 );
  compare( indf.callbacks.loadFile.length, 0);
  test.callback();
};

var test_indexFile_load = function(test){
  var indf = new domloader.IndexFile();
  indf.src = 'deps/foo.js';
  indf.callbacks.loadFile.push(function(req){
    try {
      compare(req.responseText, 'window["deps/foo.js"] = true;\n');
    } catch(excinfo){
      test.error = excinfo;
    }
    test.callback();
  });
  indf.callbacks.error.push(function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  indf.loadFile();
};

var test_indexFile_load_error = function(test){
  var indf = new domloader.IndexFile();
  indf.src = 'non/existing/file';
  indf.callbacks.loadFile.push(function(){
    test.error = new Error('IndexFile fired loadFile event despiting the load error');
    test.callback();
  });
  indf.callbacks.error.push(function(){
    compare( indf.content, null);
    test.callback();
  });
  indf.loadFile();
};

var test_indexFile_importFileContent = function(test){
  var indf = new domloader.IndexFile();
  indf.content = {
    namespace:{ 'foobar':{}, 'test':[1,2,3] },
    dependencies:[
      {
        "type":"object", 
        "name":"objdp1", 
        "src":"deps/objdp1.js",
        "properties":[
          { "name":"version", "match":"1\\.0rc\\d*" },
          { "name":"foobar" }
        ]
      },
      { 
        "type":"object", 
        "name":"objdp2", 
        "src":"deps/objdp2.js",
        "properties":[
          { "name":"version", "match":"1\\.0rc\\d*" },
          { "name":"foobar", "match":"\\w+" }
        ]
      },
      { 
        "type":"object", 
        "name":"objdp3", 
        "src":"deps/objdp3.js"
      },
      { 
        "type":"module", 
        "src":"deps/foo.js"
      },
      { 
        "type":"stylesheet", 
        "src":"deps/foo.css"
      },
      { 
        "type":"index", 
        "src":"docs/json/child1/index.json"
      },
      { 
        "type":"application", 
        "src":"docs/json/child2/index.json"
      }
    ]
  };

  indf.callbacks.importFileContent.push(function(){
    try {
      assert( indf.ns.foobar );
      compare( indf.ns.test.length, 3);
      compare( indf.dependencies.length, 7 );
      compare( indf.dependencies[0].constructor, domloader.ObjectDp );
      compare( indf.dependencies[0].src, "deps/objdp1.js" );
      compare( indf.dependencies[0].name, "objdp1" );
      compare( indf.dependencies[0].properties.length, 2 );
      compare( indf.dependencies[0].properties[0].name, 'version' );
      compare( indf.dependencies[0].properties[0].match.source, '1\\.0rc\\d*' );
      compare( indf.dependencies[0].properties[1].name, 'foobar' );
      compare( indf.dependencies[1].src, "deps/objdp2.js" );
      compare( indf.dependencies[1].name, "objdp2" );
      compare( indf.dependencies[1].properties[0].name, 'version' );
      compare( indf.dependencies[1].properties[0].match.source, '1\\.0rc\\d*' );
      compare( indf.dependencies[1].properties[1].name, 'foobar' );
      compare( indf.dependencies[1].properties[1].match.source, '\\w+' );
      compare( indf.dependencies[2].constructor, domloader.ObjectDp );
      compare( indf.dependencies[2].src, "deps/objdp3.js" );
      compare( indf.dependencies[2].name, "objdp3" );
      compare( indf.dependencies[3].constructor, domloader.JSFile );
      compare( indf.dependencies[3].src, "deps/foo.js" );
      compare( indf.dependencies[4].constructor, domloader.Stylesheet );
      compare( indf.dependencies[4].src, "deps/foo.css" );
      compare( indf.dependencies[5].constructor, domloader.JSONIndex );
      compare( indf.dependencies[5].src, 'docs/json/child1/index.json' );
      compare( indf.dependencies[5].dependencies.length, 0 );
      compare( indf.dependencies[5].ns, null );
      compare( indf.dependencies[6].constructor, domloader.JSONIndex );
      compare( indf.dependencies[6].src, 'docs/json/child2/index.json' );
      compare( indf.dependencies[6].dependencies.length, 0 );
      compare( indf.dependencies[6].ns, null );
    } catch(exc) {
      test.error = exc;
    }
    test.callback();
  });
  
  indf.importFileContent();
}

var test_jsfile_load = function(test){
  var jsf = new domloader.JSFile();
  jsf.src = 'deps/foo.js';
  jsf.callbacks.load.push(function(){
    test.callback();
  });
  jsf.callbacks.error.push(function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  jsf.load();
}

var test_jsfile_load_error = function(test){
  var jsf = new domloader.JSFile();
  jsf.src = 'non/existing/file';
  jsf.callbacks.load.push(function(){
    test.error = new Error('JSFile fired load event despiting the load error');
    test.callback();
  });
  jsf.callbacks.error.push(function(excinfo){
    test.callback();
  });
  jsf.load();
};

var test_objectdp = function(test){
  var odp = new domloader.ObjectDp();
  compare( odp.state, domloader.UNINITIALIZED );
  compare( odp.name, null );
  compare( odp.src, null );
  assert( odp.properties );
  test.callback();
};

var test_objectdp_load = function(test){
  var name = 'objdp'+rnd();
  window['deps/objdp1.js#1'] = false;

  var odp = new domloader.ObjectDp();
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

  var odp = new domloader.ObjectDp();
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
  var name = 'objdp'+rnd();
  var odp = new domloader.ObjectDp();
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
  var odp = new domloader.ObjectDp();

  odp.name = 'NONEXISTENT';
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'domloader';
  odp.refreshState();
  compare( odp.state, domloader.LOAD );

  odp.name = 'domloader.nonexistent';
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'domloader.Dependency';
  odp.refreshState();
  compare( odp.state, domloader.LOAD );

  odp.name = 'domloader.Dependency.prototype.load';
  odp.refreshState();
  compare( odp.state, domloader.LOAD );

  odp.name = 'NONEXISTENT';
  odp.properties = [{ 'name':'nonexistent' }];
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'NONEXISTENT';
  odp.properties = [{ 'name':'nonexistent', 'match':/foobar/ }];
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'nonexistent' }];
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'version', 'match':/foobar/ }];
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'version', 'match':/1.0/ },{ 'name':'foobar' }];
  odp.refreshState();
  compare( odp.state, domloader.UNINITIALIZED );

  odp.name = 'domloader';
  odp.properties = [{ 'name':'version', 'match':/1.[0-9]/ }];
  odp.refreshState();
  compare( odp.state, domloader.LOAD );

  test.callback();
};

var test_request_load = function(test){
  var req = new domloader.Request('deps/foo.js');
  req.callbacks.load.push(function(){
    test.callback();
  });
  req.callbacks.error.push(function(excinfo){
    test.error = excinfo;
    test.callback();
  });
  req.send();
};

var test_request_error = function(test){
  var req = new domloader.Request('non/existing/file');
  req.callbacks.load.push(function(){
    test.error = new Error('Request fired load event despiting the load error');
    test.callback();
  });
  req.callbacks.error.push(function(excinfo){
    test.callback();
  });
  req.send();
};

var test_json = function(){
  assert( domloader.json );
  assert( domloader.json.JSONIndex );
  assert( domloader.json.construct );
  assert( domloader.json.parse );
}

var test_jsonindex = function(test){
  var jind = new domloader.JSONIndex();
  compare( jind.content, null );
  compare( jind.src, null );
  assert( jind.dependencies );
  assert( jind.loadFile );
  assert( jind.importFileContent );
  assert( jind.parseFile );
  compare( jind.callbacks.loadFile.length, 0);
  compare( jind.callbacks.parseFile.length, 0);
  compare( jind.callbacks.importFileContent.length, 0);
  test.callback();
};


var test_xmlindex = function(test){
  var xmlind = new domloader.XMLIndex();
  compare( xmlind.content, null );
  compare( xmlind.src, null );
  assert( xmlind.dependencies );
  assert( xmlind.loadFile );
  assert( xmlind.importFileContent );
  compare( xmlind.callbacks.loadFile.length, 0);
  compare( xmlind.callbacks.importFileContent.length, 0);
  test.callback();
};

