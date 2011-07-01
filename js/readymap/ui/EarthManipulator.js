/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.EarthManipulator = function(map) {
    ReadyMap.Manipulator.call(this, map);
    this.minPitch = Math.deg2rad(-89.9);
    this.maxPitch = Math.deg2rad(-10.0);
    this.buttonup = true;
    this.centerRotation = osg.Quat.makeIdentity();
    this.lockAzimWhilePanning = true;
    this.settingVP = false;
    this.computeHomePosition();
}

ReadyMap.EarthManipulator.prototype = osg.objectInehrit(ReadyMap.Manipulator.prototype, {

    computeHomePosition: function() {
        this.setViewpoint(0, -90, 0, 0, -90, 1e7);
    },

    keydown: function(ev) {
        if (ev.keyCode === 32) {
            this.computeHomePosition();
        } else if (ev.keyCode === 33) { // pageup
            this.distanceIncrease();
            return false;
        } else if (ev.keyCode === 34) { //pagedown
            this.distanceDecrease();
            return false;
        }
        else if (ev.keyCode === 13) { // mode
            this.mode = 1 - this.mode;
            return false;
        }
    },

    mousemove: function(ev) {
        if (this.buttonup === true) {
            return;
        }
        var scaleFactor;
        var curX;
        var curY;
        var deltaX;
        var deltaY;
        var pos = this.convertEventToCanvas(ev);
        curX = pos[0];
        curY = pos[1];

        scaleFactor = 100.0;
        deltaX = (this.clientX - curX) / scaleFactor;
        deltaY = (this.clientY - curY) / scaleFactor;
        this.clientX = curX;
        this.clientY = curY;

        if (ev.shiftKey)
            this.rotateModel(-deltaX, -deltaY);
        else if (ev.ctrlKey)
            this.zoomModel(0, -deltaY);
        else
            this.panModel(-deltaX, -deltaY);

        return false;
    },

    mousewheel: function(ev, intDelta, deltaX, deltaY) {
        this.zoomModel(0, intDelta * 0.1);
    },

    dblclick: function(ev) {
    },

    touchDown: function(ev) {
    },

    touchUp: function(ev) {
    },

    touchMove: function(ev) {
    },

    getCoordFrame: function(point) {
        var l2w = this.map.profile.ellipsoid.local2worldFromECEF(point);
        var trans = osg.Matrix.getTrans(l2w);
        var x = osg.Matrix.transform3x3(l2w, [1, 0, 0]);
        var y = osg.Matrix.transform3x3(l2w, [0, 1, 0]);
        var z = osg.Matrix.transform3x3(l2w, [0, 0, 1]);
        var scale = osg.Matrix.makeScale(1.0 / osg.Vec3.length(x), 1.0 / osg.Vec3.length(y), 1.0 / osg.Vec3.length(z));
        osg.Matrix.postMult(scale, l2w);
        osg.Matrix.setTrans(l2w, trans[0], trans[1], trans[2]);
        return l2w;
    },

    normalizeAzimRad: function(azim) {
        if (Math.abs(azim) > 2 * Math.PI)
            azim = azim % (2 * Math.PI);
        while (azim < -Math.PI)
            azim += 2 * Math.PI;
        while (azim > Math.PI)
            azim -= 2 * Math.PI;
        return azim;
    },

    getSideVector: function(m) {
        return [osg.Matrix.get(m, 0, 0), osg.Matrix.get(m, 0, 1), osg.Matrix.get(m, 0, 2)];
    },

    getFrontVector: function(m) {
        return [osg.Matrix.get(m, 1, 0), osg.Matrix.get(m, 1, 1), osg.Matrix.get(m, 1, 2)];
    },

    getUpVector: function(m) {
        return [osg.Matrix.get(m, 2, 0), osg.Matrix.get(m, 2, 1), osg.Matrix.get(m, 2, 2)];
    },

    getAzimuth: function(frame) {
        return this.localAzim;

        //        var m = this.getMatrix();
        //        var frameInv = osg.Matrix.inverse(frame);
        //        osg.Matrix.postMult(frameInv, m);

        //        var look = osg.Vec3.normalize(osg.Vec3.neg(this.getUpVector(m),[]), []);
        //        var up = osg.Vec3.normalize(this.getFrontVector(m), []);

        //        var azim;
        //        if (look[2] < -0.9)
        //            azim = Math.atan2(up[0], up[1]);
        //        else if (look[2] > 0.9)
        //            azim = Math.atan2(-up[0], -up[1]);
        //        else
        //            azim = Math.atan2(look[0], look[1]);

        //        return this.normalizeAzimRad(azim);
    },

    recalcLocalPitchAndAzim: function() {
        var rot = osg.Matrix.makeRotateFromQuat(this.rotation);
        this.localPitch = Math.asin(osg.Matrix.get(rot, 1, 2));
        if (Math.abs(this.localPitch - Math.PI / 2) < 0.000001)
            this.localAzim = Math.atan2(osg.Matrix.get(rot, 0, 1), osg.Matrix.get(rot, 0, 0));
        else
            this.localAzim = Math.atan2(osg.Matrix.get(rot, 1, 0), osg.Matrix.get(rot, 1, 1));
        this.localPitch -= Math.PI / 2.0;
    },

    recalculateCenter: function(localFrame) {
        var lla = this.map.profile.ellipsoid.ecef2lla(osg.Matrix.getTrans(localFrame));
        lla[2] = 0.0;
        this.center = this.map.profile.ellipsoid.lla2ecef(lla);
    },

    panModel: function(dx, dy) {
        var scale = -0.3 * this.distance;
        var oldFrame = this.getCoordFrame(this.center);

        var oldAzim = this.getAzimuth(oldFrame);

        var rotMatrix = osg.Matrix.makeRotateFromQuat(osg.Quat.multiply(this.rotation, this.centerRotation));

        var side = this.getSideVector(rotMatrix);
        var previousUp = this.getUpVector(oldFrame);

        var forward = osg.Vec3.cross(previousUp, side, []);
        side = osg.Vec3.cross(forward, previousUp, []);

        osg.Vec3.normalize(forward, forward);
        osg.Vec3.normalize(side, side);

        var dv = osg.Vec3.add(osg.Vec3.mult(forward, (dy * scale), []), osg.Vec3.mult(side, (dx * scale), []), [])

        this.center = osg.Vec3.add(this.center, dv, []);

        var newFrame = this.getCoordFrame(this.center);

        if (this.lockAzimWhilePanning) {
            this.centerRotation = osg.Matrix.getRotate(newFrame);
        }
        else {
            var newUp = this.getUpVector(newFrame);
            var panRot = osg.Quat.rotateVecOnToVec(previousUp, newUp);
            if (!osg.Quat.zeroRotation(panRot)) {
                osg.Quat.multiply(this.centerRotation, panRot, this.centerRotation);
            }
        }

        this.recalculateCenter(newFrame);
        this.recalcLocalPitchAndAzim();
    },

    rotateModel: function(dx, dy) {

        if (dy + this.localPitch > this.maxPitch || dy + this.localPitch < this.minPitch)
            dy = 0;

        var rotMat = osg.Matrix.makeRotateFromQuat(this.rotation);

        var side = this.getSideVector(rotMat);
        var front = osg.Vec3.cross([0, 0, 1], side, []);
        side = osg.Vec3.cross(front, [0, 0, 1], []);

        osg.Vec3.normalize(front, front);
        osg.Vec3.normalize(side, side);

        this.pv = side;

        var p = osg.Quat.makeRotate(dy, side[0], side[1], side[2]);
        var a = osg.Quat.makeRotate(-dx, 0, 0, 1);

        this.rotation = osg.Quat.multiply(this.rotation, osg.Quat.multiply(p, a));

        this.recalcLocalPitchAndAzim();
    },

    zoomModel: function(dx, dy) {
        var fd = 1000;
        var scale = 1 + dy;
        if (fd * scale > this.minDistance) {
            this.setDistance(this.distance * scale);
        }
        else {
            this.setDistance(this.minDistance);
        }
    },

    getRotation: function(point) {
        var cf = this.getCoordFrame(point);
        var look = osg.Vec3.neg(this.getUpVector(cf), []);
        var worldUp = [0, 0, 1];
        var dot = Math.abs(osg.Vec3.dot(worldUp, look));
        if (Math.abs(dot - 1.0) < 0.000001)
            worldUp = [0, 1, 0];
        var side = osg.Vec3.cross(look, worldUp, []);
        var up = osg.Vec3.normalize(osg.Vec3.cross(side, look, []), []);

        var offset = 1e-6;
        return osg.Matrix.makeLookAt(osg.Vec3.sub(point, osg.Vec3.mult(look, offset, []), []), point, up);
    },

    setViewpoint: function(lat, lon, alt, heading, pitch, range, seconds) {

        var lla = [Math.deg2rad(lon), Math.deg2rad(lat), alt];

        if (seconds === undefined) {
            this.center = this.map.lla2world(lla);

            var newPitch = Math.clamp(Math.deg2rad(pitch), this.minPitch, this.maxPitch);
            var newAzim = this.normalizeAzimRad(Math.deg2rad(heading));

            this.setDistance(range);

            var localFrame = this.getCoordFrame(this.center);
            this.centerRotation = osg.Matrix.getRotate(localFrame);

            var azim_q = osg.Quat.makeRotate(newAzim, 0, 0, 1);
            var pitch_q = osg.Quat.makeRotate(-newPitch - (Math.PI / 2.0), 1, 0, 0);
            var newRot_m = osg.Matrix.makeRotateFromQuat(osg.Quat.multiply(azim_q, pitch_q));
            this.rotation = osg.Matrix.getRotate(osg.Matrix.inverse(newRot_m));

            this.localPitch = newPitch;
            this.localAzim = newAzim;

            this.recalcLocalPitchAndAzim();
            this.recalculateCenter(localFrame);
        }
        else {
            this.startViewpointTransition(lat, lon, alt, heading, pitch, range, seconds);
            this.recalculateCenter(this.getCoordFrame(this.center));
        }
    },

    frame: function() {
        if (this.settingVP) {
            this.updateSetViewpoint();
        }
    },

    getMatrix: function() {
        var m = osg.Matrix.makeTranslate(0, 0, this.distance);
        osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(this.rotation), m);
        osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(this.centerRotation), m);
        osg.Matrix.postMult(osg.Matrix.makeTranslate(this.center[0], this.center[1], this.center[2]), m);
        return m;
    },

    getInverseMatrix: function() {
        this.frame();
        var m = osg.Matrix.makeTranslate(-this.center[0], -this.center[1], -this.center[2]);
        osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(osg.Quat.inverse(this.centerRotation)), m);
        osg.Matrix.postMult(osg.Matrix.makeRotateFromQuat(osg.Quat.inverse(this.rotation)), m);
        osg.Matrix.postMult(osg.Matrix.makeTranslate(0, 0, -this.distance), m);
        return m;
    }
});