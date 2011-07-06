/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.Zoom = function(mapView, parent) {
    this.mapView = mapView;
    this._parent = parent;
    this.init();
};

ReadyMap.Controls.Zoom.prototype = {
    init: function() {
        var that = this;
        //Create the new parent element
        this._container = jQuery("<div>").addClass("readymap-control-zoom");
        var parent = "body";
        if (this._parent !== undefined) {
            parent = "#" + this._parent;
        }
        jQuery(parent).append(this._container);

        //Create the zoom-in button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-zoom-in readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousZoom = -0.01;
                         })
        );

        //Create the zoom-out button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-zoom-out readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousZoom = 0.01;
                         })
        );

        //Listen to mouseup on the body of the document to reset the continous zoom to 0
        jQuery("body").bind("mouseup", function() {
            that.mapView.viewer.getManipulator().continuousZoom = 0;
        });
    }
};