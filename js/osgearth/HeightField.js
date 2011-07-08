/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.HeightField = function(numColumns, numRows, data) {
    this._numColumns = numColumns;
    this._numRows = numRows;

    //Allocate data for the underlying heights if none was provides
    if (data === undefined) {
        data = new Array(numColumns * numRows);
    }
    this._data = data;
};

osgearth.HeightField.prototype = {
    getNumColumns: function() {
        return this._numColumns;
    },

    getNumRows: function() {
        return this._numRows;
    },

    getHeight: function(c, r) {
        var index = c + r * this._numColumns;
        if (index < 0 || index >= this._data.length) throw "Index out of bounds";
        return this._data[index];
    },

    setHeight: function(c, r, height) {
        var index = c + r * this._numColumns;
        if (index < 0 || index >= this._data.length) throw "Index out of bounds";
        this._data[index] = height;
    }
};

osgearth.WebHeightField = function(url, loadNow) {
    this.url = url;
    this.complete = false;
    this.loadNow = loadNow === undefined ? false : loadNow;
    this.refresh();
}

osgearth.WebHeightField.prototype = osg.objectInehrit(osgearth.HeightField.prototype, {
    refresh: function() {
        //Mark the HeightField as not complete
        this.complete = false;

        var that = this;
        //Request the heightfield from the URL
        jQuery.ajax({
            url: this.url,
            dataType: "json",
            async: !this.loadNow,
            success: function(data) {
                that._numColumns = data.width;
                that._numRows = data.height;
                that._data = data.data;
                that.complete = true;
            },
            error: function() {
                /*
                that._numColumns = 8;
                that._numRows = 8;
                var data = [];
                for (var i = 0; i < that._numColumns * that._numRows; i++) {
                    data[i] = 0;
                }
                that._data = data;
                that.complete = true;
                */
            }
        });
    }
});
