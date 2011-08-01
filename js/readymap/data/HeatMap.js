/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.HeatMapNode = function(map, data) {
    osg.Node.call(this);
    this.map = map;
    this.originLLA = {
        lat: Math.deg2rad(data.origin.lat),
        lon: Math.deg2rad(data.origin.lon)
    };
    this.spacingLL = {
        lat: Math.deg2rad(data.spacing.lat),
        lon: Math.deg2rad(data.spacing.lon)
    };
    this.extentLLA = {
        xmin: Math.deg2rad(data.origin.lon),
        xmax: Math.deg2rad(data.origin.lon + data.spacing.lon * data.numCols),
        ymin: Math.deg2rad(data.origin.lat),
        ymax: Math.deg2rad(data.origin.lat + data.spacing.lat * data.numRows)
    };
    this.minHeight = 5.0;
    this.maxHeight = 2500.0;

    this.dataArray = [];
    for (var i = 0; i < data.data.length; ++i) {
        this.dataArray.push(parseFloat(data.data[i].value));
    }
    this.heightField = new osgearth.HeightField(data.numCols, data.numRows, this.dataArray);

    for (var times = 0; times < 2; times++) {
        for (var col = 1; col < data.numCols - 2; col++) {
            for (var row = 1; row < data.numRows - 2; row++) {
                var a =
                    this.heightField.getHeight(col - 1, row - 1) +
                    this.heightField.getHeight(col, row - 1) +
                    this.heightField.getHeight(col + 1, row - 1) +
                    this.heightField.getHeight(col - 1, row) +
                    this.heightField.getHeight(col, row) +
                    this.heightField.getHeight(col + 1, row) +
                    this.heightField.getHeight(col - 1, row + 1) +
                    this.heightField.getHeight(col, row + 1) +
                    this.heightField.getHeight(col + 1, row + 1);
                this.heightField.setHeight(col, row, a/8);
            }
        }
    }

    this.build();
};

ReadyMap.HeatMapNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },

    rampColor: function(v, vmin, vmax) {
        var c = [1, 1, 1];
        if (vmin === undefined)
            vmin = 0.0;
        if (vmax === undefined)
            vmax = 1.0;
        var dv = vmax - vmin;
        if (v < (vmin + 0.25 * dv)) {
            c[0] = 0;
            c[1] = 4 * (v - vmin) / dv;
        }
        else if (v < (vmin + 0.5 * dv)) {
            c[0] = 0;
            c[2] = 1 + 4 * (vmin + 0.25 * dv - v) / dv;
        }
        else if (v < (vmin + 0.75 * dv)) {
            c[0] = 4 * (v - vmin - 0.5 * dv) / dv;
            c[2] = 0;
        }
        else {
            c[1] = 1 + 4 * (vmin + 0.75 * dv - v) / dv;
            c[2] = 0;
        }
        return c;
    },

    build: function() {

        var verts = [];
        var elements = [];
        var normals = [];
        var colors = [];

        // anchor point in world coords
        var centerWorld = this.map.lla2world([this.originLLA.lon, this.originLLA.lat, 0]);

        // local-to-world transform matrix
        var local2world = this.map.threeD ?
            this.map.profile.ellipsoid.local2worldFromECEF(centerWorld) :
            osg.Matrix.makeTranslate(this.centerWorld[0], this.centerWorld[1], this.centerWorld[2]);

        // world-to-local transform matrix:
        var world2local = [];
        osg.Matrix.inverse(local2world, world2local);

        var numRows = this.heightField.getNumRows();
        var numCols = this.heightField.getNumColumns();

        // find the extremes so we can scale colors
        var minValue = 99999999.0;
        var maxValue = -minValue;
        for (var row = 0; row < numRows; row++) {
            for (var col = 0; col < numCols; col++) {
                var height = this.heightField.getHeight(col, row);
                if (height < minValue) {
                    minValue = height;
                }
                if (height > maxValue) {
                    maxValue = height;
                }
            }
        }

        var e = 0, v = 0, c = 0, vi = 0;

        for (var row = 0; row < numRows; row++) {

            var t = row / (numRows - 1);

            for (var col = 0; col < numCols; col++) {

                var s = col / (numCols - 1);

                var height = this.heightField.getHeight(col, row);
                var nheight = (height - minValue) / (maxValue - minValue);
                height = this.minHeight + nheight * (this.maxHeight - this.minHeight);
                var lla = [this.extentLLA.xmin + this.spacingLL.lon * col, this.extentLLA.ymin + this.spacingLL.lat * row, height];

                var world = this.map.lla2world(lla);
                var vert = osg.Matrix.transformVec3(world2local, world, []);
                this.insertArray(vert, verts, v);

                // todo: fix for elevation
                var normal = this.map.geocentric ? osg.Vec3.normalize(vert, []) : [0, 0, 1];
                this.insertArray(normal, normals, v);
                v += 3;

                var color = this.rampColor(nheight);
                color[3] = nheight > 0.25 ? 0.75 : nheight * 3.0;

                this.insertArray(color, colors, c);
                c += 4;

                // the elements indicies:
                if (col < numCols - 1 && row < numRows - 1) {
                    this.insertArray([vi, vi + 1, vi + 1 + numCols, vi + 1 + numCols, vi + numCols, vi], elements, e);
                    e += 6;
                }
                vi++;
            }
        }

        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normals, 3);
        this.geometry.getAttributes().Color = new osg.BufferArray(gl.ARRAY_BUFFER, colors, 4);
        var tris = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, elements, 1));
        this.geometry.getPrimitives().push(tris);

        // put it under the localization transform:
        var xform = new osg.MatrixTransform();
        xform.setMatrix(local2world);
        xform.addChild(this.geometry);
        this.addChild(xform);

        this.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    },

    traverse: function(visitor) {
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }

});


ReadyMap.HeatMapNode.prototype.objectType = osg.objectType.generate("HeatMapNode");

osg.CullVisitor.prototype[ReadyMap.HeatMapNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};
