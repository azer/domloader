var Dependency = require('./dependency').Dependency,
    utils = require("./libs/utils"),
    maps = require('./maps'),
    logger= require('./libs/logger'),
    extend = utils.extend,
    includeScript = utils.includeScript;

var create = exports.create = function create(content,index){
  var jsf = new JSFile();
  jsf.src = content['src'];
  return jsf;
};

maps.formats.js = maps.types.js = maps.types.module = maps.types.script = create;

/**
 * Represents a single Javascript file dependency
 */
var JSFile = exports.JSFile = function JSFile(){
  Dependency.prototype.constructor.call(this);
  this.src = null;
  logger.info('Initialized new JSFile instance');
}

extend( JSFile, Dependency );

JSFile.prototype.load = function(){
  logger.debug('Trying to load JSFile "'+this.src+'"');
  includeScript( this.src, this.getEmitter('load'), this.getEmitter('error') );
}

