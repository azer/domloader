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
