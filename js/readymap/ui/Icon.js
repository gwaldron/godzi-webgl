/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Icon = function(id, lon, lat, alt, url, options) {  
  ReadyMap.PositionedElement.call(this, id, lon, lat, alt);    
  this.url = url;
  this.ownsElement = true;
    
  var defaults = {
    width: 64,
    height: 64,
    cssClass: ""
  };
 
  
  var options = jQuery.extend({}, defaults, options);
  
  this.width = options.width;
  this.height = options.height;
  this.cssClass = options.cssClass;
  
  this.element = jQuery('<img id="' + this.id + '" class="' + options.cssClass + '" src="' + url +
                        '" width="' + this.width + '" height="' + this.height +
						(options.title != undefined ? '" title="' + options.title : '') + '"/>');
						
  //Disable selection
  this.element[0].onselectstart = function() { return false;} //id;
  this.element[0].onmousedown   = function() { return false;} //id;
						
  jQuery("body").append(this.element);                         
}

ReadyMap.Icon.prototype = osg.objectInehrit(ReadyMap.PositionedElement.prototype, {
 getWidth : function() {
   return this.width;
 },
 
 setWidth: function(width) {
   setSize(width, this.height);
 }, 
  
 getHeight : function() {
   return this.height;
 },
 
  setHeight: function(height) {
    setSize(this.width, height);
  },
 
 setSize: function(width, height) {
   if (this.height != height || this.width != width) {
     this.width = width;
     this.height = height;
     this.element.attr('height', this.height);
     this.element.attr('width', this.width);
   }
 }
 
 
});