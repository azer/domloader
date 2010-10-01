var config = require('config'),
    createIndexFile = require("./indexfile").create,
    partial = require("./libs/utils").partial,
    dir = require('./libs/utils').dir;

domloader.version = config.version;

/**
 * Shortcut to initialize, import and load index documents. 
 */
var load = exports.load = globals.domloader.load = function load(src,callback,errback){
  var ind = createIndexFile({ 'src':src });

  ind.callbacks["parseFile"].push(partial(ind.importFileContent,[],ind));
  ind.callbacks["importFileContent"].push(partial(ind.setNS,[],ind),partial(ind.load,[],ind));

  ind.src = src;
  ind.wd = dir( ind.src );
  callback && ind.callbacks.load.push(callback);
  errback && ind.callbacks.error.push(errback);

  ind.loadFile();

  return ind;
};
