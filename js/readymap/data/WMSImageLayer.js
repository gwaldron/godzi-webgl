/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.WMSImageLayer = function(settings) {
    osgearth.ImageLayer.call(this, settings.name);
    this.url = settings.url;
    this.format = settings.format !== undefined ? settings.format : "image/jpeg";
    this.profile = settings.profile !== undefined ? settings.profile : new osgearth.GeodeticProfile();
    this.args = settings.args !== undefined ? settings.args : null;
    this.layers = settings.layers !== undefined ? settings.layers : "default";
    this.width = settings.width !== undefined ? settings.width : 256;
    this.height = settings.height !== undefined ? settings.height : 256;
    this.srs = settings.srs !== undefined ? settings.srs : "EPSG:4326";
    this.styles = settings.styles !== undefined ? settings.styles : "";
};

ReadyMap.WMSImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

    getURL: function(key, profile) {
        var size = this.profile.getTileSize(key[2]);
        var xmin = this.profile.extent.xmin + (size[0] * key[0]);
        var ymax = this.profile.extent.ymax - (size[1] * key[1]);
        var xmax = xmin + size[0];
        var ymin = ymax - size[1];

        xmin = Math.rad2deg(xmin);
        ymin = Math.rad2deg(ymin);
        xmax = Math.rad2deg(xmax);
        ymax = Math.rad2deg(ymax);

        var sep = this.url.indexOf("?") >= 0 ? "&" : "?";

        var imageURL = [
		               this.url,
					   sep,
		               "SERVICE=WMS",
					   "&VERSION=" + this.version,
					   "&REQUEST=GetMap",
					   "&LAYERS=" + this.layers,
					   "&FORMAT=" + this.format,
					   "&STYLES=" + this.styles,
					   "&SRS=" + this.srs,
					   "&WIDTH=" + this.width,
					   "&HEIGHT=" + this.height,
                       "&BBOX=" + xmin + "," + ymin + "," + xmax + "," + ymax
					   ].join("");

        if (this.args !== undefined && this.args != null) {
            imageURL += "&" + this.args;
        }

        return osgearth.getURL(imageURL);
    },

    createTexture: function(key, profile) {
        var imageURL = this.getURL(key, profile);
        return osg.Texture.create(imageURL);
    }
});