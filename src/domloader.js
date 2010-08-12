/**
 * DOMLoader
 *
 * Azer Koculu <azerkoculu@gmail.com>
 * http://azer.kodfabrik.com
 */
(function( exports, globals, dom, undefined ){

  var version = exports.version = '1.0';

  /**
   * State Objects
   */
  var UNINITIALIZED = exports.UNINITIALIZED = new Object(-1),
      LOADING = exports.LOADING = new Object(0),
      LOAD = exports.LOAD = new Object(1),
      ERROR = exports.ERROR = new Object(3);

  var FORMAT_CLS_DICT = {};
  
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
    return path.replace(/\/[^\/]+$/,"");
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
  var includeScript = function(url,callback,errback){
    var el = createElement('script');
    el.setAttribute('src',url);
    el.setAttribute('type','text/javascript');
    //el.setAttribute('async',true);
    el.onload = el.onreadystatechange = function(){
      if( this.readyState && this.readyState!='complete' && this.readyState!='loaded') return;
      callback();
    }
    el.onerror = el.onunload = function(){
      errback(new Error('Could not load script, '+url));
    }
    dom.getElementsByTagName('head')[0].appendChild(el);
    return el;
  };

  /**
   * Returns the first index at which a given element can be found in the array, or -1 if it is not present.
   */
  var index = exports.index = function(list,el){
    if(list.indexOf) return list.indexOf(el);
    for(var i=-1,len=list.length; ++i<len;){
      if( list[i] == el ) return i;
    }
    return -1;
  };

  /**
   * Shortcut to initialize, import and load index documents. 
   */
  var load = exports.load = function(src,callback,errback){
    var format = null, src_ext = null;
    if( src && ( src_ext = src.match(/\.(\w+)(?:\?[\w\=\,\.\&\%\:]+)?|(?:\#.*)?$/) ) )
      format = src_ext[1];

    if( !FORMAT_CLS_DICT.hasOwnProperty( format ) )
      throw new Error('Unsupported index format: '+format);

    var ind = new FORMAT_CLS_DICT[format];

    ind.callbacks["import"].push(function(){
      ind.setNS();
      ind.load();
    });

    ind.src = src;
    ind.wd = dir( ind.src );
    callback && ind.callbacks.load.push(callback);
    errback && ind.callbacks.error.push( errback );

    ind.importDocument();

  };

  /**
   * Execute given XPath expression on specified XML node. Works with the browsers support W3C's spec and IE+.
   */
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
    var names = nspath && nspath.split('.') || [];
    var childName = null;

    parentObject = parentObject || globals;

    while( childName = names[0] ){
      if( ! ( childName in parentObject ) ) break;
      parentObject = parentObject[ childName ];
      names.splice(0,1);
    };

    return { 'parentObject':parentObject, 'childrenNames':names };
  }; 

  /**
   * Represents observable objects which can have many subscribers in different subjects and have a property named "callbacks", storing observation subjects.
   * To emit events and solve the scope problem being encountered during observation chaining in a simple way, Observable objects also have getEmitter method 
   * returning a function calling subscribers aynchronously for specified subject.
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
   * Generic DOM dependency class
   */
  var Dependency = exports.Dependency = function(){
    Observable.prototype.constructor.call(this);
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

  extend(Dependency,Observable);
  
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
    this.wd = dir(location.href);
  };

  extend( Index, Dependency );

  Index.prototype.load = function(){
    this.state = LOADING;
    var self = this;

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
      try {
        dp.load();
      }catch(exc){
        errorEmitter(exc);
        break;
      }
    };
    unloaded.length == 0 && loadEmitter();
  };

  Index.prototype.setNS = function(){
    for(var path in this.ns){
      
      var res = resolveNSPath(path),
        parentObject = res.parentObject,
        key = null;

      while( key = res.childrenNames[0] ){

        if( res.childrenNames.length == 1 ){
          parentObject[ key ] = this.ns[ path ];
          break;
        }
        
        parentObject = parentObject[ key ] = {};
        res.childrenNames.splice(0,1);
      }
    }
  };

  /**
   * Represents JSON Indexes 
   */
  var JSONIndex = FORMAT_CLS_DICT.json = FORMAT_CLS_DICT.js = exports.JSONIndex = function(){
    Index.prototype.constructor.call(this);
    this.callbacks['import'] = [];
  }

  extend( JSONIndex, Index );

  JSONIndex.prototype.importDocument = function(){
    var req = new Request(this.src), self = this, importEmitter = this.getEmitter("import"), errEmitter = this.getEmitter('error');

    req.callbacks.error.push( this.getEmitter("error") );

    req.callbacks.load.push( function(){
      var source = req._req_.responseText;
      var doc = globals.JSON ? JSON.parse(source) : (new Function('return '+source))(); 
      var dependencies = [], unloaded = [];

      doc.hasOwnProperty('namespace') && ( self.ns = doc['namespace'] );

      if( doc.hasOwnProperty('dependencies') ){
        dependencies = doc['dependencies'];
        for(var i=-1,len=dependencies.length; ++i<len;){
          var el = dependencies[i];
          var dp;

          try {
            switch(el['type']){
              case "script":
              case "module":
                dp = new Module();
                dp.callbacks.error.push( self.getEmitter("error") );
                dp.src = self.wd+'/'+el['src'];
                break;
              case "stylesheet":
                dp = new Stylesheet();
                dp.callbacks.error.push( self.getEmitter("error") );
                dp.src = self.wd+'/'+el['src'];
                break;
              case "object":
                dp = new ObjectDp();
                dp.callbacks.error.push( self.getEmitter("error") );
                dp.src = self.wd+'/'+el['src'];
                dp.name = el['name'];
                dp.properties = [];

                if(el['properties']){
                  for(var t = -1, tlen=el['properties'].length; ++t < tlen; ){
                    var prop = el.properties[t];
                    
                    dp.properties.push({
                      'name':prop.name,
                      'match':new RegExp(prop.match)
                    });
                  };
                }

                break;
              case "widget":
              case "application":
              case "index":

                var src = ( self.wd && self.wd+"/" ) + el.src, src_ext = null;
                if( src && ( src_ext = src.match(/\.(\w+)(?:\?[\w\=\,\.\&\%\:]+)?|(?:\#.*)?$/) ) )
                  format = src_ext[1];

                if( !FORMAT_CLS_DICT.hasOwnProperty( format ) )
                  throw new Error('Unsupported index format: '+format);

                var dp = new FORMAT_CLS_DICT[format];
                dp.callbacks.error.push( self.getEmitter("error") );
                dp.callbacks["import"].push((function(el){
                  return function(){
                    unloaded = remove( unloaded, index(unloaded,el) );
                    unloaded.length == 0 && importEmitter( req._req_ );
                  };
                })( dp ));

                dp.src = src;
                dp.wd = dir( dp.src );
                dp.importDocument();
                unloaded.push( dp );
                break;
              default:
                dp = null;
            };
            dp && self.dependencies.push(dp);
          } catch(excInfo) {
            errEmitter(excInfo);
            break; 
          }
        };

      };
      unloaded.length == 0 && importEmitter(req._req_);
    });
    req.send();
  }

  /**
   * Represents a single Javascript module dependency
   */
  var Module = exports.Module = function(){
    Dependency.prototype.constructor.call(this);
    this.src = null;
  }

  extend( Module, Dependency );

  Module.prototype.load = function(){
    includeScript( this.src, this.getEmitter('load'), this.getEmitter('error') );
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

  extend( ObjectDp, Dependency );

  ObjectDp.prototype.refreshState = function(){
    var nres = resolveNSPath( this.name ), loaded = nres.childrenNames.length == 0;
    for(var i = -1, len=this.properties.length; ++i < len && loaded;){
      var prop = this.properties[i];
      loaded = nres.parentObject.hasOwnProperty(prop.name) && ( !prop.match || prop.match.test(nres.parentObject[prop.name]) );
    };

    this.state = loaded && LOAD || UNINITIALIZED; 
  }

  ObjectDp.prototype.load = function(){
    this.refreshState();
    if( this.state != LOAD ){
      var loadEmitter = this.getEmitter('load'), errorEmitter = this.getEmitter('error');
      includeScript(this.src,loadEmitter,errorEmitter);
    } else {
      loadEmitter();
    }
  }

  /**
   * Represent a CSS dependency. Doesn't support load and import events.
   */
  var Stylesheet = exports.Stylesheet = function(){
    Dependency.prototype.constructor.call(this);
    this.src = null;
  }

  extend( Stylesheet, Dependency );

  Stylesheet.prototype.load = function(){
    var el = createElement('link');
    el.setAttribute('rel','stylesheet');
    el.setAttribute('href',this.src+'?'+Number(new Date()));
    dom.getElementsByTagName('head')[0].appendChild( el );
    this.getEmitter('load')();
  };

  /**
   * Represents XML indexes
   */
  var XMLIndex = FORMAT_CLS_DICT.xml  = exports.XMLIndex = function(){
    Index.prototype.constructor.call(this);
    this.callbacks['import'] = [];
    this.src = null;
  };

  extend( XMLIndex, Index );

  XMLIndex.prototype.importDocument = function(){
    var req = new Request(this.src), self = this, importEmitter = this.getEmitter("import"), errEmitter = this.getEmitter('error');
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

        try {
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
                el.getAttribute("match") && ( prop.match = new RegExp(el.getAttribute("match")) );
                dp.properties.push(prop);
              };

              break;
            case "widget":
            case "application":
            case "index":

              var src = ( self.wd && self.wd+"/" ) + dependencies[i].getAttribute("src"), src_ext = null;
              if( src && ( src_ext = src.match(/\.(\w+)(?:\?[\w\=\,\.\&\%\:]+)?|(?:\#.*)?$/) ) )
                format = src_ext[1];

              if( !FORMAT_CLS_DICT.hasOwnProperty( format ) )
                throw new Error('Unsupported index format: '+format);

              var dp = new FORMAT_CLS_DICT[format];

              dp.callbacks.error.push( self.getEmitter("error") );
              dp.callbacks["import"].push((function(el){
                return function(){
                  unloaded = remove( unloaded, index(unloaded,el) );
                  unloaded.length == 0 && importEmitter( req._req_ );
                };
              })( dp ));

              dp.src = src;
              dp.wd = dir( dp.src );
              dp.importDocument();
              unloaded.push( dp );
              break;
            default:
              dp = null;
          };
          dp && self.dependencies.push(dp);
        } catch(excInfo) {
          errEmitter(excInfo);
          break; 
        }
      }

      unloaded.length == 0 && importEmitter(req._req_);
    });
    req.send();
  };

  /**
   * An observable&cross browser wrapper of XMLHttpRequest class
   */
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
