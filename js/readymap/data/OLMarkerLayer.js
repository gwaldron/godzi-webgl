/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
 * Marker Layer that implements the OpenLayers MarkerLayer API
 */

ReadyMap.OpenLayers.MarkerLayer = function(mapView, settings) {

    this.positionEngine = new ReadyMap.PositionEngine(mapView);
};


ReadyMap.OpenLayers.MarkerLayer.prototype = osg.objectInehrit(osgearth.MarkerLayer.prototype, {

});