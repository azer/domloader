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

extend( Stylesheet, Dependency );

Stylesheet.prototype.load = function(){
  var el = createElement('link');
  el.setAttribute('rel','stylesheet');
  el.setAttribute('href',this.src+'?'+Number(new Date()));
  dom.getElementsByTagName('head')[0].appendChild( el );
  this.getEmitter('load')();
};
