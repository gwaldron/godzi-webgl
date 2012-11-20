/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Label = function(id, lon, lat, alt, text, options) {  
  ReadyMap.PositionedElement.call(this, id, lon, lat, alt);    
  this.text = text;
  this.ownsElement = true;
    
  var defaults = {
    cssClass: ""
  };
 
  
  var options = jQuery.extend({}, defaults, options);
  
  this.cssClass = options.cssClass;
  
  this.element = jQuery('<div id="' + this.id + '" class="' + options.cssClass + '">' + this.text + '</div>');
  //Disable selection
  this.element[0].onselectstart = function() { return false;} //id;
  this.element[0].onmousedown   = function() { return false;} //id;

  //jQuery("body").append(this.element);                         
}

ReadyMap.Label.prototype = osg.objectInehrit(ReadyMap.PositionedElement.prototype, {
 
});
