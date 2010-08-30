var JSONIndex = exports.JSONIndex = ctxmap.indexTypes.js = ctxmap.indexTypes.json = function(){
  IndexFile.prototype.constructor.call( this );
  this.callbacks.parseFile = [];
};

extend( JSONIndex, IndexFile );

JSONIndex.prototype.parseFile = function(req){
  var source = req.responseText;
  var doc = globals.JSON ? JSON.parse(source) : (new Function('return '+source))(); 
  this.getEmitter('parseFile')(doc);
};
