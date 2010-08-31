/**
 * An observable&cross browser wrapper of XMLHttpRequest class
 */
var Request = exports.Request = function(url){
  Observable.prototype.constructor.call( this );

  log('Initializing new HTTP request to',url);
  
  this.callbacks.load = [];
  this.callbacks.error = [];

  var req = this._req_ = typeof XMLHttpRequest != 'undefined' && new XMLHttpRequest || (function(){
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
      catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) {}
    throw new Error("This browser does not support XMLHttpRequest.");
  })();

  var loadEmitter = this.getEmitter('load');
  var errorEmitter = this.getEmitter('error');
  req.open('GET',url,true);
  req.onreadystatechange = function(){
    log( '  Request state has changed', 'url:', url, 'readyState:', req.readyState );
    req.readyState == 4 && ( req.status == 200 ? loadEmitter(req) : errorEmitter(new Error("Could not load "+url+", readystate:"+req.readyState+" status:"+req.status)) );
  };
};

extend( Request, Observable );

Request.prototype.send = function(){
  this._req_.send(null);
}
