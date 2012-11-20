/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.PositionEngine = function(mapView) {
  this.mapView = mapView;  
  var me = this;
  this.mapView.addFrameEndCallback( function() {
    me.frameEnd();
  } );
  this.elements = [];
}

ReadyMap.PositionEngine.prototype = {
  addElement: function(element) {
    this.elements.push( element );
    //Add the element to the parent of the canvas
    $(this.mapView.viewer.canvas).parent().append( element.element );    
  },
  
  removeElement: function(element) {  
    var index = this.elements.indexOf( element );
    if (index >= 0) {
      element.destroy();      
      this.elements.splice( index, 1 );
    }       
  },
  
  clear: function() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].destroy();
    }
    this.elements = [];
  },
  
  hide: function() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].hide();
    }
  },
  
  show: function() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].show();
    }
  },
  
  frameEnd: function() {
  
    //Cull elements on the other side of the earth.
    var viewMatrix = this.mapView.viewer.view.getViewMatrix();
      
	var viewChanged = true;
    if (this._lastViewMatrix !== undefined) {
      viewChanged = !osg.Matrix.equals(viewMatrix, this._lastViewMatrix);
    }
	else {
	  this._lastViewMatrix = [];
	}
      
      //Save the last view matrix
	osg.Matrix.copy(viewMatrix, this._lastViewMatrix);
	this.mapView._inverseViewMatrix = osg.Matrix.inverse( viewMatrix );                        

	for (var i = 0; i < this.elements.length; i++) {
	  if (viewChanged || this.elements[i]._dirty || this.elements[i].sizeChanged()) {
		this.elements[i].update(this.mapView);
	  }
	}
  }
}