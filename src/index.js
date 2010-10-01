var Dependency = require('./dependency').Dependency,
    utils = require("./libs/utils"),
    states = require("./states"),
    logger = require('./libs/logger'),
    dir = utils.dir,
    extend = utils.extend,
    getIndex = utils.getIndex,
    remove = utils.remove,
    resolveNSPath = utils.resolveNSPath;

/**
 * Represent, store and load several DOM dependencies, initialize required namespace if needed
 */
var Index = exports.Index = function Index(){
  Dependency.prototype.constructor.call(this);
  this.dependencies = [];
  this.ns = null;
//  this.wd = dir(location.href);
};

extend( Index, Dependency );

Index.prototype.load = function(){
  this.state = states.LOADING;
  var self = this;

  logger.debug('Loading Index','src:',this.src);

  var unloaded = this.dependencies.slice(0), self = this, loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');
  for(var i = -1, len=this.dependencies.length; ++i < len; ){
    var dp = this.dependencies[i];
    dp.callbacks.load.push((function(dp){
      return function(){
        logger.info('  Loaded:',dp.src);
        unloaded = remove( unloaded, getIndex(unloaded, dp) );
        unloaded.length == 0 && loadEmitter();
      }
    })(dp));
    dp.callbacks.error.push(errorEmitter);
    try {
     logger.debug('  Loading Dependency',dp.src);
      dp.load();
    }catch(exc){
      logger.critical(exc.message);
      errorEmitter(exc);
      break;
    }
  };
  unloaded.length == 0 && loadEmitter();
};

Index.prototype.setNS = function(){
  logger.debug('Setting namespace of Index','src:',this.src,'ns:',this.ns);
  for(var path in this.ns){
    logger.debug('  NS Path:',path);
    var res = resolveNSPath(path),
      parentObject = res.parentObject,
      key = null;

    while( key = res.childrenNames[0] ){

      if( res.childrenNames.length == 1 ){
        logger.debug('  Setting NS Property','key:',key,'Parent:',parentObject);
        parentObject[ key ] = this.ns[ path ];
        break;
      }
      
      parentObject = parentObject[ key ] = {};
      res.childrenNames.splice(0,1);
    }
  }
};
