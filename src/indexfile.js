var Index = require('./index').Index,
    Request = require('./libs/request').Request,
    getFileNameExt = require('./libs/utils').getFileNameExt,
    maps = require('./maps'),
    utils = require("./libs/utils"),
    logger = require('./libs/logger');

var create = exports.create = function create(content,index){
  var src = content['src'];
  logger.debug('Creating new IndexFile instance for the file at src:"'+src+'"');
  var ind = maps.getConstructorByFormat(src).apply(null,arguments);
  ind.wd = utils.dir(src);
  logger.info('  Set WD as '+ind.wd)
  return ind;
};

maps.types.widget = maps.types.application = maps.types.index = create;

/**
 * Represents an external document containing dependency information
 */
var IndexFile = exports.IndexFile = function IndexFile(){
  Index.prototype.constructor.call(this);
  this.content = null;
  this.src = null;
  this.callbacks.importFileContent = [];
  this.callbacks.loadFile = [];
};

utils.extend( IndexFile, Index );

IndexFile.prototype.loadFile = function(){
  logger.debug('Loading index file "'+this.src+'"');
  var req = new Request(this.src);
  req.callbacks.load.push( this.getEmitter('loadFile') );
  req.callbacks.error.push( this.getEmitter('error') );
  req.send();
  return req;
}

IndexFile.prototype.importFileContent = function(){
  logger.debug('Importing content of IndexFile instance, "'+this.src+'"');
  this.ns = this.content['namespace'];
  for(var i = -1, len=this.content.dependencies.length; ++i < len; ){
    var el = this.content.dependencies[i];
    typeof el == 'string' && (el = { "src":el });
    constructor = el.hasOwnProperty('type') && maps.getConstructorByType(el['type']) || maps.getConstructorByFormat(el['src']);

    utils.isRelativePath(el['src']) && this.wd && ( el['src'] = this.wd + '/' + el['src'] );

    this.dependencies.push( constructor(el,this) );
  };

  this.getEmitter('importFileContent')();
};
