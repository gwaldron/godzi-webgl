/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.Pan = function(mapView, parent) {
    this.mapView = mapView;
    this._parent = parent;
    this.init();
};

ReadyMap.Controls.Pan.prototype = {
    init: function() {
        var that = this;
        //Create the new parent element
        this._container = jQuery("<div>").addClass("readymap-control-pan");
        var parent = "body";
        if (this._parent !== undefined) {
            parent = "#" + this._parent;
        }
        jQuery(parent).append(this._container);       

        //Create the pan left button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-left readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanX = 0.01;
                         })
        );

        //Create the pan right button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-right readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanX = -0.01;
                         })
        );

        //Create the pan up button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-up readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanY = -0.01;
                         })
        );

        //Create the pan down button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-pan-down readymap-control-button")
                         .bind("mousedown", function() {
                             that.mapView.viewer.getManipulator().continuousPanY = 0.01;
                         })
        );

        //Create the home button
        this._container.append(
          jQuery("<div>").addClass("readymap-control-home readymap-control-button")
                         .bind("click", function() {
                             that.mapView.home();
                         })
        );



        //Listen to mouseup on the body of the document to reset the continous pan to 0
        jQuery("body").bind("mouseup", function() {
            that.mapView.viewer.getManipulator().continuousPanX = 0;
            that.mapView.viewer.getManipulator().continuousPanY = 0;
        });
    }
};