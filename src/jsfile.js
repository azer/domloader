var createJSFile = exports.createJSFile = ctxmap.dependencyTypes.script = ctxmap.dependencyTypes.module = function(content){
  var jsf = new JSFile();
  jsf.src = content['src'];
  return jsf;
};

/**
 * Represents a single Javascript file dependency
 */
var JSFile = exports.JSFile = function(){
  Dependency.prototype.constructor.call(this);
  this.src = null;
}

lib.extend( JSFile, Dependency );

JSFile.prototype.load = function(){
  lib.includeScript( this.src, this.getEmitter('load'), this.getEmitter('error') );
}

