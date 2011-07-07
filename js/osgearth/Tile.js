/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Tile = function(key, map, parentTextures) {

    osg.Node.call(this);

    //    osg.log("Create tile: " + key);

    this.key = key;
    this.map = map;

    var extent = osgearth.TileKey.getExtentLLA(key, map.profile);

    // xforms LLA to tile [0..1]
    this.lla2local = [
        osgearth.Extent.width(extent), 0.0, 0.0, 0.0,
        0.0, osgearth.Extent.height(extent), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        extent.xmin, extent.ymin, 0.0, 1.0];

    var centerLLA = osgearth.Extent.center(extent);

    this.centerWorld = map.lla2world([centerLLA[0], centerLLA[1], 0]);

    this.centerNormal = [];
    osg.Vec3.normalize(this.centerWorld, this.centerNormal);
    this.deviation = 0.0;

    this.geometry = null;
    this.subtilesRequested = false;
    this.subtileRange = 1e7 * 1e7;
    this.textures = [];
    this.textureReady = [];
    this.numTexturesReady = 0;

    this.build(parentTextures);
};

osgearth.Tile.prototype = osg.objectInehrit(osg.Node.prototype, {

    computeBound: function(bs) {
        return this.xform.computeBound(bs);
    },

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },

    allTexturesReady: function() {
        return this.numTexturesReady === this.textures.length;
    },

    // checks to see whether all the images for this tile are available
    checkTextures: function() {
        this.numTexturesReady = 0;
        for (var i = 0; i < this.textures.length; i++) {
            if (this.textureReady[i] === true) {
                this.numTexturesReady++;
            }
            else if (this.textures[i].isImageReady()) {
                this.textureReady[i] = true;
                // in no-wait mode, remove the uniform that hides a not-yet-ready layer
                if (this.map.waitForAllLayers === false) {
                    osg.StateSet.removeUniform(this.getStateSet(), "TexMat" + i);
                    this.getStateSet().setTextureAttributeAndMode(i, this.textures[i]);
                }
                this.numTexturesReady++;
            }
        }
    },

    resetSubtiles: function() {
        // delete all the children's textures to free their memory.
        var i, n = this.children.length;
        for (i = 0; i < n; ++i) {
            this.children[i].destroy();
        }

        this.removeChildren();
        this.subtilesRequested = false;
    },

    // free memory associated with the Tile.
    // todo: check for buffer objects as well.
    destroy: function() {
        for (j = 0; j < this.textures.length; ++j) {
            osg.Texture.destroy(this.textures[j]);
        }
        osg.Geometry.destroy(this.geometry);
    },

    build: function(parentTextures) {
        var verts = [];
        var elements = [];
        var normals = [];
        var texcoords0 = [];
        var corner = [];

        var numRows = this.map.threeD ? 8 : 2;
        var numCols = this.map.threeD ? 8 : 2;

        var extentLLA = osgearth.TileKey.getExtentLLA(this.key, this.map.profile);
        var lonSpacing = osgearth.Extent.width(extentLLA) / (numCols - 1);
        var latSpacing = osgearth.Extent.height(extentLLA) / (numRows - 1);

        // localizer matrix:
        var tile2world =
            this.map.threeD ?
            this.map.profile.ellipsoid.local2worldFromECEF(this.centerWorld) :
            osg.Matrix.makeTranslate(this.centerWorld[0], this.centerWorld[1], this.centerWorld[2]);
        var world2tile = [];
        osg.Matrix.inverse(tile2world, world2tile);

        var e = 0, v = 0, tc = 0, vi = 0;

        for (var row = 0; row < numRows; row++) {
            var t = row / (numRows - 1);

            for (var col = 0; col < numCols; col++) {
                var s = col / (numCols - 1);
                var lla = [extentLLA.xmin + lonSpacing * col, extentLLA.ymin + latSpacing * row, 0.0];

                var world = this.map.lla2world(lla);
                var vert = osg.Matrix.transformVec3(world2tile, world, []);
                this.insertArray(vert, verts, v);

                // todo: fix for elevation.
                var normal =
                    this.map.geocentric ? osg.Vec3.normalize(vert, []) :
                    [0, 0, 1];

                this.insertArray(normal, normals, v);
                v += 3;

                if (col < numCols - 1 && row < numRows - 1) {
                    this.insertArray([vi, vi + 1, vi + 1 + numCols, vi + 1 + numCols, vi + numCols, vi], elements, e);
                    e += 6;
                }
                vi++;

                // simple [0..1] tex coords
                var uv = [s, t];
                if (this.map.profile.getUV !== undefined)
                    uv = this.map.profile.getUV(extentLLA, lla);

                this.insertArray([s, uv[1]], texcoords0, tc);
                tc += 2;

                if (row == 0 && col == 0)
                    corner[0] = world;
                else if (row == 0 && col == numCols - 1)
                    corner[1] = world;
                else if (row == numRows - 1 && col == 0)
                    corner[2] = world;
                else if (row == numRows - 1 && col == numCols - 1)
                    corner[3] = world;
            }
        }

        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = osg.BufferArray.create(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = osg.BufferArray.create(gl.ARRAY_BUFFER, normals, 3);
        var tris = new osg.DrawElements(gl.TRIANGLES, osg.BufferArray.create(gl.ELEMENT_ARRAY_BUFFER, elements, 1));
        this.geometry.getPrimitives().push(tris);

        // the textures:     
        var stateSet = this.getOrCreateStateSet();
        var geomStateSet = this.geometry.getOrCreateStateSet();

        // shared texture coordinate attribute:
        var sharedTexCoordAttr = osg.BufferArray.create(gl.ARRAY_BUFFER, texcoords0, 2);

        for (var i = 0, n = this.map.imageLayers.length; i < n; i++) {
            var layer = this.map.imageLayers[i];
            var newTex = layer.createTexture(this.key, this.map.profile);
            this.textures.push(newTex);
            this.textureReady.push(false);

            if (parentTextures === null || this.map.waitForAllLayers) {
                stateSet.setTextureAttributeAndMode(i, newTex);
            }
            else {
                var texMat = [
                    0.5, 0, 0, 0,
                    0.0, 0.5, 0, 0,
                    0.0, 0.0, 0.0, 0.0,
                    (this.key[0] % 2) * 0.5, (1 - this.key[1] % 2) * 0.5, 0, 0];

                var texMatU = osg.Uniform.createMatrix4(texMat, "TexMat" + i);
                stateSet.addUniform(texMatU, osg.StateAttribute.ON);
            }

            this.geometry.getAttributes()["TexCoord" + i] = sharedTexCoordAttr;
        }

        this.xform = new osg.MatrixTransform();
        this.xform.setMatrix(tile2world);
        this.xform.addChild(this.geometry);

        this.subtileRange2 = this.getBound().radius() * 3 * this.map.zoomScale;
        this.subtileRange2 *= this.subtileRange2;

        // for geocentric maps, get the tile's deviation for geocentric normal-based culling
        if (this.map.geocentric && this.key[2] > 0) {
            for (var i = 0; i < 4; i++) {
                var vec = [];
                osg.Vec3.sub(corner[i], this.centerWorld, vec);
                osg.Vec3.normalize(vec, vec);
                var dot = osg.Vec3.dot(this.centerNormal, vec);
                if (dot < this.deviation)
                    this.deviation = dot;
            }
        }
        this.deviation -= 0.2;
    },

    requestSubtiles: function() {
        for (var q = 0; q < 4; q++)
            this.addChild(new osgearth.Tile(osgearth.TileKey.child(this.key, q), this.map, this.textures));
        this.subtilesRequested = true;
    },

    traverse: function(visitor) {

        if (visitor.modelviewMatrixStack !== undefined) { // i.e., in cull visitor

            var centerToEye = [0, 0, 0];
            osg.Vec3.sub(visitor.eyePoint, this.centerWorld, centerToEye);
            osg.Vec3.normalize(centerToEye, centerToEye);

            if (this.key[2] == 0 || !this.map.geocentric || osg.Vec3.dot(centerToEye, this.centerNormal) >= this.deviation) {

                // tell the map we're drawing this tile (so it doesn't get exipred)
                this.map.markTileDrawn(this);

                var bound = this.getBound();
                var range2 = osg.Vec3.length2(osg.Vec3.sub(visitor.eyePoint, bound.center(), []));

                var traverseChildren = true;
                var numChildren = this.children.length;

                if (range2 > this.subtileRange2 || this.key[2] >= this.map.maxLevel) {
                    traverseChildren = false;
                }
                else {
                    // if this tile's content is all loaded, it's ok to start requesting subtiles.
                    if (!this.subtilesRequested && (this.key[2] == this.map.minLevel || this.allTexturesReady())) {
                        this.requestSubtiles();
                        traverseChildren = false;
                    }
                    else if (this.children.length < 4) {
                        traverseChildren = false;
                    }
                    else {
                        // in "wait for all layers" mode, don't traverse this tile's children
                        // until they have each loaded all of their textures.
                        if (this.map.waitForAllLayers) {
                            for (var i = 0; i < this.children.length; i++) {
                                var child = this.children[i];
                                if (!child.allTexturesReady()) {
                                    traverseChildren = false;
                                    child.checkTextures();
                                }
                            }
                        }

                        // in non-waiting mode, traverse the children as long as each one
                        // has loaded it's base layer (layer 0).
                        else {
                            for (var i = 0; i < this.children.length; i++) {
                                var child = this.children[i];
                                if (!child.textureReady[0])
                                    traverseChildren = false;
                                if (!child.allTexturesReady())
                                    child.checkTextures();
                            }
                        }
                    }
                }

                if (traverseChildren) {
                    for (var i = 0; i < numChildren; i++) {
                        this.children[i].accept(visitor);
                    }
                }
                else {
                    this.xform.accept(visitor);
                }
            }
        }
    }

});

osgearth.Tile.prototype.objectType = osg.objectType.generate("Tile");

osg.CullVisitor.prototype[osgearth.Tile.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};

