/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * ImageLayer that uses the Leaflet API to access image tiles.
 */

ReadyMap.LeafletImageLayer = function(settings) {
  osgearth.ImageLayer.call(this, settings.name);
  this.args = settings.args !== undefined ? settings.args : null;
  
  // source Leaflet layer object
  this.sourceLayer = settings.sourceLayer !== undefined ? settings.sourceLayer : null;
};


ReadyMap.LeafletImageLayer.prototype = osg.objectInehrit(osgearth.ImageLayer.prototype, {

  getURL: function(key, profile) {
    var y = key[1];
    if (this.sourceLayer.options.scheme === 'tms') {
      var size = profile.getTileCount(key[2]);
      y = (size[1] - 1) - key[1];
    }
    return this.sourceLayer.getTileUrl({ x: key[0], y: y }, key[2]);
  },

  createTexture: function(key, profile) {
    var imageURL = this.getURL(key, profile);
    var encodedURL = osgearth.getURL(imageURL);
    if (this.sourceLayer.format !== undefined) {
      encodedURL += "&mimeType=" + this.sourceLayer.format;
    }
    return osg.Texture.createFromURL(encodedURL);
  }
});