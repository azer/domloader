var jsonindex = domloader.require('./ext/json/jsonindex');

var test_json = function(test){
  assert( jsonindex.JSONIndex );
  assert( jsonindex.create );
  assert( domloader.require('./ext/json/utils').parse );
  test.callback();
};

var test_jsonindex = function(test){
  var jind = new jsonindex.JSONIndex();
  compare( jind.content, null );
  compare( jind.src, null );
  assert( jind.dependencies );
  assert( jind.loadFile );
  assert( jind.importFileContent );
  compare( jind.callbacks.loadFile.length, 0);
  test.callback();
};

var test_jsonindex_parse = function(test){
  var jind = new jsonindex.JSONIndex();
  jind.src = 'docs/json/child1/index.json';
  jind.wd = '';

  jind.callbacks["loadFile"].push(function(req){
    try {
      jind.parseFile(req);
      jind.importFileContent();
      
      var content = jind.content;
      compare( content['name'], 'Child1' );
      compare( content['version'], '1.0' );
      compare( content.dependencies.length, 3 );
      compare( content.dependencies[0].type, 'module' );
      compare( content.dependencies[0].src, 'foo.js' );
      compare( content.dependencies[1].type, 'stylesheet' );
      compare( content.dependencies[1].src, 'foo.css' );
      compare( content.dependencies[2].type, 'widget' );
      compare( content.dependencies[2].src, '../child3.json' );
      test.callback();
    } catch(exc) {
      test.error = exc;
      test.callback();
    }
  });

  jind.callbacks['error'].push(function(err){
    test.error = err;
    test.callback();
  });

  jind.loadFile();
};
