var cacheForce = require('./config').debug,
    extend = require('./libs/utils').extend,
    states = require("./states"),
    Observable = require("libs/observable").Observable,
    logger = require('./libs/logger');

/**
 * Generic DOM dependency class
 */
var Dependency = exports.Dependency = function Dependency(){
  Observable.prototype.constructor.call(this);
  this.cacheForce = cacheForce;
  this.callbacks.error = [];
  this.callbacks.load = [];
  this.state = states.UNINITIALIZED;

  var self = this;
  this.callbacks.error.push(function(){
    self.state = states.ERROR;
  });

  this.callbacks.load.push(function(){
    self.state = states.LOAD;
  });

  logger.info('Created new dependency instance.');
};

extend(Dependency,Observable);

Dependency.prototype.load = function(){
  throw new Error('Not Implemented');
};
