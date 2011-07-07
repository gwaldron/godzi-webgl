/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Extent = {
    width: function(extent) {
        return extent.xmax - extent.xmin;
    },
    height: function(extent) {
        return extent.ymax - extent.ymin;
    },
    center: function(extent) {
        return [(extent.xmin + extent.xmax) / 2, (extent.ymin + extent.ymax) / 2];
    },
    clamp: function(extent, vec2) {
        vec2[0] = Math.clamp(vec2[0], extent.xmin, extent.xmax);
        vec2[1] = Math.clamp(vec2[1], extent.ymin, extent.ymax);
    }
};
