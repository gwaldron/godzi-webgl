/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* Extra functionality added to osgjs
*/

//........................................................................
osg.Matrix.equals = function(a,b) {
  if (a == b) return true;
  
  if (a.length != b.length) return false;
  
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}