/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.ShaderFactory = {};

osgearth.ShaderFactory.createVertexShaderMain = function(functions) {
    return [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        // todo: insert functions here
        "attribute vec3 Vertex;",
        "attribute vec4 Color;",
        "attribute vec3 Normal;",
        "uniform int ArrayColorEnabled;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "uniform mat4 NormalMatrix;",
        "uniform int osgearth_LightingEnabled;",
        "varying vec4 VertexColor;",
        "void osgearth_vert_setupTexturing(void);",
        //todo: insert all function prototypes
        "",
        "void main() {",
        "    gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
        "    if (ArrayColorEnabled == 1)",
        "        VertexColor = Color;",
        "    else",
        "        VertexColor = vec4(1.0,1.0,1.0,1.0);",
        "",
        //todo: call VertexPreTexture functions here
        "    osgearth_vert_setupTexturing();",
        //todo: call VertexPreLighting functions here
        //"    if (osgearth_LightingEnabled == 1)";
        //"        osgearth_vert_setupLighting();",
        //todo: call VertexPostLighting functions here
        "}"
    ].join('\n');
};

osgearth.ShaderFactory.createFragmentShaderMain = function(functions) {
    return [
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "varying vec4 VertexColor;",
        "uniform int osgearth_LightingEnabled;",
        "void osgearth_frag_applyTexturing(inout vec4 color);",
        //todo: insert all function prototypes
        "",
        "void main(void) {",
        "    vec4 color = VertexColor;",
        //todo call FragmentPreTexture functions
        "    osgearth_frag_applyTexturing(color);",
        //todo call FragmentPreLighting functions
        //"    if (osgearth_LightingEnabled == 1)",
        //"        osgearth_frag_applyLighting(color);",
        //todo call FragmentPostLighting functions
        "    gl_FragColor = color;",
        "}"
    ].join('\n');
};

osgearth.ShaderFactory.createVertexSetupTexturing = function(imageLayers) {
    var buf = "";
    var unit;

    for (unit = 0; unit < imageLayers.length; ++unit) {
        buf += "attribute vec2 TexCoord" + unit + ";\n";
        buf += "uniform mat4 TexMat" + unit + ";\n";
        buf += "varying vec2 FragTexCoord" + unit + ";\n";
    }

    buf += "void osgearth_vert_setupTexturing(void) { \n";

    for (unit = 0; unit < imageLayers.length; unit++) {
        buf += "    FragTexCoord" + unit + " = (TexMat" + unit + " * vec4(TexCoord" + unit + ",0,1)).xy;\n";
    }
    buf += "}\n";

    return buf;
};

osgearth.ShaderFactory.createFragmentApplyTexturing = function(imageLayers) {
    var buf = "";
    var unit;

    for (unit = 0; unit < imageLayers.length; ++unit) {
        buf += "varying vec2 FragTexCoord" + unit + ";\n";
        buf += "uniform sampler2D Texture" + unit + ";\n";
        buf += "uniform bool Texture" + unit + "Visible;\n";
        buf += "uniform float Texture" + unit + "Opacity;\n";
    }

    buf += "void osgearth_frag_applyTexturing(inout vec4 color) {\n";
    buf += "    vec4 texel;\n";

    for (unit = 0; unit < imageLayers.length; ++unit) {
        buf += "    if (Texture" + unit + "Visible) { \n";
        buf += "        texel = texture2D(Texture" + unit + ", FragTexCoord" + unit + ".xy );\n";
        buf += "        color = vec4( mix( color.rgb, texel.rgb, texel.a * Texture" + unit + "Opacity), 1);\n";
        buf += "    } \n";
    }

    buf += "}\n";

    return buf;
};


