/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.GeodeticProfile = function() {
    osgearth.Profile.call(this);
    this.name = "WGS84";
    this.extent = { xmin: -Math.PI, ymin: -Math.PI / 2, xmax: Math.PI, ymax: Math.PI / 2 };
    this.baseTilesX = 2;
    this.baseTilesY = 1;
    this.isGeographic = true;
};

osgearth.GeodeticProfile.prototype = osg.objectInehrit(osgearth.Profile.prototype, {
});
