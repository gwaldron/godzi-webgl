/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

osgearth.Map = function(args) {

    this.usingDefaultProfile = false;

    // whether it's a 2D or 3D map
    this.threeD = true;

    // whether the map is round (geocentric) or flat (projected)
    this.geocentric = true;

    // start at this level
    this.minLevel = 0;

    // don't subdivide beyond this level
    this.maxLevel = 22;

    // whether to draw a tile before all the layers have loaded
    this.waitForAllLayers = true;

    // scale factor for tile paging
    this.zoomScale = 1.0;

    if (args !== undefined) {
        if (args.profile !== undefined)
            this.profile = args.profile;
        if (args.threeD !== undefined)
            this.threeD = args.threeD;
        if (args.twoD !== undefined)
            this.threeD = (args.twoD !== true);
        if (args.minLevel !== undefined)
            this.minLevel = args.minLevel;
        if (args.maxLevel !== undefined)
            this.maxLevel = args.maxLevel;
        if (args.waitForAllLayers !== undefined)
            this.waitForAllLayers = args.waitForAllLayers;
        if (args.zoomScale !== undefined)
            this.zoomScale = args.zoomScale;
        if (args.geocentric !== undefined)
            this.geocentric = args.geocentric;
        else if (this.threeD === false)
            this.geocentric = false;
    }

    if (this.profile === undefined) {
        this.profile = new osgearth.GeodeticProfile();
        this.usingDefaultProfile = true;
    }

    // ordered list of image layers in the map
    this.imageLayers = [];

    //Elevation layers
    this.elevationLayers = [];

    // these handle the automatic deletion of culled tiles.
    this.drawList = {};
    this.expireList = {};

    // you can monitor this value to see how many tiles are being drawn each frame.
    this.drawListSize = 0;
};

osgearth.Map.prototype = {

    addImageLayer: function(layer) {
        this.imageLayers.push(layer);
        if (this.usingDefaultProfile && layer.profile !== undefined) {
            this.profile = layer.profile;
            this.usingDefaultProfile = false;
        }
    },

    addElevationLayer: function(layer) {
        this.elevationLayers.push(layer);
    },

    // converts [long,lat,alt] to world model coordinates [x,y,z]
    lla2world: function(lla) {
        if (this.geocentric)
            return this.profile.ellipsoid.lla2ecef(lla);
        else
            return this.profile.fromLLA(lla);
    },

    world2lla: function(world) {
        if (this.geocentric)
            return this.profile.ellipsoid.ecef2lla(world);
        else
            return this.profile.toLLA(world);
    },

    // called by Tile::traverse to tell the map that the tile is in use
    markTileDrawn: function(tile) {
        this.drawList[tile.key] = tile;
        this.expireList[tile.key] = null;
        this.drawListSize++;
    },


    createEmptyHeightField: function(numColumns, numRows) {
        var data = [];
        var numElements = numColumns * numRows;
        for (var i = 0; i < numElements; i++) {
            data[i] = 0;
        }
        return new osgearth.HeightField(numColumns, numRows, data);
    },
    

    //Creates a heightfield from the elevation layers or an empty heightfield
    createHeightField: function(key, loadNow) {
        if (this.elevationLayers.length == 0) {
            return null;
            //return this.createEmptyHeightField(16, 16);
        }
        else {
            //Just return the first layers heightfield            
            return this.elevationLayers[0].createHeightField(key, this.profile, loadNow);
        }
    },

    frame: function() {
        // anything left in the expiration list gets deleted (well its children anyway)
        for (var key in this.expireList) {
            tile = this.expireList[key];
            if (tile !== undefined && tile != null && tile.parents.length > 0) {
                tile.resetSubtiles();
            }
        }

        // use this frame's draw list as the next frame's expiration list.
        this.expireList = this.drawList;
        delete this.drawList;
        this.drawList = {};
        this.drawListSize = 0;
    }
};
