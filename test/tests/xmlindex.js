var xmlindex = domloader.require('./ext/xml/xmlindex');

var test_xmlindex = function(test){
  var xmlind = new xmlindex.XMLIndex();
  compare( xmlind.content, null );
  compare( xmlind.src, null );
  assert( xmlind.dependencies );
  assert( xmlind.loadFile );
  assert( xmlind.importFileContent );
  compare( xmlind.callbacks.loadFile.length, 1);
  compare( xmlind.callbacks.importFileContent.length, 0);
  test.callback();
};

var test_xmlindex_parse = function(test){
  var jind = new xmlindex.XMLIndex();
  jind.src = 'docs/xml/child1/index.xml';

  jind.callbacks["loadFile"].push(domloader.require('./libs/utils').partial(jind.importFileContent,[],jind));
  jind.callbacks["parseFile"].push(function(){
    try {
      var content = jind.content;
      compare( content['name'], 'Child1' );
      compare( content['version'], '1.0' );
      assert( content['namespace']['child1_ns'] )
      compare( content.dependencies.length, 3 );
      compare( content.dependencies[0].type, 'module' );
      compare( content.dependencies[0].src, 'foo.js' );
      compare( content.dependencies[1].type, 'stylesheet' );
      compare( content.dependencies[1].src, 'foo.css' );
      compare( content.dependencies[2].type, 'widget' );
      compare( content.dependencies[2].src, '../child3.xml' );
    } catch(excinfo) {
      test.error = excinfo;
    }
    test.callback();
  });

  jind.callbacks['error'].push(function(err){
    test.error = err;
    test.callback();
  });

  jind.loadFile();
};
