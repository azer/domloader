var test_domloader_loadfn = function(test){
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
