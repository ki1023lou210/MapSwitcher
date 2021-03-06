/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if ("undefined" === typeof browser) {
    browser = chrome;
}



var OutputMaps = {

/** Enumeration of the type of map service */
    category: {
        multidirns: 2,
        singledirns: 1,
        plain: 0,
        special: 5,
        utility: 3,
        download: 4
    }

}




/**
 * Array of all output map services
 *
 * The most important item for each service is the `generate()` function which accepts
 * as input an object containing the data from the source map, plus a view object
 * (representing the extension popup). Each service uses the source map data to
 * generate appropriate links, and calls the relevant functions on the view object
 * to render those links to the view.
 */
OutputMaps.services = [
{
    site: "Google",
    prio: 1,
    image: "googleMapsLogo16x16.png",
    id: "google",
    cat: OutputMaps.category.multidirns,
    maplinks:
    {
        googlemaps: {
            name: "Maps"
        },
        googleterrain: {
            name: "Terrain"
        },
        googleearth: {
            name: "Earth"
        },
        googletraffic: {
            name: "Traffic"
        },
        googlebike: {
            name: "Cycling"
        }
    },
    generate: function(sourceMapData, view) {
        var googleBase = "https://www.google.com/maps/";
        var directions = "";
        var place = "";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "@" + displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng + ",";
        var zoom = "13z";
        var dataWpts = "";
        var dataDirnOptions = "";

        var smdDirns = getDirections(sourceMapData);
        if (smdDirns && "route" in smdDirns) {
            directions = "dir/";

            for (rteWpt of smdDirns.route) {
                if ("address" in rteWpt) {
                    //if address specified, add to directions
                    directions += rteWpt.address + "/";

                    if ("coords" in rteWpt) {
                        //if coord also specified, add to data
                        dataWpts += "!1m5!1m1!1s0x0:0x0!2m2!1d" +
                            rteWpt.coords.lng + "!2d" + rteWpt.coords.lat;
                    } else {
                        dataWpts += "!1m0";
                    }

                } else if ("coords" in rteWpt) {
                    //else if coord specified, add to directions
                    directions += rteWpt.coords.lat + "," + rteWpt.coords.lng + "/";
                    dataWpts += "!1m0";
                }
            }

            var mode = "";
            if (smdDirns.mode) {
                switch (smdDirns.mode) {
                    case "foot":
                        mode = "!3e2";
                        break;
                    case "bike":
                        mode = "!3e1";
                        break;
                    case "car":
                        mode = "!3e0";
                        break;
                    case "transit":
                        mode = "!3e3";
                        break;
                }
            }


            var dataDirnOptions = dataWpts + mode;

            //add elements identifying directions, with counts of all following sub-elements
            var exclMarkCount = (dataDirnOptions.match(/!/g) || []).length;
            dataDirnOptions = "!4m" + (exclMarkCount + 1) + "!4m" + exclMarkCount + dataDirnOptions;
        }
        //only insert a named individual place if there are no directions
        // - google maps doesn't expect both
        else if ("address" in sourceMapData) {
            place = "place/" + sourceMapData.address + "/";
        }

        if ("resolution" in displayedMap) {
            //google minimum zoom is 3
            zoom = calcStdZoomFromRes(
                displayedMap.resolution, displayedMap.centreCoords.lat, 3) + "z";
        }

        var coreLink = googleBase + place + directions + mapCentre + zoom;

        this.maplinks.googlemaps["link"] = coreLink + "/data=" + dataDirnOptions;
        this.maplinks.googleterrain["link"] = coreLink + "/data=" + dataDirnOptions + "!5m1!1e4";
        this.maplinks.googleearth["link"] = coreLink + "/data=!3m1!1e3" + dataDirnOptions;
        this.maplinks.googletraffic["link"] = coreLink + "/data=" + dataDirnOptions + "!5m1!1e1";
        this.maplinks.googlebike["link"] = coreLink + "/data=" + dataDirnOptions + "!5m1!1e3";

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinks);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "Bing",
    prio: 2,
    image: "bingLogo16x16.png",
    id: "bing",
    cat: OutputMaps.category.multidirns,
    maplinks:
    {
        bingroad: {
            name: "Road"
        },
        bingaerial: {
            name: "Aerial"
        },
        bingbirdseye: {
            name: "Bird's eye"
        }
    },
    generate: function(sourceMapData, view) {
        var bingBase = "https://www.bing.com/maps/?";
        var directions = "";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "cp=" + displayedMap.centreCoords.lat + "~" +
                                displayedMap.centreCoords.lng;
        var zoom = "&lvl=10";

        if ("resolution" in displayedMap) {
            //3 <= zoom <=20
            zoom = "&lvl=" + calcStdZoomFromRes(
                                displayedMap.resolution,
                                displayedMap.centreCoords.lat,
                                3, 20);
        }

        var smdDirns = getDirections(sourceMapData);
        if (smdDirns && "route" in smdDirns) {
            directions = "rtp=";
            for (rteWpt of smdDirns.route) {
                if ("coords" in rteWpt) {
                    directions += "pos." + rteWpt.coords.lat + "_" + rteWpt.coords.lng;
                    if ("address" in rteWpt) {
                        directions += "_" + rteWpt.address;
                    }
                    directions += "~";
                } else if ("address" in rteWpt) {
                    directions += "adr." + rteWpt.address + "~";
                }
            }

            var mode = "";
            if (smdDirns.mode) {
                switch (smdDirns.mode) {
                    case "foot":
                        mode = "&mode=w";
                        break;
                    case "car":
                        mode = "&mode=d";
                        break;
                    case "transit":
                        mode = "&mode=t";
                        break;
                }
            }

            directions += mode;
        }
        else if ("address" in sourceMapData) {
            directions = "q=" + sourceMapData.address + "&mkt=en&FORM=HDRSC4";
        }

        this.maplinks.bingroad["link"] =
            bingBase + directions + "&" + mapCentre + zoom;
        this.maplinks.bingaerial["link"] =
            bingBase + directions + "&" + mapCentre + zoom + "&sty=h";
        this.maplinks.bingbirdseye["link"] =
            bingBase + directions + "&" + mapCentre + zoom + "&sty=b";

        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            this.maplinks.bingos = {name: "Ordnance Survey",
                link: (bingBase + directions + "&" + mapCentre + zoom + "&sty=s")}
        }
        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinks);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "OpenStreetMap",
    prio: 3,
    image: "osmLogo16x16.png",
    id: "osm",
    cat: OutputMaps.category.singledirns,
    note: "",
    maplinks:
    {
        osmStandard: "Standard",
        osmCycle: "Cycle Map",
        osmTransport: "Transport",
        osmMapQuestOpen: "MapQuest Open",
        osmHumanitarian: "Humanitarian"
    },
    maplinks:
    {
        osmStandard: {
            name: "Standard"
        },
        osmCycle: {
            name: "Cycle Map"
        },
        osmTransport: {
            name: "Transport"
        },
        osmMapQuestOpen: {
            name: "MapQuest Open"
        },
        osmHumanitarian: {
            name: "Humanitarian"
        },
    },
    generate: function(sourceMapData, view) {
        var osmBase = "https://www.openstreetmap.org/";
        var zoom = "12/";
        var directions = "";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = displayedMap.centreCoords.lat + "/" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            //osm max zoom 19
            zoom = calcStdZoomFromRes(
                displayedMap.resolution, displayedMap.centreCoords.lat, 0, 19) + "/";
        }

        var smdDirns = getDirections(sourceMapData);
        if (smdDirns && "route" in smdDirns) {

            var mode = "";
            if (smdDirns.mode) {
                switch (smdDirns.mode) {
                    case "foot":
                        mode = "engine=mapzen_foot&";
                        break;
                    case "car":
                        mode = "engine=osrm_car&";
                        break;
                    case "bike":
                        mode = "engine=graphhopper_bicycle&";
                        break;
                }
            }

            //OSM appears to only handle single-segment routes.
            //So we choose to use the first and last point of the route from the source map.

            var firstElem = smdDirns.route[0];
            var lastElem = smdDirns.route[smdDirns.route.length - 1];

            if ("coords" in firstElem && "coords" in lastElem) {
               directions = "directions?" + mode + "route=" +
                    firstElem.coords.lat + "," + firstElem.coords.lng + ";" +
                    lastElem.coords.lat + "," + lastElem.coords.lng;
            } else {
                this.note = "OSM directions unavailable because waypoints are not "
                            + "all specified as coordinates.";
            }
        }
        //else if ("address" in sourceMapData) {
        //    directions = "search?query=" + sourceMapData.address;
        //}

        var coreLink = osmBase + directions + "#map=" + zoom + mapCentre;

        this.maplinks.osmStandard["link"] = coreLink;
        this.maplinks.osmCycle["link"] = coreLink + "&layers=C";
        this.maplinks.osmTransport["link"] = coreLink + "&layers=T";
        this.maplinks.osmMapQuestOpen["link"] = coreLink + "&layers=Q";
        this.maplinks.osmHumanitarian["link"] = coreLink + "&layers=H";

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.singledirns, this, this.maplinks, this.note);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks, this.note);
        }
    }
},
{
    site: "Wikimedia Labs",
    image: "wmLabsLogo16x16.png",
    id: "wmLabs",
    cat: OutputMaps.category.utility,
    prio: 4,
    maplinks:
    {
        wmGeoHack: {
            name: "GeoHack"
        },
        wikiminiatlas: {
            name: "Wiki Mini Atlas"
        }
    },
    generate: function(sourceMapData, view) {
        var geohackBase = "https://tools.wmflabs.org/geohack/geohack.php?params=";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = displayedMap.centreCoords.lat + "_N_" + displayedMap.centreCoords.lng + "_E";
        var region = (sourceMapData.countryCode.length > 0) ?
                        "_region:" + sourceMapData.countryCode : "";

        var scale = calculateScaleFromResolution(displayedMap.resolution);
        this.maplinks.wmGeoHack["link"] = geohackBase + mapCentre + region + "_scale:" + scale;

        var wikiminiatlasBase = "https://wma.wmflabs.org/iframe.html?";
        mapCentre = displayedMap.centreCoords.lat + "_" + displayedMap.centreCoords.lng;
        //FIXME this is an approximation of zoom - it's not completely accurate
        zoom = calcStdZoomFromRes(
                displayedMap.resolution, displayedMap.centreCoords.lat, 4, 16) - 1;
        this.maplinks.wikiminiatlas["link"] = wikiminiatlasBase + mapCentre + "_0_0_en_" + zoom + "_englobe=Earth";

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Wikimapia",
    image: "wikimapiaLogo16x16.png",
    id: "wikimapia",
    prio: 10,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        wikimapiaSatellite: {
            name: "Satellite"
        },
        wikimapiaMap: {
            name: "Maps"
        }
    },
    generate: function(sourceMapData, view) {
        var wikimapiaBase = "http://wikimapia.org/#lang=en&";
        var zoom = "z=12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = "z=" +
                calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
        }

        this.maplinks.wikimapiaSatellite["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=b"; //m=b seems to be an optional default anyway
        this.maplinks.wikimapiaMap["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=w";

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Geocaching",
    image: "geocachingLogo16x16.png",
    id: "geocaching",
    note: "geocaching.com requires login to see the map (free sign-up)",
    cat: OutputMaps.category.special,
    maplinks:
    {
        geocaching: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        var geocachingBase = "https://www.geocaching.com/map/#?";
        var zoom = "z=14";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "ll=" + displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = "z=" +
                calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
        }
        this.maplinks.geocaching["link"] = geocachingBase + mapCentre + '&' + zoom;

        view.addMapServiceLinks(this.cat, this, this.maplinks, this.note);
    }
},
{
    site: "what3words",
    image: "w3wLogo.png",
    id: "w3w",
    cat: OutputMaps.category.special,
    maplinks:
    {
        what3words: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        var w3wBase = "https://map.what3words.com/";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;
        this.maplinks.what3words["link"] = w3wBase + mapCentre;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "MapQuest",
    image: "mqLogo16x16.png",
    id: "mapquest",
    prio: 9,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        mqOpen: {
            name: "MapQuest Open"
        }
    },
    generate: function(sourceMapData, view) {
        var mapquestBase = "http://open.mapquest.com/?";
        var zoom = "zoom=12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "center=" + displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                displayedMap.resolution, displayedMap.centreCoords.lat, 2, 18);
            zoom = "zoom=" + zoom;
        }

        this.maplinks.mqOpen["link"] = mapquestBase + mapCentre + '&' + zoom;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "GPX",
    image: "gpxFile16x16.png",
    id: "dl_gpx",
    cat: OutputMaps.category.download,
    generate: function(sourceMapData, view) {
        var displayedMap = getDisplayedMap(sourceMapData);
        view.addFileDownload(this, "gpx_map_centre", "Map centre waypoint", function() {
            var fileData = {
                name: "MapSwitcher.gpx",
                type: "text/xml;charset=utf-8",
                content:
                "<?xml version=\"1.1\"?>\n" +
                "<gpx creator=\"MapSwitcher\" version=\"1.1\" xmlns=\"http://www.topografix.com/GPX/1/1\">\n" +
                    "\t<author>MapSwitcher</author>\n" +
                    "\t<wpt lat=\"" + displayedMap.centreCoords.lat +
                        "\" lon=\"" + displayedMap.centreCoords.lng + "\">\n" +
                        "\t\t<name>Centre of map</name>\n" +
                        "\t\t<desc>" + displayedMap.centreCoords.lat + ", " + displayedMap.centreCoords.lng + "</desc>\n" +
                    "\t</wpt>\n" +
                "</gpx>\n"
            }
            return fileData;
        });

        var smdDirns = getDirections(sourceMapData);
        if (smdDirns && "route" in smdDirns) {

            var firstPoint = smdDirns.route[0];
            var lastPoint = smdDirns.route[smdDirns.route.length - 1];

            var routePoints = "";
            var pointsWithCoords = 0;
            for (rteIndex in smdDirns.route) {
                var rteWpt = smdDirns.route[rteIndex];
                if ("coords" in rteWpt) {
                    routePoints +=
                        "\t\t<rtept lat=\"" + rteWpt.coords.lat + "\" lon=\"" + rteWpt.coords.lng + "\">\n" +
                        "\t\t\t<name>" + rteWpt + "</name>\n" +
                        "\t\t</rtept>\n";
                    pointsWithCoords++;
                }
            }
            //only provide a gpx route download if all the points in the route have coordinates
            if (pointsWithCoords === smdDirns.route.length) {
                view.addFileDownload(this, "gpx_rte", "Route", function() {

                    var fileData = {
                        name: "MapSwitcherRoute.gpx",
                        type:"text/xml;charset=utf-8",
                        content:
                        "<?xml version=\"1.1\"?>\n" +
                        "<gpx creator=\"MapSwitcher\" version=\"1.1\" xmlns=\"http://www.topografix.com/GPX/1/1\">\n" +
                            "\t<author>MapSwitcher</author>\n" +
                            "\t<rte>\n" +
                                "\t\t<name>Map Switcher Route</name>\n" +
                                "\t\t<desc>From " + firstPoint.coords.lat + ", " + firstPoint.coords.lng + " to " +
                                    lastPoint.coords.lat + ", " + lastPoint.coords.lng + "</desc>\n" +
                                routePoints +
                                "\t</rte>\n" +
                        "</gpx>\n"
                    }
                    return fileData;
                });
            }
            else {
                view.addNote(this, "GPX directions unavailable because waypoints are not "
                                   + "all specified as coordinates.");
            }
        }
    }
},
{
    site: "Waze",
    image: "wazeLogo16x16.png",
    id: "waze",
    prio: 6,
    cat: OutputMaps.category.singledirns,
    maplinks:
    {
        livemap: {
            name: "Livemap"
        }
    },
    generate: function(sourceMapData, view) {
        var wazeBase = "https://www.waze.com/livemap?";
        var zoom = "zoom=12";
        var directions = "";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = "zoom=" +
                calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
        }

        var smdDirns = getDirections(sourceMapData);
        if (smdDirns && "route" in smdDirns) {

            //Waze appears to only handle single-segment routes.
            //So we choose to use the first and last point of the route from the source map.

            var firstElem = smdDirns.route[0];
            var lastElem = smdDirns.route[smdDirns.route.length - 1];

            if ("coords" in firstElem && "coords" in lastElem) {
                directions +=
                    "&from_lat=" + firstElem.coords.lat +
                    "&from_lon=" + firstElem.coords.lng +
                    "&to_lat=" + lastElem.coords.lat +
                    "&to_lon=" + lastElem.coords.lng +
                    "&at_req=0&at_text=Now";
            } else {
                this.note = "Waze directions unavailable because waypoints are not "
                            + "all specified as coordinates.";
            }
        }

        this.maplinks.livemap["link"] = wazeBase + zoom + '&' + mapCentre + directions;

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.singledirns, this, this.maplinks, this.note);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks, this.note);
        }
    }
},
{
    site: "OpenSeaMap",
    image: "openSeaMapLogo16x16.png",
    id: "openseamap_map",
    prio: 7,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        openSeaMap: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        var openSeaMapBase = "http://map.openseamap.org/?";
        var zoom = "zoom=12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat, 0, 18);
            zoom = "zoom=" + zoom;
        }

        var layers = "layers=BFTFFTTFFTF0FFFFFFFFFF";

        this.maplinks.openSeaMap["link"] = openSeaMapBase + zoom + '&' + mapCentre + '&' + layers;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Stamen",
    image: "greyMarker.png",
    id: "stamen",
    cat: OutputMaps.category.special,
    maplinks:
    {
        stamenWatercolor: {
            name: "Watercolor"
        },
        stamenToner: {
            name: "Toner"
        },
        stamenTerrain: {
            name: "Terrain"
        }
    },
    generate: function(sourceMapData, view) {
        var stamenBase = "http://maps.stamen.com/";
        var zoom = "12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = displayedMap.centreCoords.lat + "/" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat, 0, 17);
            zoom = "" + zoom;
        }

        this.maplinks.stamenWatercolor["link"] = stamenBase + "watercolor/#" + zoom + '/' + mapCentre;
        this.maplinks.stamenToner["link"] = stamenBase + "toner/#" + zoom + '/' + mapCentre;
        this.maplinks.stamenTerrain["link"] = stamenBase + "terrain/#" + zoom + '/' + mapCentre;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Here",
    image: "hereLogo16x16.png",
    id: "here",
    prio: 5,
    cat: OutputMaps.category.multidirns,
    maplinks:
    {
        hereMap: {
            name: "Map"
        },
        hereTerrain: {
            name: "Terrain"
        },
        hereSatellite: {
            name: "Satellite"
        },
        hereTraffic: {
            name: "Traffic"
        },
        herePublicTransport: {
            name: "Public Transport"
        }
    },
    generate: function(sourceMapData, view) {
        var hereBase = "https://wego.here.com/";
        var zoom = "12";
        var directions = "";
        var note = "";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "?map=" + displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = "" +
                calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
        }

        var smdDirns = getDirections(sourceMapData);
        if (smdDirns && "route" in smdDirns) {

            var route = "";
            for (rteWpt of smdDirns.route) {
                route += "/";
                if ("address" in rteWpt) {
                    route += rteWpt.address;
                }
                if ("coords" in rteWpt) {
                    route += ":" + rteWpt.coords.lat + "," + rteWpt.coords.lng;
                }
            }

            var mode = "mix";
            if (smdDirns.mode) {
                switch (smdDirns.mode) {
                    case "foot":
                        mode = "walk";
                        break;
                    case "car":
                        mode = "drive";
                        break;
                    case "transit":
                        mode = "publicTransport";
                        break;
                    case "bike":
                        mode = "bicycle";
                }
            }

            directions = "directions/" + mode + route;

            if (smdDirns.route.length > 10) {
                note = "Here limited to 10 waypoints";
            }
        }

        this.maplinks.hereMap["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "normal";
        this.maplinks.hereTerrain["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "terrain";
        this.maplinks.hereSatellite["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "satellite";
        this.maplinks.hereTraffic["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "traffic";
        this.maplinks.herePublicTransport["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "public_transport";

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinks, note);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "Streetmap",
    image: "streetmapLogo16x16.png",
    id: "streetmap",
    prio: 11,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        streetmap: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            var streetmapMapBase = "http://www.streetmap.co.uk/map.srf?";

            var displayedMap = getDisplayedMap(sourceMapData);
            var ll = new LatLon(displayedMap.centreCoords.lat, displayedMap.centreCoords.lng);
            var osLL = CoordTransform.convertWGS84toOSGB36(ll);
            var osGR = OsGridRef.latLongToOsGrid(osLL);
            var mapCentre = "X=" + osGR.easting + "&Y=" + osGR.northing;

            var zoom = 120;
            if ("resolution" in displayedMap) {
                var scale = calculateScaleFromResolution(displayedMap.resolution);
                if (scale < 4000) { zoom = 106; }
                else if (scale < 15000) { zoom = 110; }
                else if (scale < 40000) { zoom = 115; }
                else if (scale < 80000) { zoom = 120; }
                else if (scale < 160000) { zoom = 126; }
                else if (scale < 400000) { zoom = 130; }
                else if (scale < 900000) { zoom = 140; }
                else { zoom = 150; }
            }
            var zoomArg = "Z=" + zoom;

            this.maplinks.streetmap["link"] = streetmapMapBase + mapCentre + "&A=Y&" + zoomArg;

            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
    }
},
{
    site: "GPX Editor",
    image: "gpxed16x16.png",
    id: "gpxeditor",
    cat: OutputMaps.category.special,
    maplinks:
    {
        gpxedmap: {
            name: "Street Map"
        },
        gpxedsatellite: {
            name: "Satellite"
        },
        gpxedosm: {
            name: "OpenStreetMap"
        },
        gpxedocm: {
            name: "OpenCycleMap"
        },
    },
    generate: function(sourceMapData, view) {
        var gpxEditorBase = "http://www.gpxeditor.co.uk/?";
        var zoom = "zoom=12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "location=" + displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat, 1);
            zoom = "zoom=" + zoom;
        }
        this.maplinks.gpxedmap["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=roadmap";
        this.maplinks.gpxedsatellite["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=satellite";
        this.maplinks.gpxedosm["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=OSM";
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            this.maplinks.gpxedos = {
                name: "Ordnance Survey",
                link: gpxEditorBase + mapCentre + '&' + zoom + "&mapType=OS"
            }
        }
        this.maplinks.gpxedocm["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=OCM";

        view.addMapServiceLinks(this.cat, this, this.maplinks, this.note);
    }
},
{
    site: "NGI/IGN",
    image: "ngi_ign_Logo16x16.png",
    id: "ngi_ign",
    prio: 13,
    cat: OutputMaps.category.plain,
    maplinks: {},
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode !== "be") {
            return;
        }

        var ngiBase = "http://www.ngi.be/topomapviewer/public?";
        var that = this;

        var displayedMap = getDisplayedMap(sourceMapData);

        //NGI uses the Lambert 2008 projection, grs80 ellipsoid
        //We use an external service to calculate coordinates from the regular WGS84 lat & long
        $.ajax({
            url: "http://loughrigg.org/wgs84Lambert/wgs84_lambert/"
                + displayedMap.centreCoords.lat + "/" + displayedMap.centreCoords.lng,
        })
        .done(function( data ) {
            var mapCentre = "mapcenter={\"x\":" +
                Math.round(data.easting) + ",\"y\":" + Math.round(data.northing) + "}";

            var level = 4;
            //we get an approximate zoom level from the resolution
            //(the values here were derived by manual inspection)
            if ("resolution" in displayedMap) {
                if (displayedMap.resolution > 1000) { level = 0; }
                else if (displayedMap.resolution > 300) { level = 1; }
                else if (displayedMap.resolution > 150) { level = 2; }
                else if (displayedMap.resolution > 75) { level = 3; }
                else if (displayedMap.resolution > 35) { level = 4; }
                else if (displayedMap.resolution > 18) { level = 5; }
                else if (displayedMap.resolution > 9) { level = 6; }
                else if (displayedMap.resolution > 5) { level = 7; }
                else if (displayedMap.resolution > 2) { level = 8; }
                else if (displayedMap.resolution > 1) { level = 9; }
                else { level = 10; }
            }
            var levelArg = "level=" + level;

            var lang = "";
            //extract the highest priority language (fr or nl) from browser preferences
            browser.i18n.getAcceptLanguages(function (list) {
                for (listLang of list) {
                    if (listLang.match(/^fr/)) {
                        lang = "lang=fr&";
                        break;
                    } else if (listLang.match(/^nl/)) {
                        lang = "lang=nl&";
                        break;
                    }
                }

                var commonLink = ngiBase + lang + levelArg + "&" + mapCentre;

                var linkTopo = encodeURI(
                    commonLink + "&layers={\"autoMap\":true,\"baseMaps\":[[\"cartoweb_topo\",100]],\"aerialMaps\":[],\"overlayMaps\":[]}");

                //some of the resolutions of the classic maps don't work at particular zoom
                //levels - so we select an appropriate one based on the level
                if (level <= 4) {
                    classicName = "Top250";
                    classicURLcode = "TOPO250";
                } else if (level == 5) {
                    classicName = "Top100";
                    classicURLcode = "TOPO100";
                } else if (level <= 7) {
                    classicName = "Top50";
                    classicURLcode = "TOPO50";
                } else {
                    classicName = "Top10";
                    classicURLcode = "TOPO10";
                }

                var linkClassic = encodeURI(
                    commonLink + "&layers={\"autoMap\":true,\"baseMaps\":[[\"" + classicURLcode + "\",100]],\"aerialMaps\":[],\"overlayMaps\":[]}");
                var linkAerial = encodeURI(
                    commonLink + "&layers={\"autoMap\":true,\"baseMaps\":[[\"" + classicURLcode + "\",100]],\"aerialMaps\":[[\"ORTHO COLOR (2013-2015)\",100]],\"overlayMaps\":[]}");

                that.maplinks = {
                    topo: {
                        name: "Topo",
                        link: linkTopo
                    },
                    classic: {
                        name: classicName,
                        link: linkClassic
                    },
                    aerial: {
                        name: "Aerial",
                        link: linkAerial
                    }
                }

                this.note = "Due to NGI/IGN limitations, you should first go to " +
                            "http://www.ngi.be/topomapviewer and accept the " +
                            "conditions.\nThis should then work properly in future.";

                view.addMapServiceLinks(this.cat, that, that.maplinks, this.note);
            });


        });
    }
},
{
    site: "SunCalc",
    image: "suncalcLogo16x16.png",
    id: "suncalc",
    cat: OutputMaps.category.utility,
    maplinks:
    {
        suncalc: {
            name: "Sunrise + sunset times"
        }
    },
    generate: function(sourceMapData, view) {
        var suncalcBase = "http://suncalc.net/#/";
        var zoom = "12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;

        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth()+1;
        var dayOfMonth = now.getDate();
        var hours = now.getHours();
        var mins = now.getMinutes();
        var date = year + "." + month + "." + dayOfMonth;
        var time = hours + ":" + mins;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
        }

        this.maplinks.suncalc["link"] = suncalcBase + mapCentre + "," + zoom + '/' + date + '/' + time;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "TopoZone",
    image: "topozone16x16.png",
    id: "topozone",
    prio: 12,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        topozoneMap: {
            name: "Topographic"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "us") {
            var topozoneBase = "http://www.topozone.com/";
            var zoom = "&zoom=12";
            var displayedMap = getDisplayedMap(sourceMapData);
            var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

            if ("resolution" in displayedMap) {
                zoom = calcStdZoomFromRes(
                        displayedMap.resolution, displayedMap.centreCoords.lat, 1, 16);
                zoom = "&zoom=" + zoom;
            }

            this.maplinks.topozoneMap["link"] = topozoneBase + "map/?" + mapCentre + zoom;

            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
    }
},
{
    site: "SysMaps",
    image: "sysmaps16x16.png",
    id: "sysmaps",
    prio: 14,
    cat: OutputMaps.category.plain,
    maplinks: {},
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            var sysmapsBase = "http://www.sysmaps.co.uk/sysmaps_os.html?";
            var displayedMap = getDisplayedMap(sourceMapData);
            var mapCentre = "!" + displayedMap.centreCoords.lat + "~" + displayedMap.centreCoords.lng;

            this.maplinks["sysmapsOS"] = {
                name: "OS",
                link: sysmapsBase + mapCentre
            }
            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
        else if (sourceMapData.countryCode === "fr") {
            var sysmapsBase = "http://www.sysmaps.co.uk/sysmaps_ign.html?";
            var displayedMap = getDisplayedMap(sourceMapData);
            var mapCentre = "!" + displayedMap.centreCoords.lat + "~" + displayedMap.centreCoords.lng;

            this.maplinks["sysmapsFR_IGN"] = {
                name: "IGN",
                link: sysmapsBase + mapCentre
            }
            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
    }
},
{
    site: "Boulter",
    image: "boulterIcon.png",
    id: "boulter",
    cat: OutputMaps.category.utility,
    maplinks:
    {
        boulterConverter: {
            name: "Coordinate Converter"
        }
    },
    generate: function(sourceMapData, view) {
        var boulterBase = "http://boulter.com/gps/";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "#" + displayedMap.centreCoords.lat + "%2C" + displayedMap.centreCoords.lng;

        this.maplinks.boulterConverter["link"] = boulterBase + mapCentre;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "OpenCycleMap",
    image: "openCycleMapLogo.png",
    id: "openCycleMap",
    prio: 8,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        ocmOpenCycleMap: {
            name: "OpenCycleMap"
        },
        ocmTransport: {
            name: "Transport"
        },
        ocmLandscape: {
            name: "Landscape"
        },
        ocmOutdoors: {
            name: "Outdoors"
        },
        ocmTransportDark: {
            name: "Transport Dark"
        }
    },
    generate: function(sourceMapData, view) {
        var openCycleMapBase = "http://www.opencyclemap.org/?";
        var zoom = "zoom=12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat, 0, 18);
            zoom = "zoom=" + zoom;
        }

        this.maplinks.ocmOpenCycleMap["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=B0000';
        this.maplinks.ocmTransport["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=0B000';
        this.maplinks.ocmLandscape["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=00B00';
        this.maplinks.ocmOutdoors["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=000B0';
        this.maplinks.ocmTransportDark["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=0000B';

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "OpenWeatherMap",
    image: "openWeatherMap16x16.png",
    id: "openweathermap",
    prio: 12,
    cat: OutputMaps.category.utility,
    maplinks:
    {
        owmWeatherMap: {
            name: "Weather Map"
        }
    },
    generate: function(sourceMapData, view) {
        var owmBase = "https://openweathermap.org/weathermap?";
        var zoom = "zoom=6";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat, 1);
            zoom = "zoom=" + zoom;
        }

        this.maplinks.owmWeatherMap["link"] = owmBase + zoom + '&' + mapCentre;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Flickr",
    image: "flickr16x16.png",
    id: "flickr",
    cat: OutputMaps.category.utility,
    maplinks:
    {
        flickr: {
            name: "World map"
        }
    },
    generate: function(sourceMapData, view) {
        var base = "http://www.flickr.com/map/";
        var zoom = "12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "fLat=" + displayedMap.centreCoords.lat + "&fLon=" + displayedMap.centreCoords.lng;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
        }
        zoom = "zl=" + zoom;

        this.maplinks.flickr["link"] = base + "?" + mapCentre + "&" + zoom + "&everyone_nearby=1";

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Where's The Path",
    image: "wtpLogo16x16.png",
    id: "wheresthepath",
    cat: OutputMaps.category.special,
    maplinks:
    {
        wheresthepath: {
            name: "OS & Google Satellite"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            var wtpBase = "https://wtp2.appspot.com/wheresthepath.htm";
            var displayedMap = getDisplayedMap(sourceMapData);
            var mapCentre = "lat=" + displayedMap.centreCoords.lat + "&lon=" + displayedMap.centreCoords.lng;

            if ("resolution" in displayedMap) {
                zoom = calcStdZoomFromRes(
                        displayedMap.resolution, displayedMap.centreCoords.lat);
            }
            var zoomParams = "&lz=" + zoom + "&rz=" + zoom;
            var tiles = "&lt=OS&rt=satellite";
            this.maplinks.wheresthepath["link"] = wtpBase + "?" + mapCentre + zoomParams + tiles;

            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
    }
},
{
    site: "Yandex",
    image: "yandex16x16.png",
    id: "yandex",
    cat: OutputMaps.category.plain,
    maplinks:
    {
        yandexMap: {
            name: "Maps"
        }
    },
    generate: function(sourceMapData, view) {
        var yandexBase = "https://yandex.com/maps/";
        var zoom = "z=6";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = "ll=" + displayedMap.centreCoords.lng + "," + displayedMap.centreCoords.lat;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                    displayedMap.resolution, displayedMap.centreCoords.lat);
            zoom = "z=" + zoom;
        }

        this.maplinks.yandexMap["link"] = yandexBase + "?" + mapCentre + "&" + zoom;

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "CalTopo",
    image: "caltopoLogo16x16.png",
    id: "caltopo",
    cat: OutputMaps.category.plain,
    maplinks:
    {
        caltopo_mbt: {
            name: "MapBuilderTopo"
        },
        caltopo_7_5: {
            name: "7.5' Topo"
        },
        caltopo_aerial_topo: {
            name: "Aerial Topo"
        },
        caltopo_hybrid_sat: {
            name: "Hybrid Satellite"
        }
    },
    generate: function(sourceMapData, view) {
        if ((sourceMapData.countryCode === "us") || (sourceMapData.countryCode === "ca")) {
            var calTopoBase = "http://caltopo.com/map.html";
            var zoom = "z=12";
            var displayedMap = getDisplayedMap(sourceMapData);
            var mapCentre = "ll=" + displayedMap.centreCoords.lat + "," + displayedMap.centreCoords.lng;

            if ("resolution" in displayedMap) {
                zoom = calcStdZoomFromRes(
                        displayedMap.resolution, displayedMap.centreCoords.lat);
                zoom = "z=" + zoom;
            }

            this.maplinks.caltopo_mbt["link"] = calTopoBase + '#' + mapCentre + '&' + zoom + "&b=mbt";
            this.maplinks.caltopo_7_5["link"] = calTopoBase + '#' + mapCentre + '&' + zoom + "&b=t&o=r&n=0.25";
            this.maplinks.caltopo_aerial_topo["link"] = calTopoBase + '#' + mapCentre + '&' + zoom + "&b=sat&o=t&n=0.5";
            this.maplinks.caltopo_hybrid_sat["link"] = calTopoBase + '#' + mapCentre + '&' + zoom + "&b=sat&o=r&n=0.3&a=c,mba";

            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
    }
},
{
    site: "Strava Global Heatmap",
    image: "stravaLogo16x16.png",
    id: "strava",
    cat: OutputMaps.category.special,
    maplinks:
    {
        stravaBike: {
            name: "Bike"
        },
        stravaRun: {
            name: "Run"
        }
    },
    generate: function(sourceMapData, view) {
        var siteBase = "http://labs.strava.com/heatmap/#";
        var zoom = "12";
        var displayedMap = getDisplayedMap(sourceMapData);
        var mapCentre = displayedMap.centreCoords.lng + "/" + displayedMap.centreCoords.lat;

        if ("resolution" in displayedMap) {
            zoom = calcStdZoomFromRes(
                displayedMap.resolution, displayedMap.centreCoords.lat, 1);
        }

        this.maplinks.stravaBike["link"] = siteBase + zoom + "/" + mapCentre + "/blue/bike";
        this.maplinks.stravaRun["link"] = siteBase + zoom + "/" + mapCentre + "/yellow/run";

        view.addMapServiceLinks(this.cat, this, this.maplinks);
    }
},
{
    site: "Geograph",
    image: "geograph16x16.png",
    id: "geograph",
    cat: OutputMaps.category.special,
    maplinks:
    {
        geographMapper: {
            name: "Photo map"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            var siteBase = "http://www.geograph.org.uk/mapper/?";

            var displayedMap = getDisplayedMap(sourceMapData);
            var ll = new LatLon(displayedMap.centreCoords.lat, displayedMap.centreCoords.lng);
            var osLL = CoordTransform.convertWGS84toOSGB36(ll);
            var osGR = OsGridRef.latLongToOsGrid(osLL);
            var mapCentre = "lat=" + osGR.northing + "&lon=" + osGR.easting;

            var zoom = "zoom=2";
            if ("resolution" in sourceMapData) {
                if (displayedMap.resolution < 9) {
                    zoom = "zoom=3";
                } else if (displayedMap.resolution > 100) {
                    zoom = "zoom=0";
                }
            }

            this.maplinks.geographMapper["link"] = siteBase + mapCentre + "&" + zoom + "&layers=BFFFTF&centi=1";

            view.addMapServiceLinks(this.cat, this, this.maplinks);
        }
    }
}
];


