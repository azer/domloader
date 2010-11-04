var config = require('./config'),
    createIndexFile = require("./indexfile").create,
    partial = require("./libs/utils").partial,
    dir = require('./libs/utils').dir;

domloader.version = config.version;

/**
 * Shortcut to initialize, import and load index documents. 
 */
var load = exports.load = globals.domloader.load = function load(src,callback,errback){
  var ind = createIndexFile({ 'src':src });
  callback && ind.callbacks.load.push(callback);
  errback && ind.callbacks.error.push(errback);
  ind.load();
  return ind;
};

/**
 * Provide manual dependency check.
 */
globals.domloader.loadObject = function loadObject(obj, src, callback, errback) {
  if ('undefined' === typeof obj) {
    load(src, callback, errback);
  }
  else {
    callback && callback();
  }
};
