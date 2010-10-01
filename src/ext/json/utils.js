var logger = require('../../../libs/logger');

var parse = exports.parse = function(source){
  logger.debug('Trying to parse "'+source.substring(0,20).replace(/\s/g,' ')+'..." to JSON');
  return this.JSON ? JSON.parse(source) : (new Function('return '+source))();
}
