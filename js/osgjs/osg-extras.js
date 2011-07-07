/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* Extra functionality added to osgjs
*/

//........................................................................
osg.Matrix.equals = function(a,b) {
  if (a == b) return true;
  
  if (a.length != b.length) return false;
  
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

// OSG extensions ...
// eventually submit all this stuff to osgjs:

// osgjs's Quat.mult backwards?
osg.Quat.multiply = function(a, b, r) {
    if (r === undefined) {
        r = [];
    }
    return osg.Quat.mult(b, a, r);
};

osg.Quat.zeroRotation = function(q) {
    return q[0] === 0 && q[1] === 0 && q[2] === 0 && q[3] === 1;
};

osg.Quat.rotateVecOnToVec = function(from, to, r) {
    if (r === undefined) {
        r = [];
    }

    var sourceVector = osg.Vec3.copy(from, []);
    var targetVector = osg.Vec3.copy(to, []);

    var fromLen2 = osg.Vec3.length2(from);
    var fromLen = 0;
    if (fromLen2 < 1 - 1e-7 || fromLen2 > 1 + 1e-7) {
        fromLen = Math.sqrt(fromLen2);
        sourceVector = osg.Vec3.mult(sourceVector, 1.0 / fromLen, []);
    }

    var toLen2 = osg.Vec3.length2(to);
    if (toLen2 < 1 - 1e-7 || toLen2 > 1 + 1e-7) {
        var toLen = 0;
        if (toLen2 > fromLen2 - 1e-7 && toLen2 < fromLen2 + 1e-7) {
            toLen = fromLen;
        }
        else {
            toLen = Math.sqrt(toLen2);
        }
        targetVector = osg.Vec3.mult(targetVector, 1.0 / toLen, []);
    }

    var dotProdPlus1 = 1.0 + osg.Vec3.dot(sourceVector, targetVector);

    if (dotProdPlus1 < 1e-7) {
        var norm;
        if (Math.abs(sourceVector[0]) < 0.6) {
            norm = Math.sqrt(1.0 - sourceVector[0] * sourceVector[0]);
            r[0] = 0.0;
            r[1] = sourceVector[2] / norm;
            r[2] = -sourceVector[1] / norm;
            r[3] = 0.0;
        }
        else if (Math.abs(sourceVector[1]) < 0.6) {
            norm = Math.sqrt(1.0 - sourceVector[1] * sourceVector[1]);
            r[0] = -sourceVector[2] / norm;
            r[1] = 0.0;
            r[2] = sourceVector[0] / norm;
            r[3] = 0.0;
        }
        else {
            norm = Math.sqrt(1.0 - sourceVector[2] * sourceVector[2]);
            r[0] = sourceVector[1] / norm;
            r[1] = -sourceVector[0] / norm;
            r[2] = 0.0;
            r[3] = 0.0;
        }
    }

    else {
        // Find the shortest angle quaternion that transforms normalized vectors
        // into one other. Formula is still valid when vectors are colinear
        var s = Math.sqrt(0.5 * dotProdPlus1);
        var tmp = osg.Vec3.cross(sourceVector, osg.Vec3.mult(targetVector, 1.0 / (2.0 * s)), []);
        r[0] = tmp[0];
        r[1] = tmp[1];
        r[2] = tmp[2];
        r[3] = s;
    }

    return r;
};

osg.StateSet.removeUniform = function(stateSet, name) {
    delete stateSet.uniforms[name];
    var index = stateSet.uniforms.uniformKeys.indexOf(name);
    if (index !== -1) {
        delete stateSet.uniforms.uniformKeys[index];
        stateSet.uniforms.uniformKeys.splice(index, 1);
    }
};

osg.BufferArray.destroy = function(ba) {
    if (ba !== undefined && ba !== null) {
        if (ba.buffer !== undefined && ba.buffer !== null) {
            gl.deleteBuffer(ba.buffer);
        }
    }
};

osg.Geometry.destroy = function(geom) {
    if (geom !== undefined && geom !== null) {
        var i;
        for (i in geom.attributes) {
            osg.BufferArray.destroy(geom.attributes[i]);
        }
        for (i in geom.primitives) {
            var prim = geom.primitives[i];
            if (prim !== undefined && prim !== null) {
                if (prim.indices !== undefined && prim.indices !== null) {
                    osg.BufferArray.destroy(prim.indicies);
                }
            }
        }
    }
};

osg.Texture.destroy = function(tex) {
    if (tex !== undefined && tex !== null) {
        if (tex.textureObject !== null) {
            gl.deleteTexture(tex.textureObject);
            tex.textureObject = null;
            tex.image = undefined;
        }
    }
};