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
