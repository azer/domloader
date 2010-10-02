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
