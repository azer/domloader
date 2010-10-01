var maps = domloader.require("./maps");

var test_maps_api = function(test){
  assert( maps.formats );
  assert( maps.modules );
  assert( maps.loadModules );
  assert( maps.getConstructorByFormat );
  test.callback();
} 

var test_maps_modules = function(test){
  compare( maps.modules.js.length, 1 );
  compare( maps.modules.script.length, 1 );
  compare( maps.modules.module.length, 1 );
  compare( maps.modules.css.length, 1 );
  compare( maps.modules.stylesheet.length, 1 );
  compare( maps.modules.style.length, 1 );
  compare( maps.modules.json.length, 1 );
  compare( maps.modules.xml.length, 1 );
  test.callback();
}

var test_maps_loadModules = function(test){
  delete maps.formats.js;
  domloader._jsbuild_.cache['jsfile.js'].exports = null;
  assert(!maps.formats.js);
  maps.loadModules('js');
  compare( maps.formats.js, domloader.require('./jsfile').create );
  test.callback();
}

var test_maps_getConstructorByFormat = function(test){
  delete maps.formats.css;
  domloader._jsbuild_.cache['stylesheet.js'].exports = null;
  assert(!maps.formats.css);
  compare( maps.getConstructorByFormat('foobar.css'), domloader.require('./stylesheet').create);
  test.callback();
}

var test_maps_getConstructorByType = function(test){ 
  delete maps.types.object;
  domloader._jsbuild_.cache['objectdp.js'].exports = null;
  assert(!maps.types.object);

  compare( maps.getConstructorByType('object'), domloader.require('./objectdp').create);
  test.callback();
}
