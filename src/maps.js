var getFileNameExt = require('./libs/utils').getFileNameExt,
    logger = require('./libs/logger');

var formats = exports.formats = {};
var modules = exports.modules = {
  'css':['./stylesheet'],
  'js':[ './jsfile' ],
  'json':['./ext/json/jsonindex'],
  'module':[ './jsfile' ],
  'object':['./objectdp'],
  'script':[ './jsfile' ],
  'style':['./stylesheet'],
  'stylesheet':['./stylesheet'],
  'xml':['./ext/xml/xmlindex']
};
var types = exports.types = {};

var loadModules = exports.loadModules = function loadModules(key){
  logger.debug('Trying to load modules associated with key "'+key+'"');
  if(!modules.hasOwnProperty(key) || modules[key].length == 0)
    throw new Error('Found no module mapped to "'+key+'"');

  var module_paths = modules[key];
  for(var i = -1, len=module_paths.length; ++i < len; ){
    require(module_paths[i]);
  };
};

var getConstructorByFormat = exports.getConstructorByFormat = function getConstructorByFormat(filename){
  logger.debug('Returning the constructor associated with extension of passed filename "'+filename+'"');
  var ext = getFileNameExt(filename);
  if(!formats.hasOwnProperty(ext)){
    try {
      logger.warn('Extension "'+ext+'" is not mapped to any format constructor');
      loadModules(ext);
    } catch(exc){
      logger.critical(exc.message);
      throw new Error('Could not initialize the constructor associated with the detected dependency format of '+filename)
    }
  }
  return formats[ext];
};

var getConstructorByType = exports.getConstructorByType = function getConstructorByType(typeName){
  logger.debug('Trying to return the constructor associated with specified type "'+typeName+'"');
  if(!types.hasOwnProperty(typeName)){
    try {
      logger.warn('Type "'+typeName+'" is not mapped to any format constructor');
      loadModules(typeName);
    } catch(exc) {
      logger.critical(exc.message);
      throw new Error('Could not initialize the constructor associated with the dependency type of '+typeName)
    }
  }
  return types[typeName];
}
