var IndexFile = require('../../indexfile').IndexFile,
    maps = require('../../maps'),
    utils = require('../../libs/utils'),
    parse = require('./utils').parse,
    logger = require('../../libs/logger'),
    extend = utils.extend,
    dir = utils.dir,
    partial = utils.partial;

var create = exports.create = function create(content,index){
  var src = content['src'];

  logger.debug('Creating new JSONIndex instance, filename:'+src);

  var ind = new JSONIndex();
  ind.src = src;
  ind.wd = dir(src); 
  return ind;
};

maps.formats.json = create;

var JSONIndex = exports.JSONIndex = function JSONIndex(){
  IndexFile.prototype.constructor.call( this );
};

extend( JSONIndex, IndexFile );

JSONIndex.prototype.parseFile = function(req){
  logger.debug('Trying to parse the file at "'+this.src+'" to JS objects');
  this.content = parse( req.responseText );
}
