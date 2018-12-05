import TileGrid from "ol/tilegrid/TileGrid";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import ImageWMS from "ol/source/ImageWMS";
import TileWMS from "ol/source/TileWMS";
import GeoJSON from "ol/format/GeoJSON";
import Attribution from "ol/control/Attribution";
import LayerInfo from "./LayerInfo.js";

var WmsLayerProperties = {
  url: "",
  projection: "EPSG:3007",
  serverType: "geoserver",
  opacity: 1,
  status: "ok",
  params: {}
};

class WMSLayer {
  constructor(config, proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.validInfo = true;
    this.defaultProperties = WmsLayerProperties;
    this.legend = config.legend;
    this.attribution = config.attribution;
    this.layerInfo = new LayerInfo(config);

    var source = {
      url: config.url,
      params: config.params,
      projection: config.projection,
      serverType: config.serverType,
      imageFormat: config.imageFormat,
      attributions: this.getAttributions()
    };

    if (
      config.resolutions &&
      config.resolutions.length > 0 &&
      config.origin &&
      config.origin.length > 0
    ) {
      source.tileGrid = new TileGrid({
        resolutions: config.resolutions,
        origin: config.origin
      });
      source.extent = config.extent;
    }

    if (config.singleTile) {
      this.layer = new ImageLayer({
        name: config.name,
        visible: config.visible,
        queryable: config.queryable,
        caption: config.caption,
        opacity: config.opacity,
        source: new ImageWMS(source),
        layerInfo: this.layerInfo,
        url: config.url
      });
    } else {
      this.layer = new TileLayer({
        name: config.name,
        visible: config.visible,
        queryable: config.queryable,
        caption: config.caption,
        opacity: config.opacity,
        source: new TileWMS(source),
        layerInfo: this.layerInfo,
        url: config.url
      });
    }

    this.subLayers = config.params["LAYERS"].split(",");

    this.layer.getSource().on("tileloaderror", e => {
      this.tileLoadError();
    });

    this.layer.getSource().on("tileloadend", e => {
      this.tileLoadOk();
    });

    this.layer.on("change:visible", e => {
      if (this.layer.get("visible")) {
        this.tileLoadOk();
      }
    });

    this.layer.getSource().set("url", config.url);
    this.type = "wms";
  }

  getAttributions() {
    if (this.attribution) {
      return [
        new Attribution({
          label: this.attribution
        })
      ];
    }
  }

  /**
   * Load feature information.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {external:"ol.style"} style
   */
  getFeatureInformation(params) {
    var url;
    try {
      this.validInfo = true;
      this.featureInformationCallback = params.success;

      url = this.getLayer()
        .getSource()
        .getGetFeatureInfoUrl(
          params.coordinate,
          params.resolution,
          params.projection,
          {
            INFO_FORMAT:
              this.get("serverType") === "arcgis"
                ? "application/geojson"
                : "application/json",
            feature_count: 100
          }
        );

      if (url) {
        if (this.proxyUrl) {
          url = encodeURIComponent(url);
        }

        fetch(this.proxyUrl + url)
          .then(response => {
            response.json().then(data => {
              var features = new GeoJSON().readFeatures(data);
              this.featureInformationCallback(features, this.getLayer());
            });
          })
          .catch(err => {
            params.error(err);
          });
      }
    } catch (e) {
      params.error(e);
    }
  }

  /**
   * Get legend url.
   * @instance
   * @param {string} layerName
   * @return {object} legend
   */
  getLegendUrl(layerName) {
    var legend = Object.assign({}, this.legend);
    legend[0].Url = legend[0].Url.replace(/LAYER=.*/, "LAYER=" + layerName);
    return legend;
  }

  /**
   * Triggers when a tile fails to load.
   * @instance
   */
  tileLoadError() {
    this.status = "loaderror";
  }

  /**
   * Triggers when a tile loads.
   * @instance
   */
  tileLoadOk() {
    this.status = "ok";
  }

  /**
   * Parse response and trigger registred feature information callback.
   * @param {XMLDocument} respose
   * @instance
   */
  getFeatureInformationReponse(response) {
    try {
      var features = new GeoJSON().readFeatures(response);
      this.featureInformationCallback(features, this.getLayer());
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * WmsLayer module.<br>
 * Use <code>require('layer/wmslayer')</code> for instantiation.
 * @module WMSLayer-module
 * @returns {WMSLayer}
 */
export default WMSLayer;