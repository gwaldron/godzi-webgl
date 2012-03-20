/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.MarkerLayer = function(name) {
    this.name = name;
    this.profile = undefined;
    this.opacity = 1.0;
    this.visible = true;
    this.draw = false; // internal
};

osgearth.MarkerLayer.prototype = {

    markers: null,

    addMarker: function(marker) {
        markers.push(marker);
    },

    removeMarker: function(marker) {
        //todo
    },

    clearMarkers: function() {
        //todo
    },

    name: function() {
        return this.name;
    },

    getOpacity: function() {
        return this.opacity;
    },

    setOpacity: function(opacity) {
        if (this.opacity != opacity) {
            this.opacity = opacity;
            if (this.opacityUniform !== undefined) {
                this.opacityUniform.set([this.opacity]);
            }
        }
    },

    getVisible: function() {
        return this.visible;
    },

    setVisible: function(visible) {
        if (this.visible != visible) {
            this.visible = visible;
            if (this.visibleUniform !== undefined) {
                this.visibleUniform.set([this.visible]);
            }
        }
    }

};
