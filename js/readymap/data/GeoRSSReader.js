/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.GeoRSSReader = function(url, rate, updateCallback) {
    this.url = url;

    this.callbacks = new Array;
    if (updateCallback != undefined)
        this.callbacks.push(updateCallback);

    this.updateFeed();
    this.setRate(rate);
};

ReadyMap.GeoRSSReader.prototype = {
    updateFeed: function() {
        this.items = new Array;

        if (this.url != undefined) {
            var items = this.items;
            var callbacks = this.callbacks;

            $.ajax(
			{
			    url: this.url,
			    type: "GET",
			    dataType: "xml",

			    success: function(data) {
			        var selector = $(data).find('item').length > 0 ? 'item' : 'entry';
			        $(data).find(selector).each(function(i) {
			            var lat = undefined;
			            var lon = undefined;

			            var point = $(this).find('georss\\:point').text();
			            if (point == "")
			                point = $(this).find('point').text();

			            if (point != "") {
			                lat = point.split(" ")[0];
			                lon = point.split(" ")[1];
			            }
			            else {
			                lat = $(this).find('geo\\:lat').text();
			                lon = $(this).find('geo\\:long').text();

			                if (lat == "" || lon == "") {
			                    lat = $(this).find('lat').text();
			                    lon = $(this).find('long').text();
			                }
			            }

			            var description = undefined;
			            try {
			                description = $(this).find('description').get(0).innerHTML;
			            }
			            catch (e) { }

			            if (description == undefined || description == "")
			                description = $(this).find('description').text()

			            items.push({ guid: $(this).find('guid').text(),
			                title: $(this).find('title').text(),
			                author: $(this).find('author').text(),
			                pubDate: $(this).find('pubDate').text(),
			                description: description,
			                link: $(this).find('link').text(),
			                latitude: lat,
			                longitude: lon,
			                src: $(this).get()
			            });
			        });

			        for (var i in callbacks) {
			            var callback = callbacks[i];
			            callback(items);
			        }
			    },

			    error: function(jqXHR, status, error) {
			        //alert("Eror reading RSS feed: " + status);
			        for (var i in callbacks) {
			            var callback = callbacks[i];
			            callback(items);
			        }
			    }
			});
        }
    },

    setRate: function(newRate) {
        if (this.interval != undefined)
            window.clearInterval(this.interval);

        this.rate = newRate;
        if (this.rate > 0)
            this.interval = window.setInterval(function(layer) { layer.updateFeed(); }, this.rate * 1000, this);
    },

    addCallback: function(updateCallback) {
        if (updateCallback != undefined) {
            this.callbacks.push(updateCallback);
            updateCallback(this.items);
        }
    }
};