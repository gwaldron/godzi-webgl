/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.ArcGISImageLayer = function(settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.url = settings.url;
    this.extension = settings.imageType !== undefined ? settings.imageType : "jpg";
};

ReadyMap.ArcGISImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

    getURL: function(key, profile) {
        var imageURL = this.url + "/tile/" + key[2] + "/" + key[1] + "/" + key[0] + "." + this.extension;
        if (this.args !== undefined && this.args != null) {
          imageURL += "?" + this.args;
        }

        return osgearth.getURL( imageURL );		
    },

    createTexture: function(key, profile) {
        var imageURL = this.getURL(key, profile);
        return osg.Texture.create(imageURL);
    }
});