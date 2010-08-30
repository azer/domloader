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
