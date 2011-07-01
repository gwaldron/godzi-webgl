/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.GeoRSSLayer = function(mapView, url, rate, iconOptions) {
    this.mapView = mapView;
    this.url = url;

    var defaults = {
        url: "http://google-maps-icons.googlecode.com/files/redblank.png",
        width: 32,
        height: 32,
        cssClass: ""
    };
    this.options = jQuery.extend({}, defaults, iconOptions);

    this.positionEngine = new ReadyMap.PositionEngine(mapView);

    var thisObj = this;
    this.reader = new ReadyMap.GeoRSSReader(url, rate, function(items) { thisObj.createIcons(items); });
};


function showDialog(content, title) {
    //Create a new div on the fly
    return $('<div/>').html(content).dialog({
        bgiframe: true,
        resizable: false,
        modal: false,
        draggable: false,
        title: title,
        overlay: {
            backgroundColor: '#000',
            opacity: 0.5
        }
    });
}

ReadyMap.GeoRSSLayer.prototype = {
    setRate: function(newRate) {
        this.reader.setRate(newRate);
    },

    createIcons: function(items) {
        //this.positionEngine.elements = [];
        this.positionEngine.clear();

        for (var i in items) {
            var icon = new ReadyMap.Icon("icon" + i + "_" + items[i].guid, Math.deg2rad(items[i].longitude), Math.deg2rad(items[i].latitude), 0, this.options.url, {
                width: this.options.width,
                height: this.options.height,
                cssClass: this.options.cssClass,
                title: items[i].title
            });

            icon.offset = [this.options.width / -2, this.options.height * -1];
            icon.element.bind("click", { url: items[i].link,
                title: items[i].title,
                engine: this.positionEngine,
                lat: items[i].latitude,
                lon: items[i].longitude,
                description: items[i].description
            }, function(e) {
                var html = "<div><h3>" + e.data.title + "</h3>" +
  			                 "   <p> " + e.data.description + "</p>";
                if (e.data.url !== undefined && e.data.url != null) {
                    html += '<a href="' + e.data.url + '" target="_blank">Link</a>';
                }
                html += "</div>";
                var dlg = showDialog(html, e.data.title);
                dlg = dlg.parent();
                e.data.engine.addElement(new ReadyMap.PositionedElement("dlg", Math.deg2rad(e.data.lon), Math.deg2rad(e.data.lat), 0, { element: dlg, vAlign: "bottom" }));
            });
            this.positionEngine.addElement(icon);
        }
    }
};
