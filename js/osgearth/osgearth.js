/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

var osgearth = {};

osgearth.copyright = '(c) Copyright 2011 Pelican Mapping - http://pelicanmapping.com';
osgearth.instance = 0;
osgearth.version = '0.0.1';
osgearth.log = function(str) {
    if (window.console !== undefined) {
        window.console.log(str);
    } else {
        jQuery("#debug").append(str + "<br>");
    }
};

osgearth.ProxyHost = "proxy.php?url=";

//Makes a URL prepended by the ProxyHost if it's set
osgearth.getURL = function(url) {
    if (osgearth.ProxyHost !== null && window.document.URL.indexOf("file:") === 0) {
        osgearth.ProxyHost = null;
    }
    if (osgearth.ProxyHost !== undefined && osgearth.ProxyHost !== null) {
        url = osgearth.ProxyHost + encodeURIComponent(url);
    }
    return url;
};

