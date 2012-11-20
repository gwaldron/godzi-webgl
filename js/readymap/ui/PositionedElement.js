/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.PositionedElement = function(id, lon, lat, alt, options) {
  this.hAlign = "center";
  this.vAlign = "bottom";
  this.lat = lat;
  this.lon = lon;
  this.alt = alt;
  this.offset = [0,0];
  this.ecf = null;
  this._dirty = true;
  
  var defaults = {
    hAlign: "center",
    vAlign: "bottom",
  };
    offset: [0,0]
  
  var options = jQuery.extend({}, defaults, options);     
  
  this.vAlign = options.vAlign;
  this.hAlign = options.hAlign;
  
  if (options.element !== undefined) {
     this.element = options.element;
  }    
  
  this.id = id;
  this.ownsElement = this.element !== undefined;
  if (this.element === undefined) {
    this.element = jQuery("#" + id);
    //If we found an existing element we don't own it
    if (this.element) {
        this.ownsElement = false;    
    }
  } 
}

ReadyMap.PositionedElement.prototype = {  

  destroy : function() {
    if (this.ownsElement) {
      this.element.remove();
    }        
  },

  setLocation: function(lon, lat, alt) {
    if (this.lon != lon || this.lat != lat || this.alt != alt) {
      this.lon = lon;
      this.lat = lat;
      this.alt = alt;
      _dirty = true;
    }      
  },
  
  sizeChanged: function() {
      if (this.element._lastSize !== undefined ) {
	    var changed = (this.element._lastSize[0] != this.element.width() ||
		               this.element._lastSize[1] != this.element.height());
		return changed;
		
	  }
	  return true;
  },
  
  hide : function() {
    this.element.hide();
  },
  
  show : function() {
    this.element.show();
  },
  
  toggle: function(visible) {
     this.element.toggle(visible);
  },
  
  update : function(mapView) {
      if (this.ecf == null || this._dirty) {      
        var ecf = mapView.map.lla2world([this.lon, this.lat, this.alt]);
        this._dirty = false;
        this.ecf = ecf;
      }
	                    
      //Cluster cull geocentric
      if (mapView.map.geocentric) {
          viewMatrix = mapView._inverseViewMatrix;
          var eye = [];      
          osg.Matrix.getTrans(viewMatrix, eye);
                    
          var lookVector = [];
          osg.Vec3.sub( this.ecf, eye, lookVector );         

          var worldUp = [];
          osg.Vec3.copy(this.ecf, worldUp);
          osg.Vec3.normalize( worldUp, worldUp );
          var dot = osg.Vec3.dot(lookVector, worldUp);
          if (dot > 0) {
            this.element.hide();
            //this.element.offset({top:0, left:-10000});
            return;
          }                  
      }
      
      this.element.show();
           
      var window = mapView.projectObjectIntoWindow(this.ecf);      
      
      var x = (window[0] + this.offset[0]).toFixed();
      var y = (window[1] + this.offset[1]).toFixed();
     
      
      //Don't reposition this element if it hasn't changed
      if (this.lastWindow !== undefined) {
        var dx = this.lastWindow[0] - x;
        var dy = this.lastWindow[1] - y;
        if (dx == 0 && dy == 0) {
            return;
        } 
      }
      
	  var width = this.element.width();
      if (this.hAlign == "right") {
        x = x - width;
      }
      else if (this.hAlign == "center") {
        x = x - width/2.0;
      }     
      
	  var height = this.element.height();
      if (this.vAlign == "bottom") {	  
        y = y - height;
      }      
      else if (this.vAlign == "center") {
        y = y - height/2.0;
      }
	  
	  this.element._lastSize = [width, height];
      this.element.css({position: "absolute", left: x, top: y});      
      
      this.lastWindow = [x,y];                       
  }
}