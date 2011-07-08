/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/


ReadyMap.WOEIDWeatherLayer = function(mapView, places, rate, proxy, iconOptions) {
    this.positionEngine = new ReadyMap.PositionEngine(mapView);
	this.places = places;
	this.rate = rate;
	this.proxy = proxy;
	
	var defaults = {
	  url: "http://google-maps-icons.googlecode.com/files/cloudsun.png",
      width: 32,
      height: 32,
      cssClass: "",
	  renderer: undefined
    };
    this.options = jQuery.extend({}, defaults, iconOptions);
	
	this.readers = [];
	this.icons = [];
	this.init();
};

ReadyMap.WOEIDWeatherLayer.prototype = {
    init: function() {
		for (var i in this.places)
		{
		    var place = this.places[i];
			var thisObj = this;
			ReadyMap.PlaceSearch.doSearch(place, function(lat, lon, swlat, swlon, nelat, nelon, data) {
			    var woeid = $(data).find('woeId').eq(0).text();
				if (woeid != undefined && woeid != '')
				  thisObj.createReader(woeid);
			});
		}
	},
	
	createReader: function(id) {
	    var url = this.proxy + 'http://weather.yahooapis.com/forecastrss?w=' + id;
		var thisObj = this;
		var renderer = this.options.renderer;
		this.readers[id] = new ReadyMap.GeoRSSReader(url, this.rate, function(items) {
		    if (renderer != undefined)
			    renderer(items[0], id);
			else
			    thisObj.createIcon(items[0], id);
		});
	},
	
	createIcon: function(item, id) {
		var active = false;
	    if (this.icons[id] != undefined)
		{
		    if (this.icons[id].popup != undefined)
			{
				this.positionEngine.removeElement(this.icons[id].popup);
				active = true;
			}
				
		    this.positionEngine.removeElement(this.icons[id]);
			this.icons[id] = undefined;
		}
		
	    var icon = new ReadyMap.Icon("icon" + id, Math.deg2rad(item.longitude), Math.deg2rad(item.latitude), 0, this.options.url, {
		  width: this.options.width,
		  height: this.options.height,
		  cssClass: this.options.cssClass,
		  title: item.title
		});
		
		icon.offset = [this.options.width / -2, this.options.height / -2];
		
		if (active)
		{
			this.createIconPopup(icon, id, item.latitude, item.longitude, item.title, item.description, item.link);
		}
		
		var thisObj = this;
		icon.element.bind("click", {url: item.link,
									title: item.title,
									engine: this.positionEngine,
									lat: item.latitude,
									lon: item.longitude,
									description: item.description,
									icon: icon,
									id: id
									}, function(e) {
			  if (e.data.icon.popup != undefined)
			  {
			    e.data.engine.removeElement(e.data.icon.popup);
				e.data.icon.popup = undefined;
			  }
			  else
			  {
				  thisObj.createIconPopup(e.data.icon, e.data.id, e.data.lat, e.data.lon, e.data.title, e.data.description, e.data.url);
			  }
			});
		
		this.icons[id] = icon;
		this.positionEngine.addElement( icon );
	},
	
	createIconPopup: function(icon, id, lat, lon, title, content, url) {
		var htmlElem = $('<div class="weather_popup_background"><div class="weather_popup"><h4 class="weather_popup">' + title + '</h4>' + content + '</div></div>');		
		jQuery("body").append(htmlElem);
		
		htmlElem[0].onselectstart = function() { return false; }
		htmlElem[0].onmousedown   = function() { return false; }
		
		htmlElem.bind("click", { icon: icon }, function(e) {
			$(e.data.icon.element).click();
		});
		
		var popup = new ReadyMap.PositionedElement("popup_" + id, Math.deg2rad(lon), Math.deg2rad(lat), 0, {element: htmlElem, vAlign: "bottom"});
		icon.popup = popup;
		this.positionEngine.addElement(popup);
	}
};
