
if (typeof OpenLayers !== 'undefined') {

    OpenLayers.Map.prototype.finishGlobe = function () {
        var size = { "w": $(this.div).width(), "h": $(this.div).height() };
        this._mapView = new ReadyMap.MapView(this._canvasId, size, this._map);
    }

    OpenLayers.Map.prototype.setupGlobe = function () {
        // create the ReadyMap map model:
        this._map = new ReadyMap.Map();

        this._canvasId = this.div.id + "_canvas";
        this._canvas = $("<canvas/>").attr("id", this._canvasId);
        $(this.div).append(this._canvas);

        this.div.removeChild(this.viewPortDiv);

        //Initialize the prototypes

        //Attach a new destroy function that removes the canvas from the parent div
        this.destroy = function () {
            $(this._canvas).remove();

            //Remove any 
            if (this.controls != null) {
                for (var i = this.controls.length - 1; i >= 0; --i) {
                    this.controls[i].destroy();
                }
                this.controls = null;
            }

        }

        //Override addLayer so that it adds layers to our ReadyMap map
        this.addLayer = function (layer) {
            for (var i = 0, len = this.layers.length; i < len; i++) {
                if (this.layers[i] == layer) {
                    throw new Error("You tried to add the layer: " + layer.name +
                                " to the map, but it has already been added");
                }
            }
            if (this.events.triggerEvent("preaddlayer", { layer: layer }) === false) {
                return;
            }

            if (this.allOverlays) {
                layer.isBaseLayer = false;
            }

            this.setLayerZIndex(layer, this.layers.length);

            this.layers.push(layer);
            layer.setMap(this);

            if (layer.isBaseLayer || (this.allOverlays && !this.baseLayer)) {
                if (this.baseLayer == null) {
                    // set the first baselaye we add as the baselayer
                    this.setBaseLayer(layer);
                } else {
                    layer.setVisibility(false);
                }
            }

            //Add the layer to the ReadyMap map
            this._map.addImageLayer(new ReadyMap.OLImageLayer({
                name: layer.name,
                sourceLayer: layer
            }));

            this.events.triggerEvent("addlayer", { layer: layer });
            layer.events.triggerEvent("added", { map: this, layer: layer });
            layer.afterAdd();
        };

        var panScale = 0.002;
        this.pan = function (dx, dy, options) {
            this._mapView.viewer.getManipulator().panModel(-dx * panScale, dy * panScale);
        };

        var zoomScale = 0.1;
        this.zoomIn = function () {
            this._mapView.viewer.getManipulator().zoomModel(0, -zoomScale);
        };

        this.zoomOut = function () {
            this._mapView.viewer.getManipulator().zoomModel(0, zoomScale);
        };

        this.zoomToExtent = function (bounds, closest) {

            var width = bounds.getWidth();
            var height = bounds.getHeight();
            var maxDim = width > height ? width : height;
            var radius = maxDim / 2.0;
            var center = bounds.getCenterLonLat();

            var range = ((.5 * radius) / 0.267949849) * 111000.0;
            if (range != 0)
                this._mapView.viewer.manipulator.setViewpoint(center.lat, center.lon, 0.0, 0, -90, range);
        }
    }
}