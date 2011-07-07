/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.ImageLayer = function(name) {
    this.name = name;
    this.profile = undefined;
    this.opacity = 1.0;
    this.visible = true;
    this.draw = false; // internal
};

osgearth.ImageLayer.prototype = {

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
