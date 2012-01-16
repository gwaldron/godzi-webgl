/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

/**
* MapView
* Installs a 3D WebGL viewer within an HTML5 canvas elements.
*/
ReadyMap.MapView = function(elementId, size, map, args) {

  this.map = map;
  this.viewer = null;
  this.endFrame = undefined;
  this.frameNum = 0;
  this.frameTimes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.frameRate = 0.0;
  this.lastTime = new Date().getTime();

  var canvas = document.getElementById(elementId);
  canvas.width = size.w;
  canvas.height = size.h;

  this.root = new osg.Node();

  //try {
  this.viewer = new osgViewer.Viewer(canvas, { alpha: false });

  //If you don't do this then the mouse manipulators listen for mouse events on the whole dom
  //so dragging other controls end up moving the canvas view.
  this.viewer.eventNode = this.viewer.canvas;

  this.viewer.init();
  if (map.geocentric)
    this.viewer.setupManipulator(new ReadyMap.EarthManipulator(map));
  else
    this.viewer.setupManipulator(new ReadyMap.MapManipulator(map));

  this.mapNode = new osgearth.MapNode(map);

  if (args !== undefined) {
    if (args.verticalScale !== undefined) {
      this.setVerticalScale(args.verticalScale);
    }
  }

  this.root.addChild(this.mapNode);

  // enable blending for transparency
  this.root.getOrCreateStateSet().setAttributeAndMode(
        new osg.BlendFunc('SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'));


  this.viewer.setScene(this.root);
  delete this.viewer.view.light;
  this.viewer.getManipulator().computeHomePosition();
  //this.viewer.run();
  this.run();
  //}
  //catch (er) {
  //osg.log("exception in osgViewer " + er);
  //}

  this.frameEnd = [];
};

ReadyMap.MapView.prototype = {

  home: function() {
    this.viewer.getManipulator().computeHomePosition();
  },

  zoom: function(delta) {
    this.viewer.getManipulator().zoomModel(0, delta);
  },

  setVerticalScale: function(value) {
    this.mapNode.setVerticalScale(value);
  },

  projectObjectIntoWindow: function(object) {
    var viewMatrix = this.viewer.view.getViewMatrix();
    var projectionMatrix = this.viewer.view.getProjectionMatrix();
    var windowMatrix = null;
    var vp = this.viewer.view.getViewport();
    if (vp !== undefined) {
      windowMatrix = vp.computeWindowMatrix();
    }

    var matrix = [];
    osg.Matrix.copy(windowMatrix, matrix);
    osg.Matrix.preMult(matrix, projectionMatrix);
    osg.Matrix.preMult(matrix, viewMatrix);

    var result = osg.Matrix.transformVec3(matrix, object);
    var height = this.viewer.canvas.height;
    result[1] = height - result[1] - 1;
    return result;
  },

  run: function() {
    var that = this;
    var render = function() {
      window.requestAnimationFrame(render, this.canvas);

      var startTime = new Date().getTime() * 0.001;

      that.viewer.frame();
      if (that.frameEnd !== undefined && that.frameEnd != null) {
        //Fire off any frame end callbacks
        for (var i = 0; i < that.frameEnd.length; i++) {
          that.frameEnd[i]();
        }
      }

      var endTime = new Date().getTime() * 0.001;
      var f0 = that.frameNum % 10;
      that.frameTimes[f0] = endTime - that.lastTime;
      var total = 0.001;
      for (var t = 0; t < 10; t++) {
        total += that.frameTimes[t];
      }
      that.frameRate = 10.0 / total;
      that.lastTime = endTime;
      that.frameNum++;

      that.map.frame();
    };

    render();
  },

  addFrameEndCallback: function(callback) {
    this.frameEnd.push(callback);
  }
};
