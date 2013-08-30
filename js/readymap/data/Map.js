/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Map = function(args) {
    osgearth.Map.call(this, args);
};

ReadyMap.Map.prototype = osg.objectInehrit(osgearth.Map.prototype, {
});