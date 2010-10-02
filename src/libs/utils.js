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
