# OpenHistoricalMap TimeSlider v2

**February 2022, very early prototyping of a new Leaflet-based timeslider control, with an eye to new design and features. Not yet ready for public comment.**

This is the time slider used by OpenHistoricalMap as of late 2022. Unlike the original controls at https://github.com/OpenHistoricalMap/mbgl-timeslider/ and https://github.com/OpenHistoricalMap/mbgltimeslider-leaflet-control this one is written as a proper Leaflet control from the ground up.

For a demonstration, see **index.html**


# Constructor Options

`position` -- The Leaflet position for the control. Defaults to `bottomright`

`vectorlayer` -- The L.MapboxGL instance which this control will manage and filter.

`sourcename` -- Within that vector MapboxGL layer, layers with a `source` matching this will be filtered. Defaults to `'osm'`.

`date` -- The date initially selected by the slider, in ISO format (YYYY-MM-DD). Default will be the earliest date in the `range`.

`range` -- A pair (2-item array) of dates in ISO format (YYYY-MM-DD), which will set the range represented by the slider. Default is 100 years back to the current year.


# Methods

`setDate(yyyymmdd)` -- Set the current date selection. If the date would be outside of the slider's current range, the range wll be adjusted to include this date.

`setRange([yyyymmdd, yyyymmdd])` -- Set the range represented by the slider. If this causes the current date selection to be out of range, the date will be set to the earlier or latest date of the range.


# Development

Fire up a Python CLI web server via `python -m SimpleHTTPServer 9646` or `python3 -m http.server 9646`

You can now point a browser at http://localhost:9646/ and see the demo.
