/**
 * Represent, store and load several DOM dependencies, initialize required namespace if needed
 */
var Index = exports.Index = function(){
  Dependency.prototype.constructor.call(this);
  this.dependencies = [];
  this.ns = null;
  this.wd = dir(location.href);
};

extend( Index, Dependency );

Index.prototype.load = function(){
  this.state = LOADING;
  var self = this;

  log('Loading Index','src:',this.src);

  var unloaded = this.dependencies.slice(0), self = this, loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');
  for(var i = -1, len=this.dependencies.length; ++i < len; ){
    var dp = this.dependencies[i];
    dp.callbacks.load.push((function(dp){
      return function(){
        log('  Loaded:',dp.src);
        unloaded = remove( unloaded, getIndex(unloaded, dp) );
        unloaded.length == 0 && loadEmitter();
      }
    })(dp));
    dp.callbacks.error.push(errorEmitter);
    try {
      log('  Loading Dependency',dp.src);
      dp.load();
    }catch(exc){
      log('  Critical Error:',exc.message);
      errorEmitter(exc);
      break;
    }
  };
  unloaded.length == 0 && loadEmitter();
};

Index.prototype.setNS = function(){
  log('Setting namespace of Index','src:',this.src,'ns:',this.ns);
  for(var path in this.ns){
    
    log('  NS Path:',path);
    var res = resolveNSPath(path),
      parentObject = res.parentObject,
      key = null;

    while( key = res.childrenNames[0] ){

      if( res.childrenNames.length == 1 ){
        log('  Setting NS Property','key:',key,'Parent:',parentObject);
        parentObject[ key ] = this.ns[ path ];
        break;
      }
      
      parentObject = parentObject[ key ] = {};
      res.childrenNames.splice(0,1);
    }
  }
};
