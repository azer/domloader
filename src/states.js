/**
 * State Objects
 */
var names = ["UNINITIALIZED", "LOADING", "LOAD", "ERROR"];

for(var i = -1, len=names.length; ++i < len; ) {
  exports[names[i]] = new Object(i);
};
