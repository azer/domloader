var Dependency = require('./dependency').Dependency,
    utils = require("./libs/utils"),
    maps = require('./maps'),
    states = require('./states'),
    extend = utils.extend,
    includeScript = utils.includeScript,
    resolveNSPath = utils.resolveNSPath;

var create = exports.create = function create(content,index){
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

maps.types.object = create;

/**
 * Represents an object name and javascript module which will be loaded when global object doesn't contain a property with the name.
 */ 
var ObjectDp = exports.ObjectDp = function ObjectDp(){
  Dependency.prototype.constructor.call(this);
  this.name = null;
  this.src = null;
  this.properties = [];
}

extend( ObjectDp, Dependency );

ObjectDp.prototype.refreshState = function(){
  var nres = resolveNSPath( this.name ), loaded = nres.childrenNames.length == 0;
  for(var i = -1, len=this.properties.length; ++i < len && loaded;){
    var prop = this.properties[i];
    loaded = nres.parentObject.hasOwnProperty(prop.name) && ( !prop.match || prop.match.test(nres.parentObject[prop.name]) );
  };

  this.state = loaded && states.LOAD || states.UNINITIALIZED; 
}

ObjectDp.prototype.load = function(){
  this.refreshState();
  var loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');

  if( this.state != states.LOAD ){
    includeScript(this.src,loadEmitter,errorEmitter);
  } else {
    loadEmitter();
  }
}
