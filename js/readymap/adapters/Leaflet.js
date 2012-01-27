if (typeof L !== 'undefined') {

  L.Map.prototype._base_initialize = L.Map.prototype.initialize;

  L.Map.prototype.initialize = function(id, options) {
    var container = L.DomUtil.get(id);
    var divHeight = $("#" + id).height();
    var divWidth = $("#" + id).width();
    if (options.globe && options.splitview)
      divWidth = Math.floor(divWidth / 2) - 4;

    this._leafletDivId = 'leaflet_div';
    this._leafletDiv = L.DomUtil.create('div', '', container);
    this._leafletDiv.id = this._leafletDivId;

    document.getElementById(this._leafletDivId).style.width = divWidth;
    document.getElementById(this._leafletDivId).style.height = divHeight;

    this._base_initialize(this._leafletDivId, options);

    if (this.options.globe) {
      this._rmDivId = 'rm_div';
      this._rmDiv = L.DomUtil.create('div', '', container);
      this._rmDiv.id = this._rmDivId;

      document.getElementById(this._rmDivId).style.width = divWidth;
      document.getElementById(this._rmDivId).style.height = divHeight

      if (this.options.splitview) {
        document.getElementById(this._leafletDivId).style.marginRight = 4;
        document.getElementById(this._leafletDivId).style.position = 'relative';
        document.getElementById(this._leafletDivId).style.float = 'left';
        document.getElementById(this._rmDivId).style.position = 'relative';
        document.getElementById(this._rmDivId).style.float = 'left';
      }

      this._rmMap = new ReadyMap.Map();

      //TODO: Temp code, needs to be replaced by ability to specify projection
      this._rmMap.profile = new osgearth.MercatorProfile();
      this._rmMap.profile.baseTilesX = 1;
      this._rmMap.profile.baseTilesY = 1;

      //TODO: This code will be used in place of finalizeGlobe method once
      //      ReadyMap has been fixed to support an initial map without layers
      //var size = { "w": $(this._rmDiv).width(), "h": $(this._rmDiv).height() };
      //this.MapView = new ReadyMap.MapView(this._canvasId, size, this._rmMap);

      this._canvasId = "rm_canvas";
      this._canvas = L.DomUtil.create('canvas', '', document.getElementById(this._rmDivId));
      this._canvas.id = this._canvasId;

      this.on('viewreset', this.onLeafletViewReset, this);
      this.on('move', this.onLeafletViewReset, this);
    }
  }

  L.Map.prototype.onLeafletViewReset = function() {
    if (this._loaded) {
      var bounds = this.getBounds();
      var width = Math.abs(bounds.getNorthEast().lng - bounds.getSouthWest().lng) % 180.0;
      if (bounds.getNorthEast().lng < bounds.getSouthWest().lng)
        width = 180.0 - width;
      var height = bounds.getNorthEast().lat - bounds.getSouthWest().lat;

      var maxDim = width > height ? width : height;
      var radius = maxDim / (width > height ? 4.0 : 2.0);
      var center = bounds.getCenter();

      var range = ((.5 * radius) / 0.267949849) * 111000.0;
      if (range != 0)
        this.MapView.viewer.manipulator.setViewpoint(center.lat, center.lng, 0.0, 0, -90, range);
    }
  }

  L.Map.prototype._base_addLayer = L.Map.prototype.addLayer;

  L.Map.prototype.addLayer = function(layer) {
    this._base_addLayer(layer);

    this._rmMap.addImageLayer(new ReadyMap.LeafletImageLayer({
      name: "Leaflet TileLayer",
      sourceLayer: layer
    }));
  }

  //L.Map.prototype._base_addControl = L.Map.prototype.addControl;

  //L.Map.prototype.addControl = function(control) {
  //  this._base_addControl(control);
  //  
  //  
  //}

  L.Map.prototype.finalizeGlobe = function() {
    if (this.options.globe && this._rmMap) {
      if (!this.options.splitview)
        document.getElementById(this._leafletDivId).style.display = 'none';

      var size = { "w": $(this._rmDiv).width(), "h": $(this._rmDiv).height() };
      this.MapView = new ReadyMap.MapView(this._canvasId, size, this._rmMap);

      this.onLeafletViewReset();
    }
  }

  L.Map.prototype.show3D = function() {
    if (this.options.globe) {
      document.getElementById(this._leafletDivId).style.display = 'none';
      document.getElementById(this._rmDivId).style.display = 'block';
      //document.getElementById(this._rmDivId).appendChild(document.getElementById("leaflet-control-container"));
    }
  }

  L.Map.prototype.show2D = function() {
    if (this.options.globe) {
      document.getElementById(this._rmDivId).style.display = 'none';
      document.getElementById(this._leafletDivId).style.display = 'block';
      //document.getElementById(this._leafletDivId).appendChild(document.getElementById("leaflet-control-container"));
    }
  }

}