/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.TMSElevationLayer = function(settings) {
    osgearth.ElevationLayer.call(this, settings.name);
    this.url = settings.url;
    this.flipY = settings.tmsType !== "google";
    this.extension = "json";
    this.baseLevel = settings.baseLevel !== undefined ? settings.baseLevel : 0;
    this.args = settings.args !== undefined ? settings.args : null;
};

ReadyMap.TMSElevationLayer.prototype = osg.objectInehrit(osgearth.ElevationLayer.prototype, {

    getURL: function(key, profile) {
        var y = key[1];

        if (this.flipY) {
            var size = profile.getTileCount(key[2]);
            y = (size[1] - 1) - key[1];
        }

        var url = this.url + "/" + (key[2] + this.baseLevel) + "/" + key[0] + "/" + y + "." + this.extension;
        if (this.args !== undefined && this.args != null) {
            url += "?" + this.args;
        }

        return osgearth.getURL(url);
    },

    createHeightField: function(key, profile, loadNow) {
        var url = this.getURL(key, profile);
        return new osgearth.WebHeightField(url, loadNow);
    }
});