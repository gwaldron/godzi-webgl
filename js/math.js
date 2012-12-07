/**
* ReadyMap/WebGL
* (c) Copyright 2011 Pelican Mapping
* License: LGPL
* http://ReadyMap.org
*/

Math.deg2rad = function(deg) {
    return deg * 0.0174532925;
};

Math.rad2deg = function(rad) {
    return rad * 57.2957795;
};

Math.clamp = function(x, min, max) {
    if (x < min)
        return min;
    else if (x > max)
        return max;
    else
        return x;
};

Math.log10 = function(n) {
    return Math.log(n) / Math.LN10;
};

Math.powFast = function(x, y) {
    return x / (x + y - y * x);
};

Math.smoothStepInterp = function(t) {
    return (t * t) * (3.0 - 2.0 * t);
};

Math.smootherStepInterp = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
};

Math.accelerationInterp = function(t, a) {
    return a == 0 ? t : a > 0 ? Math.powFast(t, a) : 1.0 - Math.powFast(1.0 - t, -a);
};