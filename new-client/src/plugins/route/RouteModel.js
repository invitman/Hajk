import { Style, Icon, Fill, Stroke, Circle } from "ol/style";
import { Source, Vector } from "ol/source";
import { Layer, Vector as layerVector } from "ol/layer";
import { Point } from "ol/geom";
import { Feature, Observable } from "ol";
import { transform } from "ol/proj";
import { Polyline } from "ol/format";
import { unByKey } from "ol/Observable";
import $ from "jquery";

class RouteModel {
  constructor(settings) {
    this.olMap = settings.map;
    console.log("settings", settings);
    this.url = settings.app.config.appConfig.proxy + settings.url;
    this.type = "routing";
    this.panel = "routingpanel";
    this.toolbar = "bottom";
    this.icon = "fa fa-level-up icon";
    this.title = "Navigation";
    this.visible = false;
    this.Id = "LocationB";
    this.state = "choose_start"; // will change to choose_end and choose_mode
    this.onStartKey = undefined;
    this.onEndKey = undefined;
    this.onRoutingKey = undefined;
    this.routingFinished = undefined;
    this.apiKey = "AIzaSyAen26Yaacga-Z3j0GE0qTknK3Wqnyqjtc";
    this.travelMode = "walking";
    this.travelModeSwe = "Gå";
    this.instruction = "";
    this.position = {
      latitude: undefined,
      longitude: undefined,
      latitudeEnd: undefined,
      longitudeEnd: undefined
    };
    this.projection = settings.app.config.mapConfig.map.projection;
  }

  flyTo(view, location, zoom) {
    const duration = 1500;
    view.animate({
      zoom: zoom,
      center: location,
      duration: duration
    });
  }

  setTravelMode(travelmode) {
    switch (travelmode) {
      case "walking":
        this.travelModeSwe = "Gå";
        break;
      case "driving":
        this.travelModeSwe = "Köra";
        break;
      case "bicycling":
        this.travelModeSwe = "Cykla";
        break;
      case "transit":
        this.travelModeSwe = "Åka kollektivt";
        break;
      default:
        break;
    }

    this.travelMode = travelmode;
  }

  displayMap(visibleLayers, mapSettings) {
    var layers = this.olMap.getLayers().getArray();
    layers
      .filter(
        layer =>
          layer.getProperties()["layerInfo"] &&
          layer.getProperties()["layerInfo"]["layerType"] !== "base"
      )
      .forEach(layer => {
        if (
          visibleLayers.some(
            visibleLayer => visibleLayer === layer.getProperties()["name"]
          )
        ) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
        }
      });

