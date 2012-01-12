/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * ImageLayer that uses the OpenLayers API to access image tiles.
 */

ReadyMap.OLImageLayer = function(settings) {
  osgearth.ImageLayer.call(this, settings.name);
  this.args = settings.args !== undefined ? settings.args : null;
  
  // source OpenLayers layer object
  this.sourceLayer = settings.sourceLayer !== undefined ? settings.sourceLayer : null;
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
    return this.sourceLayer.getURL(bounds);
  },

  createTexture: function(key, profile) {
    var imageURL = this.getURL(key, profile);
    return osg.Texture.createFromURL(osgearth.getURL(imageURL));
  }
});