var request = domloader.require('./libs/request');

var test_request_load = function(test){
  var Request = request.Request;
  var req = new Request('deps/foo.js');
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
  var Request = request.Request;
  var req = new Request('non/existing/file');
  req.callbacks.load.push(function(){
    test.error = new Error('Request fired load event despiting the load error');
    test.callback();
  });
  req.callbacks.error.push(function(excinfo){
    test.callback();
  });
  req.send();
};
