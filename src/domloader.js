(function( exports, globals, dom, undefined ){

  // The objects representing state of the Dependency objects
  var UNINITIALIZED = exports.UNINITIALIZED = new Object(-1),
      LOADING = exports.LOADING = new Object(0),
      READY = exports.READY = new Object(1),
      ERROR = exports.ERROR = new Object(2);
  
  var createElement = exports.createElement = function(tagName){
    return dom.documentElement.getAttribute('xmlns') && dom.createElementNS(dom.documentElement.getAttribute('xmlns'),tagName) || dom.createElement(tagName);
  }

  var dir = exports.dir = function(path){
    return path.replace(/\/[^\/]+$/,"");
  }

  var extend = exports.extend = function(subclass,superclass){
    subclass.prototype = new superclass;
    subclass.prototype.constructor = subclass;
  };
  
  var includeScript = function(url,callback,errback){
    var el = createElement('script');
    el.setAttribute('src',url);
    el.setAttribute('type','text/javascript');
    el.setAttribute('async',true);
    el.onload = el.onreadystatechange = function(){
      if( this.readyState && this.readyState!='complete' && this.readyState!='loaded') return;
      callback();
    }
    el.onerror = el.onunload = function(){
      errback(new Error('Could not load script, '+url));
    }
    dom.documentElement.firstChild.appendChild(el);
    return el;
  }

  var index = exports.index = function(list,el){
    if(list.indexOf) return list.indexOf(el);
    for(var i=-1,len=list.length; ++i<len;){
      if( list[i] == el ) return i;
    }
    return -1;
  }

  var load = exports.load = function(src,callback){
    var ind = new Index();
    ind.src = src;
    ind.wd = dir(src);
    ind.callbacks['import'].push(function(){
      ind.load();
    });
    ind.callbacks.load.push(callback);
    ind.importDocument();
    return ind;
  };

  var query = exports.query = function(node,exp){
    var found = [];
    var node = node.ownerDocument && node.ownerDocument.documentElement || ( node.documentElement || node.firstChild || node );

    if( globals.XPathEvaluator ){
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

  var remove = exports.remove = function(list,index){
    return index == -1 && list || list.slice(0,index).concat( list.slice(index+1) );
  }

  var Observable = exports.Observable = function(){
    this.callbacks = {};
  };

  Observable.prototype.getEmitter = function(eventName){
    var callbacks = this.callbacks;
    return function(){
      var args = Array.prototype.slice.call(arguments,0);
      if( !callbacks[eventName] ) throw new Error("Invalid Event Name: "+eventName);
      for(var i = -1, len=callbacks[eventName].length; ++i < len; ) {
        setTimeout((function(fn){
          return function(){
            fn.apply(null,args);
          };
        })(callbacks[eventName][i]), 10 );
      };
    };
  };

  // Generic Dependency Class
  var Dependency = exports.Dependency = function(){
    Observable.prototype.constructor.call(this);
    this.callbacks.error = [];
    this.callbacks.load = [];
    this.callbacks.ready = [];
    this.state = UNINITIALIZED;
  };

  extend(Dependency,Observable);

  Dependency.prototype.load = function(){
    throw new Error('Not Implemented');
  };
  
  // Objects of the Index class represent the indexes containing dependency information
  var Index = exports.Index = function(){
    Dependency.prototype.constructor.call(this);
    this.callbacks["import"] = [];
    this.dependencies = [];
    this.ns = null;
    this.wd = dir(location.href);
    this.src = null;
  };

  extend( Index, Dependency );

  Index.prototype.importDocument = function(){
    var req = new Request(this.src), self = this, emitter = this.getEmitter("import");
    var queryNode = function(node){
      return function(expr){
        return query( node, '//*[local-name()="widget" or local-name()="application" or local-name()="index"]'+( expr||'' ) );
      }
    };

    req.callbacks.error.push( this.getEmitter("error") );

    req.callbacks.load.push( function(){
      var doc = req._req_.responseXML, select = queryNode(doc);
      var ns = select( "/namespace" );
      if(ns.length){
        var ns = ns[0].childNodes[0].nodeValue;
        !/^\{/.test( ns ) && ( ns = "{"+ns +"}" );
        self.ns = globals.JSON ? JSON.parse(ns) : (new Function('return '+ns))();
      }
      
      var dependencies = select("/dependencies/*"), unloaded = [];
      for(var i=-1,len=dependencies.length; ++i<len;){
        var el = dependencies[i];
        var dp;

        switch(el.nodeName.toLowerCase()){
          case "script":
          case "module":
            dp = new Module();
            dp.callbacks.error.push( self.getEmitter("error") );
            dp.src = self.wd+'/'+dependencies[i].getAttribute('src');
            break;
          case "stylesheet":
            dp = new Stylesheet();
            dp.callbacks.error.push( self.getEmitter("error") );
            dp.src = self.wd+'/'+dependencies[i].getAttribute('src');
            break;
          case "object":
            dp = new ObjectDp();
            dp.callbacks.error.push( self.getEmitter("error") );
            dp.src = self.wd+'/'+dependencies[i].getAttribute('src'); 
            dp.name = dependencies[i].getAttribute('name');

            var properties = dependencies[i].getElementsByTagName('property');
            for(var t = -1, tlen=properties.length; ++t < tlen; ){
              var el = properties[t];
              var prop = {};
              prop.name = el.getAttribute("name");
              el.getAttribute("match") && ( prop.match = el.getAttribute("match") );
              dp.properties.push(prop);
            };

            break;
          case "widget":
          case "application":
          case "index":
            dp = new Index();
            dp.callbacks.error.push( self.getEmitter("error") );
            dp.callbacks["import"].push((function(el){
              return function(){
                unloaded = remove( unloaded, index(unloaded,el) );
                unloaded.length == 0 && emitter( req._req_ );
              };
            })( dp ));
            dp.src = ( self.wd && self.wd+"/" ) + dependencies[i].getAttribute("src");
            dp.wd = dir( dp.src );
            dp.importDocument();
            unloaded.push( dp );
            break;
          default:
            dp = null;
        };
        dp && self.dependencies.push(dp);
      } 

      unloaded.length == 0 && emitter(req._req_);
    });
    req.send();
  }

  Index.prototype.load = function(){
    this.state = LOADING;

    this.setNS();

    var unloaded = this.dependencies.slice(0), self = this, loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');
    for(var i = -1, len=this.dependencies.length; ++i < len; ){
      var dp = this.dependencies[i];
      dp.callbacks.load.push((function(dp){
        return function(){
          unloaded = remove( unloaded, index(unloaded, dp) );
          unloaded.length == 0 && loadEmitter();
        }
      })(dp));
      dp.callbacks.error.push(errorEmitter);
      dp.load();
    };
    unloaded.length == 0 && loadEmitter();
  };

  Index.prototype.setNS = function(){
    for(var name in this.ns){
      !( name in globals ) && ( globals[name] = this.ns[name] );
    }
    //throw new Error('not implemented');
  };

  var Module = exports.Module = function(){
    Dependency.prototype.constructor.call(this);
    this.src = null;
  }

  extend( Module, Dependency );

  Module.prototype.load = function(){
    includeScript( this.src, this.getEmitter('load'), this.getEmitter('error') );
  }

  var ObjectDp = exports.ObjectDp = function(){
    Dependency.prototype.constructor.call(this);
    this.name = null;
    this.src = null;
    this.properties = [];
  }

  extend( ObjectDp, Dependency );

  ObjectDp.prototype.load = function(){
    var loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');
    var loaded = globals[this.name];

    for(var i = -1, len=this.properties.length; ++i < len && loaded;){
      var prop = this.properties[i];
      loaded = prop.name in globals[this.name] && ( !prop.match || ( new RegExp(prop.match) ).test(globals[this.name][prop.name]) );
    };

    !loaded ? includeScript(this.src,loadEmitter,errorEmitter) : loadEmitter();
  }

  var Stylesheet = exports.Stylesheet = function(){
    Dependency.prototype.constructor.call(this);
    this.src = null;
  }

  extend( Stylesheet, Dependency );

  Stylesheet.prototype.load = function(){
    var el = createElement('link');
    el.setAttribute('rel','stylesheet');
    el.setAttribute('href',this.src);
    dom.documentElement.firstChild.appendChild( el );
    this.getEmitter('load')();
  }

  // XMLHttpRequest Wrapper which inherits from Observable class
  var Request = exports.Request = function(url){
    Observable.prototype.constructor.call( this );
    
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
      req.readyState == 4 && ( req.status == 200 ? loadEmitter(req) : errorEmitter(new Error("Could not load "+url+", readystate:"+req.readyState+" status:"+req.status)) );
    };
  };

  extend( Request, Dependency );

  Request.prototype.send = function(){
    this._req_.send(null);
  }

})( domloader = {}, this, this.document );
