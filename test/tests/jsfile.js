var jsfile = domloader.require('jsfile');

var test_jsfile_load = function(test){
  var JSFile = jsfile.JSFile;
  var jsf = new JSFile();
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
  var JSFile = jsfile.JSFile;
  var jsf = new JSFile();
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
