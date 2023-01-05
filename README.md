# OpenHistoricalMap TimeSlider v2

This is the time slider used by OpenHistoricalMap as of late 2022.

Unlike the original controls at https://github.com/OpenHistoricalMap/mbgl-timeslider/ and https://github.com/OpenHistoricalMap/mbgltimeslider-leaflet-control this one is written as a proper Leaflet control from the ground up.

For a demonstration, see **index.html** and https://openhistoricalmap.github.io/leaflet-ohm-timeslider-v2/


# Constructor Options

`position` -- The Leaflet position for the control. Defaults to `bottomright`. It is recommended to keep this, as the control has an arrow sticking off the top/left.

`vectorLayer` -- The L.MapboxGL instance which this control will manage and filter.

`vectorSourceName` -- Within that vector MapboxGL layer, layers with a `source` matching this will be filtered. Defaults to `'osm'`.

`date` -- The date initially selected by the slider, in ISO format (YYYY-MM-DD). Default will be the earliest date in the `range`.

`range` -- A pair (2-item array) of dates in ISO format (YYYY-MM-DD), which will set the range represented by the slider. Default is 100 years back to the current year.

`stepInterval` -- Set the Speed setting to this value on startup. See `setStepInterval()` for allowed values.

`stepAmount` -- Set the Time Jump setting to this value on startup. See `setStepAmount()` for allowed values.

`language` -- Display labels and tooltips in the given language. See `listLanguages()` for a list of options.

`onReady: function ()` -- A callback function which will be called when the OHMTimeSlider is done initializing, layers have been set up with their new date filters, and the date ranges and selection have been set. Within the callback function, `this` will refer to the OHMTimeSlider.

`onDateChange: function (isodate)` -- A callback function which will be called when the date selection changes. The newly-selected date (ISO string) will be passed as a param. Within the callback function, `this` will refer to the OHMTimeSlider.

`onRangeChange: function ([date1, date2])` -- A callback function which will be called when the date range changes. The newly-available range (2-item list of ISO strings) will be passed as a param. Within the callback function, `this` will refer to the OHMTimeSlider.


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

`autoplayStart()` -- Start automatically advancing the slider ("auto-play"). This is effectively the same as clicking the Skip Forward button every few seconds.

`autoplayPause()` -- Stop automatically advancing the slider ("auto-play").

`autoplayIsRunning()` -- Return true/false indicating whether the timeline's auto-play mode is running.

`listLanguages()` -- Return a list of the supported language translations for use with the `language` option.


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

# Localization

This code base is separate from the main ohm-website and has a functional but rudimentary localization setup, with translations in Javascript as here: https://github.com/OpenHistoricalMap/leaflet-ohm-timeslider-v2/blob/main/leaflet-ohm-timeslider.js#L977-L1016

We welcome PRs with new languages added to this, or if you're not sure how to do that, you can also file an issue over at https://github.com/OpenHistoricalMap/issues/issues with suggested translations for the following values:

```
    close: "",
    expandcollapse_title: "",
    slider_description: "",
    daterange_min_month_title: "",
    daterange_min_day_title: "",
    daterange_min_year_title: "",
    daterange_max_month_title: "",
    daterange_max_day_title: "",
    daterange_max_year_title: "",
    daterange_submit_text: "",
    daterange_submit_title: "",
    range_title: "",
    stepamount_title: "",
    stepamount_selector_title: "",
    stepamount_1day: "",
    stepamount_1month: "",
    stepamount_1year: "",
    stepamount_10year: "",
    stepamount_100year: "",
    stepinterval_title: "",
    stepinterval_selector_title: "",
    stepinterval_5sec: "",
    stepinterval_2sec: "",
    stepinterval_1sec: "",
    playbutton_title: "",
    pausebutton_title: "",
    forwardbutton_title: "",
    backwardbutton_title: "",
    resetbutton_title: "",
    autoplay_submit_text: "",
    autoplay_submit_title: "",
    datepicker_submit_text: "",
    datepicker_cancel_text: "",
    datepicker_title: "",
    datepicker_format_text: "",
    datepicker_text: "",
    months: ['','',...],
    bce: "",
    dateformat: '',
```