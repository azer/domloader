var indexfile = domloader.require('./indexfile');

var test_indexfile = function(test){
  var IndexFile = indexfile.IndexFile;
  var indf = new IndexFile();
  compare( indf.content, null );
  compare( indf.src, null );
  assert( indf.dependencies );
  compare( indf.callbacks.loadFile.length, 0);
  test.callback();
};

var test_indexfile_load = function(test){
  var IndexFile = indexfile.IndexFile;
  var indf = new IndexFile();
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

var test_indexfile_load_error = function(test){
  var IndexFile = indexfile.IndexFile;
  var indf = new IndexFile();
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

var test_indexfile_importFileContent = function(test){
  var jsfile = domloader.require("./jsfile"),
      stylesheet = domloader.require("./stylesheet"),
      objectdp = domloader.require("./objectdp"),
      jsonindex = domloader.require('./ext/json/jsonindex'),
      xmlindex = domloader.require('./ext/xml/xmlindex');

  var indf = new indexfile.IndexFile();
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

  indf.importFileContent();

  assert( indf.ns.foobar );
  compare( indf.ns.test.length, 3);
  compare( indf.dependencies.length, 7 );
  compare( indf.dependencies[0].constructor, objectdp.ObjectDp );
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
  compare( indf.dependencies[2].constructor, objectdp.ObjectDp );
  compare( indf.dependencies[2].src, "deps/objdp3.js" );
  compare( indf.dependencies[2].name, "objdp3" );
  compare( indf.dependencies[3].constructor, jsfile.JSFile );
  compare( indf.dependencies[3].src, "deps/foo.js" );
  compare( indf.dependencies[4].constructor, stylesheet.Stylesheet );
  compare( indf.dependencies[4].src, "deps/foo.css" );
  compare( indf.dependencies[5].constructor, jsonindex.JSONIndex );
  compare( indf.dependencies[5].src, 'docs/json/child1/index.json' );
  compare( indf.dependencies[5].dependencies.length, 0 );
  compare( indf.dependencies[5].ns, null );
  compare( indf.dependencies[6].constructor, jsonindex.JSONIndex );
  compare( indf.dependencies[6].src, 'docs/json/child2/index.json' );
  compare( indf.dependencies[6].dependencies.length, 0 );
  compare( indf.dependencies[6].ns, null );
  test.callback();
}

var test_indexfile_create = function(test){
  var maps = domloader.require('./maps');
  compare(maps.types.index, indexfile.create);
  compare(maps.types.widget, indexfile.create);
  compare(maps.types.application, indexfile.create);

  var jsInd = indexfile.create({ src:'nonexisting/file/path.json' });
  compare(jsInd.src, 'nonexisting/file/path.json');
  compare(jsInd.wd, 'nonexisting/file');

  var childJSInd = indexfile.create({ src:'foo/bar/baz.json' },jsInd);
  compare(childJSInd.src, 'nonexisting/file/foo/bar/baz.json');
  compare(childJSInd.wd, 'nonexisting/file/foo/bar');

  test.callback();
}

var test_indexfile_uri_list = function(test){
  var jsfile = domloader.require("./jsfile"),
      stylesheet = domloader.require("./stylesheet"),
      jsonindex = domloader.require('./ext/json/jsonindex'),
      xmlindex = domloader.require('./ext/xml/xmlindex');

  var indf = new indexfile.IndexFile();
  indf.content = {
    dependencies:[
      'deps/foo.js',
      'deps/foo.css',
      'docs/json/child1/index.json',
      'docs/json/child2/index.json'
    ]
  };
  indf.importFileContent();

  compare( indf.dependencies.length, 4 );
  compare( indf.dependencies[0].constructor, jsfile.JSFile );
  compare( indf.dependencies[0].src, "deps/foo.js" );
  compare( indf.dependencies[1].constructor, stylesheet.Stylesheet );
  compare( indf.dependencies[1].src, "deps/foo.css" );
  compare( indf.dependencies[2].constructor, jsonindex.JSONIndex );
  compare( indf.dependencies[2].src, 'docs/json/child1/index.json' );
  compare( indf.dependencies[2].dependencies.length, 0 );
  compare( indf.dependencies[2].ns, null );
  compare( indf.dependencies[3].constructor, jsonindex.JSONIndex );
  compare( indf.dependencies[3].src, 'docs/json/child2/index.json' );
  compare( indf.dependencies[3].dependencies.length, 0 );
  compare( indf.dependencies[3].ns, null );

  test.callback();

}

var test_indexfile_create = function(test){
  var maps = domloader.require('./maps');
  compare(maps.types.index, indexfile.create);
  compare(maps.types.widget, indexfile.create);
  compare(maps.types.application, indexfile.create);

  var jsInd = indexfile.create({ src:'nonexisting/file/path.json' });
  compare(jsInd.src, 'nonexisting/file/path.json');
  compare(jsInd.wd, 'nonexisting/file');

  var childJSInd = indexfile.create({ src:'foo/bar/baz.json' },jsInd);
  compare(childJSInd.src, 'foo/bar/baz.json');
  compare(childJSInd.wd, 'foo/bar');

  test.callback();
}
