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
    bounds.left = ex.xmin;
    bounds.right = ex.xmax;
    bounds.bottom = ex.ymin;
    bounds.top = ex.ymax;
    return this.sourceLayer.getURL(bounds);
  },

  createTexture: function(key, profile) {
    var imageURL = this.getURL(key, profile);
    return osg.Texture.createFromURL(imageURL);
  }
});