var createObjectDp = exports.createObjectDp = ctxmap.dependencyTypes.object = function(content){
  var odp = new ObjectDp();
  odp.name = content['name'];
  odp.src = content['src'];

  if( content.hasOwnProperty('properties') ){
    for(var i = -1, len= content['properties'].length; ++i < len; ){
      var propContent = content['properties'][i],
          prop = { 'name':propContent.name };

      propContent.hasOwnProperty('match') && ( prop['match'] = new RegExp(propContent['match']) );

      odp.properties.push(prop);
    };
  }
  
  return odp;
} 

/**
 * Represents an object name and javascript module which will be loaded when global object doesn't contain a property with the name.
 */ 
var ObjectDp = exports.ObjectDp = function(){
  Dependency.prototype.constructor.call(this);
  this.name = null;
  this.src = null;
  this.properties = [];
}

lib.extend( ObjectDp, Dependency );

ObjectDp.prototype.refreshState = function(){
  var nres = lib.resolveNSPath( this.name ), loaded = nres.childrenNames.length == 0;
  for(var i = -1, len=this.properties.length; ++i < len && loaded;){
    var prop = this.properties[i];
    loaded = nres.parentObject.hasOwnProperty(prop.name) && ( !prop.match || prop.match.test(nres.parentObject[prop.name]) );
  };

  this.state = loaded && LOAD || UNINITIALIZED; 
}

ObjectDp.prototype.load = function(){
  this.refreshState();
  var loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');

  if( this.state != LOAD ){
    lib.includeScript(this.src,loadEmitter,errorEmitter);
  } else {
    loadEmitter();
  }
}
