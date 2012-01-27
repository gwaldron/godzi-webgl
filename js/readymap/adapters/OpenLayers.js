
if (typeof OpenLayers !== 'undefined') {

    OpenLayers.Map.prototype.finishGlobe = function () {
        var size = { "w": $(this.div).width(), "h": $(this.div).height() };
        this._mapView = new ReadyMap.MapView(this._canvasId, size, this._map);
    }

    OpenLayers.Map.prototype.setupGlobe = function (globe) {
        // create the ReadyMap map model:
        this._map = new ReadyMap.Map();

        this._canvasId = this.div.id + "_canvas";
        this._canvas = $("<canvas/>").attr("id", this._canvasId);
        $(this.div).append(this._canvas);

        //Initialize the prototypes        

        //Attach a new destroy function that removes the canvas from the parent div
        this.destroy = function () {
            OpenLayers.Map.prototype.destroy.call(this);
            $(this._canvas).remove();
        }

        //Override addLayer so that it adds layers to our ReadyMap map
        this.addLayer = function (layer) {
            OpenLayers.Map.prototype.addLayer.call(this, layer);
            //Add the layer to the ReadyMap map
            this._map.addImageLayer(new ReadyMap.OLImageLayer({
                name: layer.name,
                sourceLayer: layer
            }));
        };

        var panScale = 0.002;
        this.pan = function (dx, dy, options) {
            if (this.is3D) {
                this._mapView.viewer.getManipulator().panModel(-dx * panScale, dy * panScale);
            }
            else {
                OpenLayers.Map.prototype.pan.call(this, dx, dy, options);
            }
        };

        var zoomScale = 0.1;
        this.zoomIn = function () {
            if (this.is3D) {
                this._mapView.viewer.getManipulator().zoomModel(0, -zoomScale);
            }
            else {
                OpenLayers.Map.prototype.zoomIn.call(this);
            }
        };

        this.zoomOut = function () {
            if (this.is3D) {
                this._mapView.viewer.getManipulator().zoomModel(0, zoomScale);
            }
            else {
                OpenLayers.Map.prototype.zoomOut.call(this);
            }
        };

        this.zoomToExtent = function (bounds, closest) {
            if (this.is3D) {
                if (bounds === null) {
                    bounds = new OpenLayers.Bounds(-180, -90, 180, 90);
                }
                var width = bounds.getWidth();
                var height = bounds.getHeight();
                var maxDim = width > height ? width : height;
                var radius = maxDim / 2.0;
                var center = bounds.getCenterLonLat();

                var range = ((.5 * radius) / 0.267949849) * 111000.0;
                if (range != 0)
                    this._mapView.viewer.manipulator.setViewpoint(center.lat, center.lon, 0.0, 0, -90, range);
            }
            else {
                OpenLayers.Map.prototype.zoomToExtent.call(this, bounds, closest);
            }
        }

        this.show3D = function () {
            this.is3D = true;
            $(this._canvas).show();
            $(this.viewPortDiv).hide();

            if (this._mapView !== undefined) {
                var extent = this.getExtent();
                if (extent !== null) {
                    this.zoomToExtent(extent, false);
                }
                else {
                    this.zoomToMaxExtent();
                }
            }
        };

        this.show2D = function () {
            this.is3D = false;
            $(this._canvas).hide();
            $(this.viewPortDiv).show();

            if (this._mapView !== undefined) {
                var viewMatrix = this._mapView.viewer.view.getViewMatrix();
                viewMatrix = osg.Matrix.inverse(viewMatrix);
                var eye = [];
                osg.Matrix.getTrans(viewMatrix, eye);
                var lla = this._mapView.map.profile.ellipsoid.ecef2lla(eye);
                lla[0] = Math.rad2deg(lla[0]);
                lla[1] = Math.rad2deg(lla[1]);
                var range = lla[2];
                
                var radius = ((range / 111000.0) * 0.267949849) / 0.5;
                var bounds = new OpenLayers.Bounds(lla[0] - radius, lla[1] - radius, lla[0] + radius, lla[1] + radius);
                this.zoomToExtent(bounds, false);
            }

            //var extent = this.getExtent();
            //this.zoomToExtent(this.getExtent());
        };

        this.set3D = function (is3D) {
            if (is3D) this.show3D();
            else this.show2D();
        };

        this.set3D(true);


    }
}