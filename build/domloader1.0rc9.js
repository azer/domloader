/**
 * DOMLoader
 * Version: 1.0rc9
 * Author: Azer Koçulu <azerkoculu@gmail.com>
 * Website: http://github.com/azer/domloader
 */ 
 (function(exports,globals,dom,undefined){
   var lib = exports.lib = (function(){
     var exports = {};
     /**
      * Create new DOM node with nodeType set to 1, in concordance with global namespace
      */
     var createElement = exports.createElement = function(tagName){
       return dom.documentElement.getAttribute('xmlns') && dom.createElementNS(dom.documentElement.getAttribute('xmlns'),tagName) || dom.createElement(tagName);
     }
     
     /**
      * Extract directory path from passed uri/url
      */
     var dir = exports.dir = function(path){
       return path.replace(/\/?[^\/]+$/,"");
     }
     
     /**
      * Provide simple inheritance by setting prototype and constructor of given subclass.
      */ 
     var extend = exports.extend = function(subclass,superclass){
       subclass.prototype = new superclass;
       subclass.prototype.constructor = subclass;
     };
     
     /**
      * Import the javascript document located in specified URL. 
      */
     var includeScript = exports.includeScript = function(url,callback,errback){
       log('Attempt to include script located at',url);
       var el = createElement('script');
       el.setAttribute('src',url);
       el.setAttribute('type','text/javascript');
       //el.setAttribute('async',true);
       el.onload = el.onreadystatechange = function(){
         if( this.readyState && this.readyState!='complete' && this.readyState!='loaded') return;
         log('Script located at',url,'is loaded');
         callback();
       }
       el.onerror = el.onunload = function(){
         log('Could not load the script located at',url);
         errback(new Error('Could not load script, '+url));
       }
       dom.getElementsByTagName('head')[0].appendChild(el);
       return el;
     };
     
     /**
      * Test whether given URI is a relative path or not
      */
     var isRelativePath = exports.isRelativePath = function(path){
       return path && !path.match(/^\w+\:\/\//) && path.substring(0,1) != '/';
     }
     
     /**
      * Returns the first index at which a given element can be found in the array, or -1 if it is not present.
      */
     var getIndex = exports.getIndex = function(list,el){
       if(list.indexOf) return list.indexOf(el);
       for(var i=-1,len=list.length; ++i<len;){
         if( list[i] == el ) return i;
       }
       return -1;
     };
     
     /**
       * Create and return a wrapper function executing given function with specified scope and arguments
       */
     var partial = exports.partial = function(fn,init_args,scope){
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
     var remove = exports.remove = function(list,index){
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
     var resolveNSPath = exports.resolveNSPath = function(nspath,parentObject){
       log('Resolving NS',nspath);
       var names = nspath && nspath.split('.') || [];
       var childName = null;
     
       parentObject = parentObject || globals;
     
       while( childName = names[0] ){
         if( ! ( childName in parentObject ) ) break;
         parentObject = parentObject[ childName ];
         names.splice(0,1);
       };
     
       log('  Resolved "',nspath,'" parentObject:',parentObject,'childrenNames',names.join(', '));
     
       return { 'parentObject':parentObject, 'childrenNames':names };
     }; 
     
     /** 
      * Observable Class - By Azer Koculu <azerkoculu@gmail.com> (MIT Licensed)
      *
      * Represents observable objects which can have many subscribers in different subjects and have a property named "callbacks", storing observation subjects.
      * To emit events and solve the scope problem being encountered during observation chaining in a simple way, Observable objects also have getEmitter method 
      * returning a function calling subscribers asynchronously for specified subject.
      */
     var Observable = exports.Observable = function(){
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
     
     /**
      * An observable&cross browser wrapper of XMLHttpRequest class
      */
     var Request = exports.Request = function(url){
       Observable.prototype.constructor.call( this );
     
       log('Initializing new HTTP request to',url);
       
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
         log( '  Request state has changed', 'url:', url, 'readyState:', req.readyState );
         req.readyState == 4 && ( req.status == 200 ? loadEmitter(req) : errorEmitter(new Error("Could not load "+url+", readystate:"+req.readyState+" status:"+req.status)) );
       };
     };
     
     extend( Request, Observable );
     
     Request.prototype.send = function(){
       this._req_.send(null);
     }
     
     return exports;
   })();
   
   var version = exports.version = "1.0rc9",
       debug = exports.debug = true;
   
   /**
    * Debugging Utilities
    */
   var log = exports.log = function(){
     Array.prototype.splice.call(arguments, 0,0,'DOMLoader - ');
     if( !debug || window.console == undefined || console.log == undefined )
       return;
     console.log.apply(console, arguments);
   };
   
   /**
    * State Objects
    */
   var UNINITIALIZED = exports.UNINITIALIZED = new Object(-1),
       LOADING = exports.LOADING = new Object(0),
       LOAD = exports.LOAD = new Object(1),
       ERROR = exports.ERROR = new Object(3);
   
   var ctxmap = exports.ctxmap = {
     'indexTypes':{},
     'dependencyTypes':{}
   };
   
   /**
    * Shortcut to initialize, import and load index documents. 
    */
   var load = exports.load = function(src,callback,errback){
     var ind = createIndexFile({ 'src':src });
   
     ind.callbacks["loadFile"].push(partial(ind.importFileContent,[],ind));
     ind.callbacks["importFileContent"].push(partial(ind.setNS,[],ind),partial(ind.load,[],ind));
   
     ind.src = src;
     ind.wd = dir( ind.src );
     callback && ind.callbacks.load.push(callback);
     errback && ind.callbacks.error.push(errback);
   
     ind.loadFile();
   
     return ind;
   };
   
   /**
    * Generic DOM dependency class
    */
   var Dependency = exports.Dependency = function(){
     lib.Observable.prototype.constructor.call(this);
     this.cacheForce = debug;
     this.callbacks.error = [];
     this.callbacks.load = [];
     this.state = UNINITIALIZED;
   
     var self = this;
     this.callbacks.error.push(function(){
       self.state = ERROR;
     });
   
     this.callbacks.load.push(function(){
       self.state = LOAD;
     });
   };
   
   lib.extend(Dependency,lib.Observable);
   
   Dependency.prototype.load = function(){
     throw new Error('Not Implemented');
   };
   
   /**
    * Represent, store and load several DOM dependencies, initialize required namespace if needed
    */
   var Index = exports.Index = function(){
     Dependency.prototype.constructor.call(this);
     this.dependencies = [];
     this.ns = null;
     this.wd = lib.dir(location.href);
   };
   
   lib.extend( Index, Dependency );
   
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
       var res = lib.resolveNSPath(path),
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
   
   lib.extend( IndexFile, Index );
   
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
   
   var createStylesheet = exports.createStylesheet = ctxmap.dependencyTypes.stylesheet = function(content){
     var css = new Stylesheet();
     css.src = content['src'];
     return css;
   }
   
   /**
    * Represent a CSS dependency. Doesn't support load and import events.
    */
   var Stylesheet = exports.Stylesheet = function(){
     Dependency.prototype.constructor.call(this);
     this.src = null;
   }
   
   lib.extend( Stylesheet, Dependency );
   
   Stylesheet.prototype.load = function(){
     var el = createElement('link');
     el.setAttribute('rel','stylesheet');
     el.setAttribute('href',this.src+'?'+Number(new Date()));
     dom.getElementsByTagName('head')[0].appendChild( el );
     this.getEmitter('load')();
   };
   
   var ext = exports.ext = (function(){
     var exports = {};
     var json = exports.json = (function(){
       var exports = {};
       
       return exports;
     })();
     
     var xml = exports.xml = (function(){
       var exports = {};
       
       return exports;
     })();
     
     return exports;
   })();
     
 })( this.domloader = {}, this, this.document );
