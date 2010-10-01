var domloader = (function(globals,undefined){

  var jsbuild = (function(){

    var cache = {};

    function Module(){
      this.exports = null;
      this.fileName = null;
      this.id = null;
      this.workingDir = null;
      this.wrapper = null;
    };

    Module.prototype.call = function(){
      this.exports = {};
      return this.wrapper.call(null, this.exports, this, partial(require, [ this.workingDir ], null), globals);
    };

    function defineModule(path,modwrapper){
      var module = new Module();
      module.wrapper = modwrapper;
      module.fileName = path;
      module.id = getId( module.fileName );
      module.workingDir = getDir( module.fileName ); 

      cache[module.fileName] = module;

      return module;
    };

    function getDir(path){
      return path.replace(/\/?[^\/]*$/,"");
    }

    function getId(path){
      var name = path.match(/\/?([\w_-]+)\.js$/);
      name && ( name = name[1] );
      return name;
    };

    function getModuleByFilename(filename){
      return cache[filename];
    }

    function partial(fn,init_args,scope){
      !init_args && ( init_args = [] );
      return function(){
        var args = Array.prototype.slice.call(init_args,0);
        Array.prototype.push.apply(args,arguments);
        return fn.apply(scope,args);
      };
    };

    function resolvePath(path,wd){
      if(path.substring(0,1) == '/' || /^\w+\:\/\//.test(path)) return path;

      /\/$/.test(wd) && ( wd = wd.substring(0,wd.length-1) );
      /^\.\//.test(path) && ( path = path.substring(2,path.length) );

      if(path.substring(0,3)=='../'){
        var lvl = path.match(/^(?:\.\.\/)+/)[0].match(/\//g).length;
        wd = wd.replace(new RegExp("(\\/?\\w+){"+lvl+"}$"),'');
        path = path.replace(new RegExp("(\\.\\.\\/){"+lvl+"}"),'');
      };
       
      return ( wd && wd+'/' || '' )+path;
    };

    function require(workingDir,path){

      !/\.js(\?.*)?$/.test(path) && ( path = path+'.js' );

      var uri = resolvePath(path,workingDir), mod = cache[uri];

      if(!mod) throw new Error('Cannot find module "'+path+'". (Working Dir:'+workingDir+', URI:'+uri+' )')

      mod.exports==null && mod.call();

      return mod.exports;
    };

    return {
      "Module":Module,
      "cache":cache,
      "defineModule":defineModule,
      "getDir":getDir,
      "getId":getId,
      "getModuleByFilename":getModuleByFilename,
      "partial":partial,
      "resolvePath":resolvePath,
      "require":require
    };

  })();

  return {
    '_jsbuild_':jsbuild,
    'require':jsbuild.partial(jsbuild.require,[''])
  };

})(this); 

domloader._jsbuild_.defineModule("libs/utils.js",function(exports,module,require,globals,undefined){
 var globals = this,
    dom = this.document,
    logger = require('./logger');

/**
 * Create new DOM node with nodeType set to 1, in concordance with global namespace
 */
var createElement = exports.createElement = function createElement(tagName){
  return dom.documentElement.getAttribute('xmlns') && dom.createElementNS(dom.documentElement.getAttribute('xmlns'),tagName) || dom.createElement(tagName);
}

/**
 * Extract directory path from passed uri/url
 */
var dir = exports.dir = function dir(path){
  return path.replace(/\/?[^\/]+$/,"");
}

/**
 * Provide simple inheritance by setting prototype and constructor of given subclass.
 */ 
var extend = exports.extend = function extend(subclass,superclass){
  subclass.prototype = new superclass;
  subclass.prototype.constructor = subclass;
};

var getFileNameExt = exports.getFileNameExt = function getFileNameExt(filename){
  var match = filename.match(/\.(\w+)(?:\#.*)?$/);
  return match && match[1] || '';
}

/**
 * Import the javascript document located in specified URL. 
 */
var includeScript = exports.includeScript = function includeScript(url,callback,errback){
  logger.debug('Trying to include the javascript file at "'+url+'"');

  var el = createElement('script');
  el.setAttribute('src',url);
  el.setAttribute('type','text/javascript');
  //el.setAttribute('async',true);

  el.onload = el.onreadystatechange = function(){
    if( this.readyState && this.readyState!='complete' && this.readyState!='loaded') return;
    logger.info('Loaded the javascript file at "'+url+'"');
    callback();
  };

  el.onerror = el.onunload = function(){
    var errmsg = 'Could not load the javascript file at "'+url+'"';
    logger.error(errmsg);
    errback(errmsg);
  };

  dom.getElementsByTagName('head')[0].appendChild(el);
  return el;
};

/**
 * Test whether given URI is a relative path or not
 */
var isRelativePath = exports.isRelativePath = function isRelativePath(path){
  return path && !path.match(/^\w+\:\/\//) && path.substring(0,1) != '/';
}

/**
 * Returns the first index at which a given element can be found in the array, or -1 if it is not present.
 */
var getIndex = exports.getIndex = function getIndex(list,el){
  if(list.indexOf) return list.indexOf(el);
  for(var i=-1,len=list.length; ++i<len;){
    if( list[i] == el ) return i;
  }
  return -1;
};

/**
  * Create and return a wrapper function executing given function with specified scope and arguments
  */
var partial = exports.partial = function partial(fn,init_args,scope){
  !init_args && ( init_args = [] );
  return function(){
    var args = Array.prototype.slice.call(init_args,0);
    Array.prototype.push.apply(args,arguments);
    return fn.apply(scope,args);
  };
};

/**
 * Depart the element located on specified index from given array
 */
var remove = exports.remove = function remove(list,index){
  return index == -1 && list || list.slice(0,index).concat( list.slice(index+1) );
}

/**
 * Take a string formatted namespace path and return latest object in the path which is existing and a list including names of the nonexistent ones in given order. 
 *
 * Usage Examples:
 *    >>> window.foo
 *    { 'foo':314 }
 *    >>> domloader.resolveNSPath( 'foo.bar' );
 *    { 'parentObject':{ 'foo':314 }, 'childrenNames':['bar'] }
 *    >>> window.foo.bar = { 'bar':156 };
 *    >>> domloader.resolveNSPath( 'foo.bar.baz.qux.quux.corge.grault' );
 *    { 'parentObject':{ 'bar':156 }, 'childrenNames':['baz','qux','quux','corge','grault'] }
 */
var resolveNSPath = exports.resolveNSPath = function resolveNSPath(nspath,parentObject){
  logger.debug('Resolving NS',nspath);
  var names = nspath && nspath.split('.') || [];
  var childName = null;

  parentObject = parentObject || globals;

  while( childName = names[0] ){
    if( ! ( childName in parentObject ) ) break;
    parentObject = parentObject[ childName ];
    names.splice(0,1);
  };

  logger.info('  Resolved "',nspath,'" parentObject:',parentObject,'childrenNames',names.join(', '));

  return { 'parentObject':parentObject, 'childrenNames':names };
}; 
 
});

domloader._jsbuild_.defineModule("libs/logger.js",function(exports,module,require,globals,undefined){
 var enabled = exports.enabled = require('../config').debug,
    prefix = exports.prefix = 'DOMLoader',
    levels = exports.levels = ['debug','info','warn','error','critical'];

var log = exports.log = function log(level){
  if(!enabled || !this.console) return;
  var fn = console[level] || console.log;
  Array.prototype.splice.call(arguments, 0,1,prefix+' - '+level.toUpperCase()+' - ');
  return fn.apply(console, arguments );
};

for(var i = -1, len=levels.length; ++i < len; ) {
  var level = levels[i];
  exports[level] = (function(level){
    return function(){
      Array.prototype.splice.call(arguments, 0,0,levels[level]);
      return log.apply(null,arguments);
    }
  })(i);
};
 
});

domloader._jsbuild_.defineModule("libs/request.js",function(exports,module,require,globals,undefined){
 var Observable = require('./observable').Observable,
    extend = require('./utils').extend,
    logger = require("./logger");

/**
 * An observable&cross browser wrapper of XMLHttpRequest class
 */
var Request = exports.Request = function Request(url){
  Observable.prototype.constructor.call( this );

  logger.debug('Initializing new HTTP request to',url);
  
  this.callbacks.load = [];
  this.callbacks.error = [];

  var req = this._req_ = typeof XMLHttpRequest != 'undefined' && new XMLHttpRequest || (function(){
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) {}
    throw new Error("This browser does not support XMLHttpRequest.");
  })();

  var loadEmitter = this.getEmitter('load');
  var errorEmitter = this.getEmitter('error');
  req.open('GET',url,true);
  req.onreadystatechange = function(){
    logger.info( '  Request state has changed', '(:url', url, ':readyState', req.readyState + ')' );
    req.readyState == 4 && ( req.status == 200 ? loadEmitter(req) : errorEmitter(new Error("Could not load "+url+", readystate:"+req.readyState+" status:"+req.status)) );
  };
};

extend( Request, Observable );

Request.prototype.send = function(){
  this._req_.send(null);
}
 
});

domloader._jsbuild_.defineModule("libs/observable.js",function(exports,module,require,globals,undefined){
 /** 
 * Observable Class - By Azer Koculu <azerkoculu@gmail.com> (MIT Licensed)
 *
 * Represents observable objects which can have many subscribers in different subjects and have a property named "callbacks", storing observation subjects.
 * To emit events and solve the scope problem being encountered during observation chaining in a simple way, Observable objects also have getEmitter method 
 * returning a function calling subscribers asynchronously for specified subject.
 */
var Observable = exports.Observable = function Observable(){
  this.callbacks = {}; 
};  

/** 
 * Return a function calling subscribers asynchronously for specified subject.
 */
Observable.prototype.getEmitter = function(eventName){
  if( !this.callbacks.hasOwnProperty(eventName) ) throw new Error("Invalid Event Name: "+eventName);
  var subscribers = this.callbacks[eventName];
  return function(){
    var args = Array.prototype.slice.call(arguments,0);
    for(var i = -1, len=subscribers.length; ++i < len; ) {
      if( typeof subscribers[i] != "function" ){
        throw new Error('Invalid subscriber. Subject:'+eventName+', Index:'+i);
      }
      setTimeout((function(fn){
        return function(){
          fn.apply(null,args);
        };
      })(subscribers[i]), 10 );
    };
  };
};
 
});

domloader._jsbuild_.defineModule("config.js",function(exports,module,require,globals,undefined){
 exports.debug = true;
exports.version = "1.0";
 
});

domloader._jsbuild_.defineModule("index.js",function(exports,module,require,globals,undefined){
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
 
});

domloader._jsbuild_.defineModule("domloader.js",function(exports,module,require,globals,undefined){
 var config = require('config'),
    createIndexFile = require("./indexfile").create,
    partial = require("./libs/utils").partial,
    dir = require('./libs/utils').dir;

domloader.version = config.version;

/**
 * Shortcut to initialize, import and load index documents. 
 */
var load = exports.load = globals.domloader.load = function load(src,callback,errback){
  var ind = createIndexFile({ 'src':src });

  ind.callbacks["parseFile"].push(partial(ind.importFileContent,[],ind));
  ind.callbacks["importFileContent"].push(partial(ind.setNS,[],ind),partial(ind.load,[],ind));

  ind.src = src;
  ind.wd = dir( ind.src );
  callback && ind.callbacks.load.push(callback);
  errback && ind.callbacks.error.push(errback);

  ind.loadFile();

  return ind;
};
 
});

domloader._jsbuild_.defineModule("indexfile.js",function(exports,module,require,globals,undefined){
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
 
});

domloader._jsbuild_.defineModule("jsfile.js",function(exports,module,require,globals,undefined){
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

 
});

domloader._jsbuild_.defineModule("objectdp.js",function(exports,module,require,globals,undefined){
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
 
});

domloader._jsbuild_.defineModule("states.js",function(exports,module,require,globals,undefined){
 /**
 * State Objects
 */
var names = ["UNINITIALIZED", "LOADING", "LOAD", "ERROR"];

for(var i = -1, len=names.length; ++i < len; ) {
  exports[names[i]] = new Object(i);
};
 
});

domloader._jsbuild_.defineModule("maps.js",function(exports,module,require,globals,undefined){
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
 
});

domloader._jsbuild_.defineModule("stylesheet.js",function(exports,module,require,globals,undefined){
 var Dependency = require("./dependency").Dependency,
    utils = require("./libs/utils"),
    maps = require('./maps');

var create = exports.create = function create(content){
  var css = new Stylesheet();
  css.src = content['src'];
  return css;
};

maps.formats.css = maps.types.stylesheet = maps.types.css = maps.types.style = create;

/**
 * Represent a CSS dependency. Doesn't support load and import events.
 */
var Stylesheet = exports.Stylesheet = function Stylesheet(){
  Dependency.prototype.constructor.call(this);
  this.src = null;
}

utils.extend( Stylesheet, Dependency );

Stylesheet.prototype.load = function(){
  var el = utils.createElement('link');
  el.setAttribute('rel','stylesheet');
  el.setAttribute('href',this.src+'?'+Number(new Date()));
  globals.document.getElementsByTagName('head')[0].appendChild( el );
  this.getEmitter('load')();
};
 
});

domloader._jsbuild_.defineModule("dependency.js",function(exports,module,require,globals,undefined){
 var cacheForce = require('./config').debug,
    extend = require('./libs/utils').extend,
    states = require("./states"),
    Observable = require("libs/observable").Observable,
    logger = require('./libs/logger');

/**
 * Generic DOM dependency class
 */
var Dependency = exports.Dependency = function Dependency(){
  Observable.prototype.constructor.call(this);
  this.cacheForce = cacheForce;
  this.callbacks.error = [];
  this.callbacks.load = [];
  this.state = states.UNINITIALIZED;

  var self = this;
  this.callbacks.error.push(function(){
    self.state = states.ERROR;
  });

  this.callbacks.load.push(function(){
    self.state = states.LOAD;
  });

  logger.info('Created new dependency instance.');
};

extend(Dependency,Observable);

Dependency.prototype.load = function(){
  throw new Error('Not Implemented');
};
 
});

domloader._jsbuild_.defineModule("ext/json/utils.js",function(exports,module,require,globals,undefined){
 var logger = require('../../../libs/logger');

var parse = exports.parse = function(source){
  logger.debug('Trying to parse "'+source.substring(0,20).replace(/\s/g,' ')+'..." to JSON');
  return this.JSON ? JSON.parse(source) : (new Function('return '+source))();
}
 
});

domloader._jsbuild_.defineModule("ext/json/jsonindex.js",function(exports,module,require,globals,undefined){
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
  
  this.callbacks.parseFile = [];

  this.callbacks.loadFile.push(partial(function(req){
    logger.info('Loaded index document at "'+this.src+'"');
    try {
      this.content = parse( req.responseText );
      this.getEmitter('parseFile')();
    } catch(excinfo){
      logging.error(excinfo);
      this.getEmitter('error')(excinfo);
    }
  },[],this));
};

extend( JSONIndex, IndexFile );
 
});

domloader._jsbuild_.defineModule("ext/xml/utils.js",function(exports,module,require,globals,undefined){
 /**
 * Execute given XPath expression on specified XML node. Works with the browsers support W3C's spec and IE+.
 */
var query = exports.query = function query(node,exp){
  var found = [];
  var node = node.ownerDocument && node.ownerDocument.documentElement || ( node.documentElement || node.firstChild || node );

  if( this.XPathEvaluator ){
    var xpe = new XPathEvaluator();
    var ns_resolver = xpe.createNSResolver(node);

    var result = xpe.evaluate(exp, node, ns_resolver, 0, null), n;
    while(n = result.iterateNext()){
      found.push(n);
    }
  } else if ("selectNodes" in node){
    node.ownerDocument.setProperty("SelectionNamespaces", "xmlns:xsl='http://www.w3.org/1999/XSL/Transform'");
    node.ownerDocument.setProperty("SelectionLanguage", "XPath");
    found = node.selectNodes(exp);
  } else {
    throw new Error("Browser doesn't support XPath evalution");
  }
   
  return found;
};

var queryNode = exports.queryNode = function queryNode(node){
  return function(expr){
    return query( node, '//*[local-name()="widget" or local-name()="application" or local-name()="index"]'+( expr||'' ) );
  }
};
 
});

domloader._jsbuild_.defineModule("ext/xml/xmlindex.js",function(exports,module,require,globals,undefined){
 var IndexFile = require('../../indexfile').IndexFile,
    maps = require('../../maps'),
    utils = require('../../libs/utils'),
    logger = require('../../libs/logger'),
    parseJSON = require('../json/utils').parse,
    queryNode = require('./utils').queryNode,
    partial = utils.partial,
    extend = utils.extend,
    dir = utils.dir,
    isRelativePath = utils.isRelativePath;

var create = exports.create = function create(content,index){
  var src = content['src'];
  index && isRelativePath(src) && ( src = index.wd + '/' + src );

  logger.debug('Creating new XMLIndex instance, filename:'+src);

  var ind = new XMLIndex();
  ind.src = src;
  ind.wd = dir(src); 
  return ind;
};

maps.formats.xml = create;

var XMLIndex = exports.XMLIndex = function(){
  IndexFile.prototype.constructor.call( this );
  
  this.callbacks.parseFile = [];

  this.callbacks.loadFile.push(partial(function(req){
    logger.info('Load the index file at "'+this.src+'"');
    try {
      var ctx = req.responseXML,
          select = queryNode(ctx),
          deps = [],
          depElements = select('/dependencies/*'),
          name = ctx.documentElement.getAttribute('name'),
          version = ctx.documentElement.getAttribute('version'),
          ns = null,
          nsElements = select('/namespace'),
          nsContent = null;
        
      if(nsElements.length){
        logger.info('Namespace definition(s) found.');
        nsContent = nsElements[0].childNodes[0].nodeValue;
        !/^\{/.test( nsContent ) && ( nsContent = "{"+nsContent+"}" );
        logger.debug('  Parsing JSON NS definition: '+nsContent);
        ns = parseJSON( nsContent );
        logger.info('  Done. Resullt:',ns)
      }

      this.content = {
        'namespace':ns,
        'dependencies':deps
      };

      name && ( this.content['name'] = name );
      version && ( this.content['version'] = version );

      for(var i = -1, len=depElements.length; ++i < len; ){
        var dp = { "type":null, "src":null },
            el = depElements[i];

        dp['type'] = el.tagName;
        dp['src'] = el.getAttribute('src');

        logger.debug('Parsing Dependency Element (:type "'+el.tagName+'" :src "'+el.getAttribute('src')+'")');

        switch(dp['type']){
          case 'object':
            dp['name'] = el.getAttribute('name');
            dp['properties'] = [];

            var properties = el.getElementsByTagName('property');
            for(var t = -1, tlen=properties.length; ++t < tlen; ){
              var el = properties[t];
              var prop = {};
              prop.name = el.getAttribute("name");
              el.getAttribute("match") && ( prop.match = new RegExp(el.getAttribute("match")) );
              dp.properties.push(prop);
            };
            break;
        }

        deps.push(dp);

      };

      this.getEmitter('parseFile')();
    } catch(excinfo) {
      logger.critical(excinfo);
      this.getEmitter('error')(excinfo);
    }
  },[],this));
  
}

extend( XMLIndex, IndexFile );
 
});


domloader._jsbuild_.getModuleByFilename("domloader.js").call();