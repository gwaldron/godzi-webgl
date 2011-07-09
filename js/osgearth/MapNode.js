/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.MapNode = function(map) {

    osg.Node.call(this);

    this.map = map;
    this.verticalScale = 1.0;

    var rootSize = map.profile.getTileCount(map.minLevel);
    for (var x = 0; x < rootSize[0]; x++) {
        for (var y = 0; y < rootSize[1]; y++) {
            this.addChild(new osgearth.Tile([x, y, map.minLevel], map, null));
        }
    }

    var stateSet = this.getOrCreateStateSet();

    // set up our custom GLSL program
    var vp = new osgearth.VirtualProgram();

    vp.setShader(
        "osgearth_vert_setupTexturing",
        gl.VERTEX_SHADER,
        osgearth.ShaderFactory.createVertexSetupTexturing(map.imageLayers));

    vp.setShader(
        "osgearth_frag_applyTexturing",
        gl.FRAGMENT_SHADER,
        osgearth.ShaderFactory.createFragmentApplyTexturing(map.imageLayers));


    stateSet.setAttributeAndMode(vp, osg.StateAttribute.ON);

    stateSet.setAttributeAndMode(new osg.CullFace('DISABLE'));

    for (var i = 0; i < map.imageLayers.length; i++) {

        var visible = map.imageLayers[i].getVisible() ? true : false;
        var visibleUniform = osg.Uniform.createInt1(visible, "Texture" + i + "Visible");
        stateSet.addUniform(visibleUniform, osg.StateAttribute.ON);
        map.imageLayers[i].visibleUniform = visibleUniform;

        var opacity = map.imageLayers[i].getOpacity();
        var opacityUniform = osg.Uniform.createFloat1(opacity, "Texture" + i + "Opacity");
        map.imageLayers[i].opacityUniform = opacityUniform;
        stateSet.addUniform(opacityUniform, osg.StateAttribute.ON);

        var texMatUniform = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]), "TexMat" + i);
        stateSet.addUniform(texMatUniform, osg.StateAttribute.ON);

        stateSet.addUniform(osg.Uniform.createInt1(i, "Texture" + i));
    }

    this.verticalScaleUniform = osg.Uniform.createFloat1(this.map.verticalScale, "VerticalScale");
    stateSet.addUniform(this.verticalScaleUniform, osg.StateAttribute.ON);
};

osgearth.MapNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    setVerticalScale: function(value) {
        this.verticalScaleUniform.set([value]);
    },

    traverse: function(visitor) {
        if (visitor.modelviewMatrixStack !== undefined) { // i.e., in cull visitor
            var lastViewMatrix = visitor.modelviewMatrixStack[visitor.modelviewMatrixStack.length - 1];
            var mvmInv = [];
            osg.Matrix.inverse(lastViewMatrix, mvmInv);
            if (visitor.eyePoint === undefined)
                visitor.eyePoint = [];
            osg.Matrix.getTrans(mvmInv, visitor.eyePoint);
        }
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }
});

osgearth.MapNode.prototype.objectType = osg.objectType.generate("MapNode");

osg.CullVisitor.prototype[osgearth.MapNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);
    this.traverse(node);
    if (node.stateset)
        this.popStateSet();
};
