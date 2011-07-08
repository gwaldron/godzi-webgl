/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

ReadyMap.Controls.GeoRSSList = function(element_id, mapView, classid) {
    this.id = element_id;
    this.element = $("#" + element_id);
    this.mapView = mapView;
    this.classid = classid
    this.items = undefined;
    this.init();
};

ReadyMap.Controls.GeoRSSList.prototype = {
    init: function() {
        this.element.append('...');
    },

    setItems: function(items) {
        this.items = items;
        this.renderList();
    },

    renderList: function() {
        this.element.empty();

        var mapView = this.mapView;
        var element = this.element;
        var classid = this.classid;

        $.each(this.items, function(i, value) {
            var itemDiv;
            if (classid == undefined) {
                itemDiv = $('<div style="padding: 4px;' + (i == 0 ? '' : ' border-top: 1px dotted #999;') + '">' + value.title + (value.link == undefined || value.link.length < 0 ? '' : '...<a href="' + value.link + '" target="_blank">Details</a>') + '</div>');
                $(itemDiv).hover(
		  function() {
		      $(this).css("color", "#09f");
		  },
		  function() {
		      $(this).css("color", "");
		  });
            }
            else {
                itemDiv = $('<div class="' + classid + '">' + value.title + (value.link == undefined || value.link.length < 0 ? '' : '...<a href="' + value.link + '">Details</a>') + '</div>');
            }

            $(itemDiv).click(function() {
                mapView.viewer.manipulator.setViewpoint(value.latitude, value.longitude, 0.0, 0, -90, 2000000, 1);
            });

            element.append(itemDiv);
        });
    }
};