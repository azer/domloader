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
