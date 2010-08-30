/**
 * Debugging Utilities
 */
var log = exports.log = function(){
  Array.prototype.splice.call(arguments, 0,0,'DOMLoader - ');
  if( !debug || window.console == undefined || console.log == undefined )
    return;
  console.log.apply(console, arguments);
};
