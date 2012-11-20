/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * ImageLayer that uses the OpenLayers API to access image tiles.
 */

ReadyMap.OLImageLayer = function (settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.args = settings.args !== undefined ? settings.args : null;

    // source OpenLayers layer object
    this.sourceLayer = settings.sourceLayer !== undefined ? settings.sourceLayer : null;

    var that = this;
    if (this.sourceLayer !== null) {
        //Override the setOpacity function to use our setOpacity function
        this.sourceLayer.setOpacity = function (opacity) {
            if (opacity != this.opacity) {
                this.opacity = opacity;
                that.setOpacity(opacity);
            }
        };

        //Override the setVisibility function to use our setEnabled function
        this.sourceLayer.setVisibility = function (visibility) {
            if (this.visibility != visibility) {
                this.visibility = visibility;
                that.setVisible(this.visibility);
            }
        }

    }
};


ReadyMap.OLImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

    getURL: function(key, profile) {
        var ex = osgearth.TileKey.getExtent(key, profile);
        var bounds = new OpenLayers.Bounds();
        bounds.left = Math.rad2deg(ex.xmin);
        bounds.right = Math.rad2deg(ex.xmax);
        bounds.bottom = Math.rad2deg(ex.ymin);
        bounds.top = Math.rad2deg(ex.ymax);
        bounds.centerLonLat = new OpenLayers.LonLat(0.5 * (bounds.left + bounds.right), 0.5 * (bounds.bottom + bounds.top));
        
        // set the OL map's active resolution before we call getURL:
        this.sourceLayer.map.zoomTo(key[2]);
        
        // ask OL for the URL.
        return this.sourceLayer.getURL(bounds);
    },

    createTexture: function(key, profile) {
        var imageURL = this.getURL(key, profile);
        var encodedURL = osgearth.getURL(imageURL);
        if (this.sourceLayer.format !== undefined) {
            encodedURL += "&mimeType=" + this.sourceLayer.format;
        }
        return osg.Texture.createFromURL(encodedURL); //osgearth.getURL(imageURL));
    }
});
