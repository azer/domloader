/**
 * Shortcut to initialize, import and load index documents. 
 */
var load = exports.load = function(src,callback,errback){
  var ind = createIndexFile({ 'src':src });

  ind.callbacks["loadFile"].push(partial(ind.importFileContent,[],ind));
  ind.callbacks["importFileContent"].push(partial(ind.setNS,[],ind),partial(ind.load,[],ind));

  ind.src = src;
  ind.wd = dir( ind.src );
  callback && ind.callbacks.load.push(callback);
  errback && ind.callbacks.error.push(errback);

  ind.loadFile();

  return ind;
};
