/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/



ReadyMap.Manipulator = function(map) {
    this.map = map;
    this.center = [0, 0, 0];
    this.minDistance = 0.001;
    this.maxDistance = 1e10;
    this.buttonup = true;
    this.rotation = osg.Quat.makeIdentity([]);
    this.localAzim = 0;
    this.localPitch = Math.deg2rad(-90);
    this.settingVP = false;
    this.continuousZoom = 0;
    this.continuousPanX = 0;
    this.continuousPanY = 0;
    this.touchSensitivity = 0.1;
    this.touchStartDistance = 0;
    this.touchStartVec = [0, 0];
};

ReadyMap.Manipulator.prototype = {

    init: function() {
    },

    reset: function() {
        this.init();
    },

    setNode: function(node) {
        this.node = node;
    },

    mouseup: function(ev) {
        this.dragging = false;
        this.panning = false;
        this.releaseButton(ev);
    },

    mousedown: function(ev) {
        this.panning = true;
        this.dragging = true;
        var pos = this.convertEventToCanvas(ev);
        this.clientX = pos[0];
        this.clientY = pos[1];
        this.pushButton(ev);
    },

    touchStart: function(ev) {
      if (!ev.touches)
        return;

      if (ev.touches.length == 1)
        this.mousedown(ev);
      else if (ev.touches.length == 2) {
        var p1 = [ev.touches[0].clientX, ev.touches[0].clientY];
        var p2 = [ev.touches[1].clientX, ev.touches[1].clientY];

        var diff = osg.Vec2.sub(p2, p1, []);
        this.touchStartDistance = osg.Vec2.length(diff);
        this.touchStartVec = osg.Vec2.normalize(diff, []);
      }

    },

    touchEnd: function(ev) {
      //if (ev.touches && ev.touches.length == 1)
      this.mouseup(ev);
    },

    touchMove: function(ev) {
    },

    pushButton: function() {
        this.dx = this.dy = 0;
        this.buttonup = false;
    },

    releaseButton: function() {
        this.buttonup = true;
    },

    setDistance: function(d) {
        this.distance = d;
        if (this.distance < this.minDistance)
            this.distance = this.minDistance;
        else if (this.distance > this.maxDistance)
            this.distance = this.maxDistance;
    },

    getViewpoint: function() {
        var vp = {};
        vp.center = osg.Vec3.copy(this.center, []);
        vp.heading = Math.rad2deg(this.localAzim);
        vp.pitch = Math.rad2deg(this.localPitch);
        vp.range = this.distance;
        return vp;
    },

    startViewpointTransition: function(lat, lon, alt, heading, pitch, range, seconds) {

        var newCenter = this.map.lla2world([Math.deg2rad(lon), Math.deg2rad(lat), alt]);

        this.startVP = this.getViewpoint();
        this.deltaHeading = heading - this.startVP.heading;
        this.deltaPitch = pitch - this.startVP.pitch;
        this.deltaRange = range - this.startVP.range;
        this.deltaCenter = osg.Vec3.sub(newCenter, this.startVP.center, []);

        while (this.deltaHeading > 180) this.deltaHeading -= 360;
        while (this.deltaHeading < -180) this.deltaHeading += 360;

        var h0 = this.startVP.range * Math.sin(Math.deg2rad(-this.startVP.pitch));
        var h1 = range * Math.sin(Math.deg2rad(-pitch));
        var dh = h1 - h0;

        var de;
        if (this.map.geocentric) {
            var startFP = this.startVP.center;
            var xyz0 = [this.startVP.center[0], this.startVP.center[1], 0];
            var xyz1 = this.map.lla2world([Math.deg2rad(lon), Math.deg2rad(lat), 0]);
            de = osg.Vec3.length(osg.Vec3.sub(xyz0, xyz1, []));
        }
        else {
            de = osg.Vec3.length(this.deltaCenter);
        }

        this.arcHeight = Math.max(de - Math.abs(dh), 0);
        if (this.arcHeight > 0) {
            var h_apex = 2 * (h0 + h1) + this.arcHeight;
            var dh2_up = Math.abs(h_apex - h0) / 100000.0;
            this.setVPaccel = Math.log10(dh2_up);
            var dh2_down = Math.abs(h_apex - h1) / 100000.0;
            this.setVPaccel2 = -Math.log10(dh2_down);
        }
        else {
            var dh2 = (h1 - h0) / 100000.0;
            this.setVPaccel = Math.abs(dh2) <= 1.0 ? 0.0 : dh2 > 0.0 ? Math.log10(dh2) : -Math.log10(-dh2);
            if (Math.abs(this.setVPaccel) < 1.0)
                this.setVPaccel = 0.0;
        }

        this.setVPstartTime_ms = new Date().getTime();

        //TODO: auto viewpoint duration code (from osgEarth)
        // auto time:
        if (this.map.geocentric) {
            var maxDistance = this.map.profile.ellipsoid.radiusEquator;
            var ratio = Math.clamp(de / maxDistance, 0, 1);
            ratio = Math.accelerationInterp(ratio, -4.5);
            var minDur = 2.0;
            var maxDur = Math.max(seconds, minDur);
            this.setVPduration_ms = (minDur + ratio * (maxDur - minDur)) * 1000.0;
        }
        else {
            this.setVPduration_ms = seconds * 1000.0;
        }

        this.settingVP = true;
    },

    updateSetViewpoint: function() {
        var now = new Date().getTime();
        var t = (now - this.setVPstartTime_ms) / this.setVPduration_ms;
        var tp = t;

        if (t >= 1.0) {
            t = 1.0;
            tp = 1.0;
            this.settingVP = false;
        }
        else if (this.arcHeight > 0.0) {
            if (tp <= 0.5) {
                var t2 = 2.0 * tp;
                t2 = Math.accelerationInterp(t2, this.setVPaccel);
                tp = 0.5 * t2;
            }
            else {
                var t2 = 2.0 * (tp - 0.5);
                t2 = Math.accelerationInterp(t2, this.setVPaccel2);
                tp = 0.5 + (0.5 * t2);
            }
            tp = Math.smoothStepInterp(tp);
            //tp = Math.smoothStepInterp( tp );
        }
        else if (t > 0.0) {
            tp = Math.accelerationInterp(tp, this.setVPaccel);
            tp = Math.smoothStepInterp(tp);
        }

        var lla = this.map.world2lla(osg.Vec3.add(this.startVP.center, osg.Vec3.mult(this.deltaCenter, tp, []), []));

        this.setViewpoint(
            Math.rad2deg(lla[1]),
            Math.rad2deg(lla[0]),
            lla[2],
            this.startVP.heading + this.deltaHeading * tp,
            this.startVP.pitch + this.deltaPitch * tp,
            this.startVP.range + this.deltaRange * tp + (Math.sin(Math.PI * tp) * this.arcHeight));
    }
};
