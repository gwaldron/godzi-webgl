/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.MercatorProfile = function() {
    osgearth.Profile.call(this);
    this.name = "Mercator";
    this.extent = {
        xmin: -this.ellipsoid.absMaxMerc_m,
        ymin: -this.ellipsoid.absMaxMerc_m,
        xmax: this.ellipsoid.absMaxMerc_m,
        ymax: this.ellipsoid.absMaxMerc_m
    };
    this.baseTilesX = 2;
    this.baseTilesY = 2;
    this.isGeographic = false;

    var emin = this.toLLA([this.extent.xmin, this.extent.ymin, 0]);
    var emax = this.toLLA([this.extent.xmax, this.extent.ymax, 0]);
    this.extentLLA = {
        xmin: emin[0],
        ymin: emin[1],
        xmax: emax[0],
        ymax: emax[1]
    };
};

// this is spherical mercator, but that's ok for now
osgearth.MercatorProfile.prototype = osg.objectInehrit(osgearth.Profile.prototype, {

    getUV: function(localExtentLLA, lla) {
        var u = (lla[0] - localExtentLLA.xmin) / osgearth.Extent.width(localExtentLLA);
        var vmin = this.lat2v(Math.clamp(localExtentLLA.ymax, this.extentLLA.ymin, this.extentLLA.ymax));
        var vmax = this.lat2v(Math.clamp(localExtentLLA.ymin, this.extentLLA.ymin, this.extentLLA.ymax));
        var vlat = this.lat2v(Math.clamp(lla[1], this.extentLLA.ymin, this.extentLLA.ymax));
        var v = 1.0 - (vlat - vmin) / (vmax - vmin);
        return [u, v];
    },

    lat2v: function(lat) {
        var sinLat = Math.sin(lat);
        return 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
    },

    fromLLA: function(lla) {
        return [
            lla[0] * this.ellipsoid.radiusEquator,
            this.ellipsoid.absMaxMerc_m - this.lat2v(lla[1]) * 2 * this.ellipsoid.absMaxMerc_m,
            lla[2]];
    },

    toLLA: function(coord) {
        return [
            coord[0] / this.ellipsoid.radiusEquator,
            2 * Math.atan(Math.exp(coord[1] / this.ellipsoid.radiusEquator)) - Math.PI / 2,
            coord[2]];
    }
});
