// Plugin L.Geoserver.js Lengkap (WMS, WMS Image, WFS, & Multi-Layer Legend)
L.Geoserver = L.TileLayer.WMS.extend({
    initialize: function (baseLayerUrl, options) {
        L.TileLayer.WMS.prototype.initialize.call(this, baseLayerUrl, options);
    }
});

// 1. WMS Tile Layer
L.Geoserver.wms = function (baseLayerUrl, options) {
    return new L.Geoserver(baseLayerUrl, options);
};

// 2. WMS Single Image Overlay
L.Geoserver.wmsImage = function (baseLayerUrl, options) {
    var settings = L.extend(
        {
            service: "WMS",
            version: "1.1.1",
            request: "GetMap",
            layers: "",
            styles: "",
            format: "image/png",
            transparent: true,
            srs: "EPSG:4326"
        },
        options
    );

    var imageLayer = L.layerGroup();

    imageLayer.onAdd = function (map) {
        var bounds = map.getBounds();
        var bbox = bounds.toBBoxString();
        var size = map.getSize();

        var url =
            baseLayerUrl +
            "?service=" + settings.service +
            "&version=" + settings.version +
            "&request=" + settings.request +
            "&layers=" + encodeURIComponent(settings.layers) +
            "&styles=" + encodeURIComponent(settings.styles) +
            "&bbox=" + bbox +
            "&width=" + size.x +
            "&height=" + size.y +
            "&srs=" + settings.srs +
            "&format=" + encodeURIComponent(settings.format) +
            "&transparent=" + settings.transparent;

        var overlay = L.imageOverlay(url, bounds, {
            opacity: settings.opacity || 1
        });
        imageLayer.addLayer(overlay);
    };

    return imageLayer;
};

// 3. WFS GeoJSON Layer
L.Geoserver.wfs = function (baseLayerUrl, options) {
    var settings = L.extend(
        {
            service: "WFS",
            version: "1.0.0",
            request: "GetFeature",
            typeName: "",
            outputFormat: "application/json",
            srsName: "EPSG:4326",
            style: null,
            onEachFeature: null
        },
        options
    );

    var geoJsonLayer = L.geoJSON(null, {
        style: settings.style,
        onEachFeature: settings.onEachFeature
    });

    var url =
        baseLayerUrl +
        "?service=" + settings.service +
        "&version=" + settings.version +
        "&request=" + settings.request +
        "&typeName=" + encodeURIComponent(settings.typeName) +
        "&outputFormat=" + encodeURIComponent(settings.outputFormat) +
        "&srsName=" + settings.srsName;

    if (settings.CQL_FILTER) {
        url += "&CQL_FILTER=" + encodeURIComponent(settings.CQL_FILTER);
    }

    fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            geoJsonLayer.addData(data);
        })
        .catch(function (err) {
            console.error("Error memuat WFS:", err);
        });

    return geoJsonLayer;
};

// 4. WMS Legend Control (Mendukung 1 atau banyak layer & bisa di-scroll)
L.Geoserver.legend = function (baseLayerUrl, options) {
    var legend = L.control({ position: options.position || "bottomleft" });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create("div", "info legend");
        div.style.background = "white";
        div.style.padding = "10px";
        div.style.borderRadius = "5px";
        div.style.boxShadow = "0 0 8px rgba(0,0,0,0.2)";
        div.style.maxHeight = "260px";
        div.style.overflowY = "auto";
        div.style.fontSize = "12px";

        L.DomEvent.disableScrollPropagation(div);
        L.DomEvent.disableClickPropagation(div);

        var layerList = Array.isArray(options.layers)
            ? options.layers
            : [{ name: options.layers, title: options.title || "" }];

        var html = "";
        layerList.forEach(function (item) {
            var layerName = typeof item === "string" ? item : item.name;
            var layerTitle = typeof item === "string" ? "" : item.title;

            var url =
                baseLayerUrl +
                "?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LEGEND_OPTIONS=forceLabels:on&LAYER=" +
                layerName;

            if (options.style) {
                url += "&STYLE=" + options.style;
            }

            if (layerTitle) {
                html +=
                    '<div style="font-weight:bold; margin-top:6px; margin-bottom:2px;">' +
                    layerTitle +
                    "</div>";
            }
            html +=
                '<div><img src="' + url + '" alt="Legenda ' + layerName + '"></div>';
        });

        div.innerHTML = html;
        return div;
    };

    return legend;
};