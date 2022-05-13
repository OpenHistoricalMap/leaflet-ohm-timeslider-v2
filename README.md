# OpenHistoricalMap TimeSlider v2

**February 2022, very early prototyping of a new Leaflet-based timeslider control, with an eye to new design and features. Not yet ready for public comment.**

This is the time slider used by OpenHistoricalMap as of late 2022. Unlike the original controls at https://github.com/OpenHistoricalMap/mbgl-timeslider/ and https://github.com/OpenHistoricalMap/mbgltimeslider-leaflet-control this one is written as a proper Leaflet control from the ground up.

For a demonstration, see **index.html** and https://openhistoricalmap.github.io/leaflet-ohm-timeslider-v2/


# Constructor Options

`position` -- The Leaflet position for the control. Defaults to `bottomright`. It is recommended to keep this, as the control has an arrow sticking off the top/left.

`vectorLayer` -- The L.MapboxGL instance which this control will manage and filter.

`vectorSourceName` -- Within that vector MapboxGL layer, layers with a `source` matching this will be filtered. Defaults to `'osm'`.

`date` -- The date initially selected by the slider, in ISO format (YYYY-MM-DD). Default will be the earliest date in the `range`.

`range` -- A pair (2-item array) of dates in ISO format (YYYY-MM-DD), which will set the range represented by the slider. Default is 100 years back to the current year.

`stepInterval` -- Set the Speed setting to this value on startup. See `setStepInterval()` for allowed values.

`stepAmount` -- Set the Time Jump setting to this value on startup. See `setStepAmount()` for allowed values.

`language` -- Display labels and tooltips in the given language. See `Object.keys(L.Control.OHMTimeSlider.Translations)` for a list of options.


# Methods

`getDate(asdecimal=false)` -- Return the currently-selected date on the slider. The date will be in ISO YYYY-MM-DD format, unless `decimaldate` is given to get it as a decimaldate number instead.

`setDate(yyyymmdd, redraw=true)` -- Set the currently-selected date on the slider. The date should be given in ISO YYYY-MM-DD format.

`getRange(asdecimal=false)` -- Return the date range represented by the slider, as a two-item array `[date, date]`. The dates will be in ISO YYYY-MM-DD format, unless `decimaldate` is given to get them as decimaldate numbers instead.

`setRange([yyyymmdd, yyyymmdd], redraw=true)` -- Set the date range represented by the slider. The dates should be given as a two-item array `[date, date]` and should be in ISO YYYY-MM-DD format.

`sliderForwardOneStep()` -- Move the slider forward in time, by an amount indicated by the Time Jump selector.

`sliderBackOneStep()` -- Move the slider backward in time, by an amount indicated by the Time Jump selector.

`getStepInterval()` -- Return the number of seconds in between auto-play advancing to the next step (the Speed selector).

`setStepInterval(newvalue)` -- Set the number of seconds in between auto-play advancing to the next step (the Speed selector). This must be one of the options offered in the Speed selector: `1` `2` `5`

`getStepAmount()` -- Return the amount of time along the slider that the forward and backward buttons will advance on each step, and that auto-play will advance on each step (the Time Jump selector). This will be one of the values accepted by `setStepAmount()`

`setStepAmount(newvalue)` -- Return the amount of time along the slider that the forward and backward buttons will advance on each step, and that auto-play will advance on each step (the Time Jump selector). This must be one of the options offered in the Time Jump selector: `1day` `1month` `1year` `10year` `100year`

`autoplayStart()` -- Start automatically advancing the slider ("auto-play"). GDA This is effectively the same as clicking the Skip Forward button every few seconds.

`autoplayPause()` -- Stop automatically advancing the slider ("auto-play").

`autoplayIsRunning()` -- Return true/false indicating whether the timeline's auto-play mode is running.


# Development

Fire up a Python CLI web server via `python -m SimpleHTTPServer 9646` or `python3 -m http.server 9646`

You can now point a browser at http://localhost:9646/ and see the demo.

To create the minified JS/CSS files, use whatever tools you prefer such as UglifyJS and UglifyCSS.

Installation:
```
nvm use 16.9.0
npm install uglify-js uglifycss -g
```

Usage:
```
uglifycss --output leaflet-ohm-timeslider.min.css leaflet-ohm-timeslider.css
uglifyjs --keep-fargs --keep-fnames --output leaflet-ohm-timeslider.min.js leaflet-ohm-timeslider.js
uglifyjs --keep-fargs --keep-fnames --output decimaldate.min.js decimaldate.js
```
