var IndexFile = require('../../indexfile').IndexFile,
    maps = require('../../maps'),
    utils = require('../../libs/utils'),
    logger = require('../../libs/logger'),
    parseJSON = require('../json/utils').parse,
    queryNode = require('./utils').queryNode,
    partial = utils.partial,
    extend = utils.extend,
    dir = utils.dir,
    isRelativePath = utils.isRelativePath;

var create = exports.create = function create(content,index){
  var src = content['src'];

  logger.debug('Creating new XMLIndex instance, filename:'+src);

  var ind = new XMLIndex();
  ind.src = src;
  ind.wd = dir(src); 
  return ind;
};

maps.formats.xml = create;

var XMLIndex = exports.XMLIndex = function(){
  IndexFile.prototype.constructor.call( this );
}

extend( XMLIndex, IndexFile );

XMLIndex.prototype.parseFile = function(req){
  logger.debug('Trying to parse the file at "'+this.src+'" to JS objects');

  var ctx = req.responseXML,
      select = queryNode(ctx),
      deps = [],
      depElements = select('/dependencies/*'),
      name = ctx.documentElement.getAttribute('name'),
      version = ctx.documentElement.getAttribute('version'),
      ns = null,
      nsElements = select('/namespace'),
      nsContent = null;
    
  if(nsElements.length){
    logger.info('  Namespace definition(s) found.');
    nsContent = nsElements[0].childNodes[0].nodeValue;
        !/^\{/.test( nsContent ) && ( nsContent = "{"+nsContent+"}" );
    logger.debug('    Parsing JSON NS definition: '+nsContent);
    ns = parseJSON( nsContent );
    logger.info('    Done:',ns)
  }

  this.content = {
    'namespace':ns,
    'dependencies':deps
  };

  name && ( this.content['name'] = name );
  version && ( this.content['version'] = version );

  for(var i = -1, len=depElements.length; ++i < len; ){
    var dp = { "type":null, "src":null },
        el = depElements[i];

    dp['type'] = el.tagName;
    dp['src'] = el.getAttribute('src');

    logger.debug('  Parsing Dependency Element (:type "'+el.tagName+'" :src "'+el.getAttribute('src')+'")');

    switch(dp['type']){
      case 'object':
        logging.info('  Found object element, parsing its properties.');
        dp['name'] = el.getAttribute('name');
        dp['properties'] = [];

        var properties = el.getElementsByTagName('property');
        for(var t = -1, tlen=properties.length; ++t < tlen; ){
          var el = properties[t];
          var prop = {};
          prop.name = el.getAttribute("name");
          el.getAttribute("match") && ( prop.match = new RegExp(el.getAttribute("match")) );
          dp.properties.push(prop);
        };
        break;
    }

    deps.push(dp);

  };
}
