/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.VirtualProgram = function() {
    osg.Program.call(this);

    this.virtualProgramMarker = true;

    // shaders, keyed by a "sematic" string: name + gl shader type
    this.shaderMap = {};

    // key is FunctionLocation; value is array of sematics
    this.funcSemanticsByLocation = {};

    // object, each key is a FunctionLocation, each value is an array of shader sematics
    this.accumulatedFuncSemanticsByLocation = {};

    // cached programs, key = accumalted attribute semantic string
    this.programCache = {};

    this.vertex = {};
    this.fragment = {};

    this._dirty = true;

    // install the base shaders
    this.refreshMains();
};

osgearth.VirtualProgram.prototype = osg.objectInehrit(osg.Program.prototype, {

    isVirtualProgram: function(obj) {
        return true;
    },

    cloneType: function() {
        return new osgearth.VirtualProgram();
    },

    setShader: function(name, type, shaderSource) {
        this.shaderMap[name + ";" + type] = shaderSource;
        this._dirty = true;
    },

    // injects a GLSL function at the specified location
    setFunction: function(name, source, location, priority) {
        if (this.semanticsByLocation[location] === undefined)
            this.semanticsByLocation[location] = [];
        var type = (location <= 2) ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
        var semantic = name + ';' + type;
        this.setShader(semantic, source);
        this.funcSemanticsByLocation[location].push(semantic); //todo: insert sorted by priority
        this._dirty = true;
    },

    // rebuilds the main shader functions.
    refreshMains: function() {
        this.setShader(
            "osgearth_vert_main",
            gl.VERTEX_SHADER,
            osgearth.ShaderFactory.createVertexShaderMain(this.accumulatedFunctions));

        this.setShader(
            "osgearth_frag_main",
            gl.FRAGMENT_SHADER,
            osgearth.ShaderFactory.createFragmentShaderMain(this.accumulatedFunctions));
    },

    apply: function(state) {
        // pull the stack of "Program" attributes
        var attributeStack = state.attributeMap[this.attributeType];
        if (attributeStack === undefined) {
            return;
        }

        // constructs a string that uniquely identifies this accumulated shader program.
        // it is a concatenation of all shader semantics in the current attribute stack.
        var accumulatedSemantic = "";

        for (var i = 0; i < attributeStack.length; ++i) {
            var p = attributeStack[i];
            if (this.isVirtualProgram(p)) {
                for (var semantic in p.shaderMap) {
                    accumulatedSemantic += semantic;
                }
            }
        }

        // add this VP's shaders to the identifier:
        for (var semantic in this.shaderMap) {
            accumulatedSemantic += semantic;
        }

        // see if our gl program is already in the cache:
        this.program = this.programCache[accumulatedSemantic];

        // if not, build and compile it
        if (this.program === undefined) {

            // check for new user functions
            this.refreshAccumulatedFunctions(state);

            // rebuild the shaders
            this.refreshMains();

            // rebulid the shader list:
            var vertShaderSource = "";
            var fragShaderSource = "";

            for (var semantic in this.shaderMap) {
                var type = parseInt(semantic.split(';')[1]);
                if (type === gl.VERTEX_SHADER) {
                    vertShaderSource += this.shaderMap[semantic] + '\n';
                }
                else { // if ( semantic.type === gl.FRAGMENT_SHADER )
                    fragShaderSource += this.shaderMap[semantic] + '\n';
                }
            }

            this.vertex = new osg.Shader(gl.VERTEX_SHADER, vertShaderSource);
            this.vertex.compile();

            this.fragment = new osg.Shader(gl.FRAGMENT_SHADER, fragShaderSource);
            this.fragment.compile();

            this.program = gl.createProgram();

            gl.attachShader(this.program, this.vertex.shader);
            gl.attachShader(this.program, this.fragment.shader);
            gl.linkProgram(this.program);
            gl.validateProgram(this.program);

            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                osg.log("can't link program\n" + "vertex shader:\n" + this.vertex.text + "\n fragment shader:\n" + this.fragment.text);
                osg.log(gl.getProgramInfoLog(this.program));
                debugger;
            }

            this.uniformsCache = {};
            this.uniformsCache.uniformKeys = [];
            this.attributesCache = {};
            this.attributesCache.attributeKeys = [];

            this.cacheUniformList(this.vertex.text);
            this.cacheUniformList(this.fragment.text);
            //osg.log(this.uniformsCache);

            this.cacheAttributeList(this.vertex.text);

            // cache this gl program.
            this.programCache[accumulatedSemantic] = this.program;

            osg.log(vertShaderSource);
            osg.log(fragShaderSource);
        }

        gl.useProgram(this.program);
    },

    refreshAccumulatedFunctions: function(state) {
        // stack of all VirtualProgram attributes:
        var attributeStack = state.attributeMap[this.attributeType];
        if (attributeStack === undefined || attributeStack.length == 0) {
            return;
        }

        // accumulate all the user functions from all the VPs into a single list:
        this.accumulatedFunctions = {};

        for (var i = 0; i < attributeStack.length; ++i) {
            var vp = attributeStack[i];
            if (this.isVirtualProgram(vp)) {
                for (var location in vp.funcSemanticsByLocation) {
                    if (this.accumulatedFuncSemanticsByLocation[location] === undefined)
                        this.accumulatedFuncSemanticsByLocation[location] = {};

                    var semantics = vp.funcSemanticsByLocation[location];
                    for (var j = 0; j < semantics.length; ++j) {
                        var semantic = semantics[j].split(';')[0];
                        this.accumulatedFuncSemanticsByLocation[location][semantic] = semantic;
                    }
                }
            }
        }
    }
});
