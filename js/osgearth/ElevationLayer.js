/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.ElevationLayer = function(name) {
    this.name = name;
    this.profile = undefined;    
};

osgearth.ElevationLayer.prototype = {
    name: function() {
        return this.name;
    }    
};
