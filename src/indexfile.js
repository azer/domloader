var createIndexFile = exports.createIndexFile = ctxmap.dependencyTypes.index = ctxmap.dependencyTypes.widget = ctxmap.dependencyTypes.application = function(content,index){
  var src = content['src'], src_ext = null;

  if( src && ( src_ext = src.match(/\.(\w+)(?:\?[\w\=\,\.\&\%\:]+)?|(?:\#.*)?$/) ) )
    format = src_ext[1];

  if( !ctxmap.indexTypes.hasOwnProperty( format ) )
    throw new Error('Unsupported index format: '+format);

  index && isRelativePath(src) && ( src = index.wd + '/' + src );

  var dp = new ctxmap.indexTypes[format];
  dp.src = src;
  dp.wd = dir(src);
  return dp;
}

/**
 * Represents an external document containing dependency information
 */
var IndexFile = exports.IndexFile = function(){
  Index.prototype.constructor.call(this);

  this.src = null;
};

extend( IndexFile, Index );

IndexFile.prototype.importContent = function(content){
  this.ns = content['namespace'];
  for(var i = -1, len=content.dependencies.length; ++i < len; ){
    var dpinf = content.dependencies[i],
        constructor = ctxmap.dependencyTypes[dpinf['type']];

    if(!constructor){
      throw new Error('Unknown Dependency Type:'+dpinf['type']);
    }

    this.dependencies.push( constructor(dpinf) );
  };

  this.getEmitter('importFileContent')();
};
