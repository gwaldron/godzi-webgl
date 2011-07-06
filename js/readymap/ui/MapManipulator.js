/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.MapManipulator = function(map) {
    ReadyMap.Manipulator.call(this, map);
    this.computeHomePosition();
};

ReadyMap.MapManipulator.prototype = osg.objectInehrit(ReadyMap.Manipulator.prototype, {

    computeHomePosition: function() {
        this.center = [0, 0, 0];
        this.distance = osgearth.Extent.width(this.map.profile.extent) / 2;
        this.maxDistance = this.distance * 1.5;
    },

    setViewpoint: function(lat, lon, alt, heading, pitch, range, seconds) {
        if (seconds === undefined || seconds == 0) {
            var lla = [Math.deg2rad(lon), Math.deg2rad(lat), alt];
            this.center = this.map.lla2world(lla);
            this.setDistance(range);
        }
        else {
            this.startViewpointTransition(lat, lon, alt, heading, pitch, range, seconds);
        }
    },

    panModel: function(dx, dy) {
        var scale = -0.3 * this.distance;
        this.center = osg.Vec3.add(this.center, [dx * scale, dy * scale, 0], []);
        osgearth.Extent.clamp(this.map.profile.extent, this.center);
    },

    zoomModel: function(dx, dy) {
        var fd = 1000;
        var scale = 1 + dy;
        if (fd * scale > this.minDistance)
            this.setDistance(this.distance * scale);
        else
            this.setDistance(this.minDistance);
    },

    frame: function() {
        if (this.settingVP) {
            this.updateSetViewpoint();
        }

        if (this.continuousZoom != 0) {
            this.zoomModel(0, this.continuousZoom);
        }

        if (this.continuousPanX != 0 || this.continuousPanY != 0) {
            this.panModel(this.continuousPanX, this.continuousPanY);
        }
    },

    getInverseMatrix: function() {
        this.frame();
        var eye = [];
        osg.Vec3.copy(this.center, eye);
        eye[2] = this.distance;
        var m = osg.Matrix.makeLookAt(eye, this.center, [0, 1, 0]);
        return m;
    },

    mousemove: function(ev) {
        if (this.buttonup === true)
            return;

        var pos = this.convertEventToCanvas(ev);
        var curX = pos[0];
        var curY = pos[1];

        var scaleFactor = 100.0;
        var deltaX = (this.clientX - curX) / scaleFactor;
        var deltaY = (this.clientY - curY) / scaleFactor;
        this.clientX = curX;
        this.clientY = curY;

        this.panModel(-deltaX, -deltaY);
        return false;
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        this.zoomModel(0, intDelta * 0.1);
    }
});