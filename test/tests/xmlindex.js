var xmlindex = domloader.require('./ext/xml/xmlindex');

var test_xmlindex = function(test){
  var xmlind = new xmlindex.XMLIndex();
  compare( xmlind.content, null );
  compare( xmlind.src, null );
  assert( xmlind.dependencies );
  assert( xmlind.loadFile );
  assert( xmlind.importFileContent );
  compare( xmlind.callbacks.loadFile.length, 0);
  test.callback();
};

var test_xmlindex_parse = function(test){
  var xmlind = new xmlindex.XMLIndex();
  xmlind.src = 'docs/xml/child1/index.xml';

  xmlind.callbacks["loadFile"].push(function(req){
    try {
      xmlind.parseFile(req);
      xmlind.importFileContent();

      var content = xmlind.content;
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

  xmlind.callbacks['error'].push(function(err){
    test.error = err;
    test.callback();
  });

  xmlind.loadFile();
};
