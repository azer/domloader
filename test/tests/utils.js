var utils = domloader.require('./libs/utils');

var test_utils_createElement = function(test){
  var el = utils.createElement('label');
  compare( el.tagName, 'LABEL');
  compare( el.nodeType, 1);
  test.callback();
}

var test_utils_dir = function(test){
  var dir = utils.dir;
  compare( dir('foo/bar/baz.qux'), 'foo/bar' );
  compare( dir('../foo/bar/baz.qux'), '../foo/bar' );
  compare( dir('./foo/bar/baz.qux'), './foo/bar' );
  compare( dir('http://quux.com/foo/bar/baz.qux'), 'http://quux.com/foo/bar' );
  compare( dir('foo.bar'), '')
  test.callback();
}

var test_utils_includeScript = function(test){
  window["docs/xml/child1/foo.js"] = null;
  utils.includeScript("docs/xml/child1/foo.js",function(){
    assert( window['docs/xml/child1/foo.js'] );
    test.callback();
  });
};

var test_utils_isRelativePath = function(test){
  var isRelativePath = utils.isRelativePath;
  assert( isRelativePath('foo/bar') );
  assert( isRelativePath('./foo/bar') );
  assert( isRelativePath('../foo/bar') );
  assert( !isRelativePath('/foo/bar') );
  assert( !isRelativePath('http://foo/bar') );
  assert( !isRelativePath('https://foo/bar') );
  assert( !isRelativePath('ftp://foo/bar') );
  test.callback();
}

var test_utils_getFileNameExt = function(test){
  var getFileNameExt = utils.getFileNameExt;
  compare(getFileNameExt('foo.bar'),'bar');
  compare(getFileNameExt('qux/quux/foo.bar'),'bar');
  compare(getFileNameExt('http://corge.qux.baz/quux/foo.bar'),'bar');
  compare(getFileNameExt('foo.bar#qux.quux;:?%spam.eggs'),'bar');
  test.callback();
}

var test_utils_getIndex = function(test){
  var getIndex = utils.getIndex;
  compare( getIndex([3,4,5],6), -1 );
  compare( getIndex([3,4,5],5), 2 );
  compare( getIndex([3,4,5],3), 0 );
  test.callback();
};

var test_utils_partial = function(test){
  var partial = utils.partial;
  compare( partial(function(){ return this },[],domloader)(), domloader );
  compare( partial(function(){ return arguments[0]+arguments[1] },[17])(23), 40 );
  test.callback();
};

var test_utils_remove = function(test){
  var remove = utils.remove;
  var l = [17,23,29];
  compare( remove(l,1).length, 2 );
  compare( remove(l,1)[1], 29 );
  compare( remove(l,1)[0], 17 );
  test.callback();
};

var test_utils_resolveNSPath = function(test){
  var resolveNSPath = utils.resolveNSPath;
  compare( resolveNSPath('domloader.foo.bar').childrenNames.length, 2);
  compare( resolveNSPath('domloader.foo.bar').childrenNames[0], 'foo');
  compare( resolveNSPath('domloader.foo.bar').childrenNames[1], 'bar');
  compare( resolveNSPath('domloader.foo.bar').parentObject, domloader);
  test.callback();
};