    this.flyTo(this.olMap.getView(), mapSettings.center, mapSettings.zoom);
  }

  setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setParentChapter(child, chapter);
      });
    }
  }

  setPositionEvent(e) {
    var pos = this.position;
    pos.latitude = e.coords.latitude;
    pos.longitude = e.coords.longitude;
    this.position = pos;
    this.setPosition();
  }

  setPosition() {
    this.layer_start.getSource().clear();
    if (this.position.longitude && this.position.latitude) {
      var point = new Point([this.position.longitude, this.position.latitude]);
      var transformed = transform(
        point.getCoordinates(),
        "EPSG:4326",
        this.olMap.getView().getProjection()
      );
      point.setCoordinates(transformed);
      var ft = new Feature({ geometry: point });
      ft.setStyle(this.style_start);
      this.layer_start.getSource().addFeature(ft);
      this.olMap.getView().setCenter(point.getCoordinates());
    }
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.setPositionEvent.bind(this)
      );
    } else {
      window.alert(
        "Kan inte få position. Skriv startposition i rutan eller tryck position på kartan."
      );
    }
  }

  positionError(e) {
    /* reset this location setting */
    this.position = {
      latitude: undefined,
      longitude: undefined
    };
    console.log("positionError", e);
  }

  turnOnGPSClicked() {
    this.getLocation();
  }

  initStartPoint() {
    this.style_start = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        opacity: 1.0,
        src: "/assets/icons/startRouting_40.png",
        scale: 1
      })
    });

    this.style_end = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        opacity: 1.0,
        src: "/assets/icons/malRouting_40.png",
        scale: 1
      })
    });

    this.style_route = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        opacity: 1.0,
        src: "/assets/icons/markering_A_liten.png",
        scale: 1
      })
    });

    this.style_route_normal = this.style_route;

    this.style_route_highlight = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        opacity: 1.0,
        src: "assets/icons/Markering_A_stor.png",
        scale: 1.5
      })
    });

    this.style_route_highlight = this.style_route_highlight;

    this.layer_drawing_style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.5)"
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 255, 0.5)",
        width: 4
      }),
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.5)"
        }),
        stroke: new Stroke({
          color: "rgba(255, 255, 255, 0.5)",
          width: 2
        })
      })
    });

    var source_start = new Vector({});
    var source_end = new Vector({});
    var source_route = new Vector({});
    var source_drawing = new Vector({});

    if (this.layer_start === undefined) {
      this.layer_start = new layerVector({
        source: source_start,
        name: "routing",
        content: "Punkt",
        queryable: false,
        style: this.style_start
      });

      this.layer_end = new layerVector({
        source: source_end,
        name: "routing",
        content: "Punkt",
        queryable: false,
        style: this.style_end
      });

      this.layer_route = new layerVector({
        source: source_route,
        name: "routing",
        content: "Punkt",
        queryable: true,
        style: this.style_route
      });

      this.layer_drawing = new layerVector({
        source: source_drawing,
        name: "routing",
        content: "linje",
        queryable: false,
        style: this.layer_drawing_style
      });

      this.olMap.addLayer(this.layer_start);
      this.olMap.addLayer(this.layer_end);
      this.olMap.addLayer(this.layer_route);
      this.olMap.addLayer(this.layer_drawing);
    }
  }

  load(callback) {
    fetch(this.url).then(response => {
      response.json().then(data => {
        data.chapters.forEach(chapter => {
          this.setParentChapter(chapter, undefined);
        });
        callback(data.chapters);
        this.chapters = data.chapters;
      });
    });
  }

  activateStartMode() {
    console.log("activateStartMode");
    this.state = "choose_start";
    if (this.onEndKey !== undefined) {
      unByKey(this.onEndKey);
      this.onEndKey = undefined;
    }
    if (this.onRoutingKey !== undefined) {
      unByKey(this.onRoutingKey);
      this.onRoutingKey = undefined;
    }
    if (this.onStartKey === undefined) {
      this.onStartKey = this.olMap.on(
        "singleclick",
        this.startPointSelection.bind(this)
      );
    }

    /*if (isMobile) {
      this.props.navigationPanel.minimize();
    }*/
  }

  startPointSelection(e) {
    var startPoint = new Feature(); /* startPoint and point(below) must be the same l.134 */
    startPoint.setGeometry(new Point(e.coordinate));
    /* Convert Geometry to Coordinate */

    var lonlat = transform(
      startPoint.getGeometry().getCoordinates(),
      this.projection,
      "EPSG:4326"
    );
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.layer_start.getSource().clear();
    this.layer_start.getSource().addFeature(startPoint);
    startPoint.setStyle(this.style_start);

    var pos = this.position;
    pos.latitude = lat;
    pos.longitude = lon;
    this.position = pos;
  }

  activateEndMode() {
    this.state = "choose_end";
    if (this.onStartKey !== undefined) {
      unByKey(this.onStartKey);
      this.onStartKey = undefined;
    }
    if (this.onRoutingKey !== undefined) {
      unByKey(this.onRoutingKey);
      this.onRoutingKey = undefined;
    }
    if (this.onEndKey === undefined) {
      this.onEndKey = this.olMap.on(
        "singleclick",
        this.endPointSelection.bind(this)
      );
    }
    if (this.onEndKey !== undefined && this.routingFinished) {
      this.set(
        "onEndKey",
        this.olMap.on("singleclick", this.endPointSelection.bind(this))
      );
      // TODO modify if and clear route
      this.routeFinished = false;
    }

    /*if (isMobile) {
      this.props.navigationPanel.minimize();
    }*/
  }

  endPointSelection(e) {
    var endPoint = new Feature();
    endPoint.setGeometry(new Point(e.coordinate));

    var lonlat = transform(
      endPoint.getGeometry().getCoordinates(),
      this.projection,
      "EPSG:4326"
    );
    var lon = lonlat[0];
    var lat = lonlat[1];

    this.layer_end.getSource().clear();
    this.layer_end.getSource().addFeature(endPoint);
    endPoint.setStyle(this.style_end);

    var pos = this.position;
    pos.latitudeEnd = lat;
    pos.longitudeEnd = lon;
    this.position = pos;
  }

  activateRoutingMode() {
    this.state = "show_route";
    if (this.onStartKey !== undefined) {
      unByKey(this.onStartKey);
      this.onStartKey = undefined;
    }
    if (this.onEndKey !== undefined) {
      unByKey(this.onEndKey);
      this.onEndKey = undefined;
    }

    if (this.onRoutingKey === undefined) {
      // this.set('onRoutingKey', this.get('map').on('singleclick', this.showRoutingInfoPopup.bind(this)));
    }
    this.searchTrip();
  }

  searchTrip() {
    this.state = undefined;
    var pos = this.position;
    if (
      pos.latitude === undefined ||
      pos.longitude === undefined ||
      pos.latitudeEnd === undefined ||
      pos.longitudeEnd === undefined
    ) {
      alert("Välj start och slut");
    } else {
      unByKey(this.onEndKey);
      var mode = this.travelMode;
      var url =
        "https://maps.googleapis.com" +
        //document.location.hostname +
        "/maps/api/directions/json?mode=" +
        mode +
        "&origin=" +
        pos.latitude +
        "," +
        pos.longitude +
        "&destination=" +
        pos.latitudeEnd +
        "," +
        pos.longitudeEnd +
        "&key=" +
        this.apiKey;
      var request = $.ajax({
        url: url,
        type: "post",
        contentType: "text/plain",
        xhrFields: {
          withCredentials: false
        },
        cache: false,
        success: res => {
          this.plotRoute(res, this.map, this.layer_route, this.layer_drawing);
        },
        error: err => {
          alert("Det gick inte att navigera. Försök igen senare.");
          throw new Error(err);
        }
      });
    }
  }

  plotRoute(res, map, layer, layer_drawing) {
    layer.getSource().clear();
    var steps = res.routes[0].legs[0].steps;
    const routeDiv = document.createElement("div");
    const p = document.createElement("p");
    const ul = document.createElement("ol");
    p.innerHTML = `
                    <table class="table table-condensed">
                      <tbody>
                        <tr><td><b>Färdsätt</b></td><td>${
                          this.travelModeSwe
                        }</td></tr>
                        <tr><td><b>Avstånd</b></td><td>${
                          res.routes[0].legs[0].distance.text
                        } (${res.routes[0].legs[0].distance.value} m)</td></tr>
                        <tr><td><b>Tid</b></td><td>${
                          res.routes[0].legs[0].duration.text
                        }</td></tr>
                        <tr><td><b>Startadress</b></td><td>${
                          res.routes[0].legs[0].start_address
                        }</td></tr>
                        <tr><td><b>Slutadress</b></td><td>${
                          res.routes[0].legs[0].end_address
                        }</td></tr>
                      </tbody>
                    </table>
                    `;
    routeDiv.appendChild(p);
    for (var i = 0; i < steps.length; i++) {
      var lat = steps[i].start_location.lat;
      var lng = steps[i].start_location.lng;

      var point = new Point([lng, lat]);
      var transformed = transform(
        point.getCoordinates(),
        "EPSG:4326",
        this.projection
      );
      point.setCoordinates(transformed);

      var n = i + 1;
      var tmpFeature = new Feature({
        geometry: point,
        info: steps[i].html_instructions
      });
      tmpFeature.number = "" + n;
      tmpFeature.setStyle(this.style_route);
      layer.getSource().addFeature(tmpFeature);
      // route features
      var tmpLi = document.createElement("li");
      tmpLi.onclick = this.highlightFeature.bind(this);
      tmpLi.id = "step_number" + n;
      tmpLi.innerHTML = steps[i].html_instructions;
      // var tmpI = document.createElement('i');
      // tmpI.class = 'fa fa-arrow-down';
      // var tmpBr = document.createElement('br');
      ul.appendChild(tmpLi);
      // routeDiv.appendChild(tmpI);
      // routeDiv.appendChild(tmpBr);
    }
    routeDiv.appendChild(ul);

    var resList = document.getElementById("resultList");
    while (resList.firstChild) {
      resList.removeChild(resList.firstChild);
    }

    // put result into the table
    document.getElementById("resultList").appendChild(routeDiv);

    var routePath = new Polyline({}).readGeometry(
      res.routes[0].overview_polyline.points
    );

    routePath = new Polyline({}).readGeometry(
      res.routes[0].overview_polyline.points,
      {
        dataProjection: "EPSG:4326",
        featureProjection: this.projection
      }
    );

    layer_drawing.getSource().clear();
    var ft = new Feature({
      type: "routing",
      geometry: routePath
    });
    ft.setStyle(this.layer_drawing_style);

    layer_drawing.getSource().addFeature(ft);
    var centerLat = (this.position.latitude + this.position.latitudeEnd) / 2;
    var centerLon = (this.position.longitude + this.position.longitudeEnd) / 2;
    this.olMap
      .getView()
      .setCenter(
        transform([centerLon, centerLat], "EPSG:4326", this.projection)
      );
    this.olMap
      .getView()
      .fit(layer_drawing.getSource().getExtent(), this.olMap.getSize());
  }

  highlightFeature(event) {
    var feature_number = -1;
    if (event.target.nodeName === "B") {
      feature_number = event.target.parentNode.id.substring(
        "step_number".length
      );
    } else {
      feature_number = event.target.id.substring("step_number".length);
    }

    // feature_number = feature_number - 1;
    var layer = this.layer_route;

    var features = layer.getSource().getFeatures();
    var featuresLength = features.length + 1;

    for (var i = 0; i < features.length; i++) {
      if (features[i].number === feature_number) {
        features[i].setStyle(this.style_route_highlight);
      } else {
        features[i].setStyle(this.style_route_normal);
      }
    }
  }

  drawRoute(steps) {
    var routePath = new Polyline({}).readGeometry(steps);

    var ft = new Feature({ type: "routing", geometry: routePath });
    ft.setStyle(this.style_route);
    this.get("layer_drawing")
      .getSource()
      .addFeature(ft);
  }

  clearMap() {
    this.layer_start.getSource().clear();
    this.layer_end.getSource().clear();
    this.layer_route.getSource().clear();
    this.layer_drawing.getSource().clear();

    // Remove the step instructions
    document.getElementById("resultList").innerHTML = "";

    this.position = {
      latitude: undefined,
      longitude: undefined,
      latitudeEnd: undefined,
      longitudeEnd: undefined
    };

    if (this.onStartKey !== undefined) {
      unByKey(this.onStartKey);
      this.onStartKey = undefined;
    }
    if (this.onRoutingKey !== undefined) {
      unByKey(this.onRoutingKey);
      this.onRoutingKey = undefined;
    }
    if (this.onEndKey !== undefined) {
      unByKey(this.onEndKey);
      this.onEndKey = undefined;
    }
  }

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */

  onCloseTab() {
    // TODO this should be executed when the tab is hidden
    if (this.onStartKey !== undefined) {
      unByKey(this.onStartKey);
      this.onStartKey = undefined;
    }
    if (this.onRoutingKey !== undefined) {
      unByKey(this.onRoutingKey);
      this.onRoutingKey = undefined;
    }
    if (this.onEndKey !== undefined) {
      unByKey(this.onEndKey);
      this.onEndKey = undefined;
    }
  }
}

export default RouteModel;
