/**
 * Execute given XPath expression on specified XML node. Works with the browsers support W3C's spec and IE+.
 */
var query = exports.query = function(node,exp){
  var found = [];
  var node = node.ownerDocument && node.ownerDocument.documentElement || ( node.documentElement || node.firstChild || node );

  if( globals.XPathEvaluator ){
    var xpe = new XPathEvaluator();
    var ns_resolver = xpe.createNSResolver(node);

    var result = xpe.evaluate(exp, node, ns_resolver, 0, null), n;
    while(n = result.iterateNext()){
      found.push(n);
    }
  } else if ("selectNodes" in node){
    node.ownerDocument.setProperty("SelectionNamespaces", "xmlns:xsl='http://www.w3.org/1999/XSL/Transform'");
    node.ownerDocument.setProperty("SelectionLanguage", "XPath");
    found = node.selectNodes(exp);
  } else {
    throw new Error("Browser doesn't support XPath evalution");
  }
   
  return found;
};

var queryNode = function(node){
  return function(expr){
    return query( node, '//*[local-name()="widget" or local-name()="application" or local-name()="index"]'+( expr||'' ) );
  }
};
