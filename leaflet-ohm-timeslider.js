L.Control.OHMTimeSlider = L.Control.extend({
    options: {
        position: 'bottomright',
        vectorlayer: null, // the L.MapboxGL that this will filter; required
        sourcename: 'osm', // within that vectorlayer, layers with this source will be managed/filtered
        range: null, // the [date, date] range corresponding to the slider's sliding range; default provided in initialize()
        date: null, // the date currently selected by the slider, interpolating over the range; default provided in initialize()
    },

    initialize: function (options={}) {
        L.setOptions(this, options);

        if (! this.options.range) {
            const current_year = (new Date()).getFullYear();
            this.options.range = [`${current_year - 100}-01-01`, `${current_year}-12-31`];
        }

        if (! this.options.date) {
            this.options.date = this.options.range[0];
        }

        // preliminary sanity checks
        if (! this.options.vectorlayer) throw `OHMTimeSlider: missing required vectorlayer`;
        if (! this.isValidDate(this.options.date) ) throw 'OHMTimeSlider: date must be YYYY-MM-DD format';
        if (! this.isValidDate(this.options.range[0]) ) throw 'OHMTimeSlider: range lower date must be YYYY-MM-DD format';
        if (! this.isValidDate(this.options.range[1]) ) throw 'OHMTimeSlider: range upper date must be YYYY-MM-DD format';
    },

    onAdd: function (map) {
        // final sanity check, that the vectorlayer in fact is a MBGL map
        if (! this.options.vectorlayer._glMap) throw 'OHMTimeSlider: vectorlayer is not a MBGL layer, or is not yet initialized';

        // looks good
        // create the container and UI
        const container = L.DomUtil.create('div', 'leaflet-ohm-timeslider');
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const onedaystep = 1 / 365.0;

        container.innerHTML = `
        <div>
            <div>
                Range:
                <input type="text" pattern="\-?\d\d\d\d\-\d\d\-\d\d" class="leaflet-ohm-timeslider-dateinput" data-timeslider="rangemin" placeholder="yyyy-mm-dd" value="${this.options.range[0]}" />
                <input type="text" pattern="\-?\d\d\d\d\-\d\d\-\d\d" class="leaflet-ohm-timeslider-dateinput" data-timeslider="rangemax" placeholder="yyyy-mm-dd" value="${this.options.range[1]}" />
            </div>
            <div>
                Current: <input type="text" pattern="\-?\d\d\d\d\-\d\d\-\d\d" class="leaflet-ohm-timeslider-dateinput" data-timeslider="currentdate" placeholder="yyyy-mm-dd" value="${this.options.date}" />
            </div>
        </div>
        <div>
            <input type="range" min="" max="" step="${onedaystep}" class="leaflet-ohm-timeslider-sliderbar" data-timeslider="slider" />
        </div>
        `;

        // attach events: change, press enter, slide, ...
        this.controls = {};
        this.controls.inputrangeemin = container.querySelector('[data-timeslider="rangemin"]');
        this.controls.inputrangeemax = container.querySelector('[data-timeslider="rangemax"]');
        this.controls.inputdate = container.querySelector('[data-timeslider="currentdate"]');
        this.controls.slider = container.querySelector('[data-timeslider="slider"]');

        L.DomEvent.on(this.controls.inputrangeemin, 'change', () => {
            this.setRange(this.getRange()); // sounds silly, but runs the sanity checks
        });
        L.DomEvent.on(this.controls.inputrangeemax, 'change', () => {
            this.setRange(this.getRange()); // sounds silly, but runs the sanity checks
        });
        L.DomEvent.on(this.controls.inputdate, 'change', () => {
            this.setDate(this.getDate()); // sounds silly, but runs the sanity checks
        });
        L.DomEvent.on(this.controls.slider, 'input', () => {
            this.setDateFromSlider();
        });

        // get started!
        setTimeout(() => {
            this._addDateFiltersToVectorLayers();
            this.refreshUiAndFiltering();
        }, 0.1 * 1000);

        // done
        this._map = map;
        return container;
    },

    onRemove: function () {
        // remove our injected date filters
        this._removeDateFiltersFromVectorLayers();
    },

    //
    // the core functions for the slider and filtering by date inputs
    //
    getDate: function (asdecimal=false) {
        const thedate = this.controls.inputdate.value;
        return asdecimal ? decimaldate.iso2dec(thedate) : thedate;
    },
    getRange: function (asdecimal=false) {
        const therange = [this.controls.inputrangeemin.value, this.controls.inputrangeemax.value];
        if (asdecimal) {
            therange[0] = decimaldate.iso2dec(therange[0]);
            therange[1] = decimaldate.iso2dec(therange[1]);
        }
        return therange;
    },
    setDate: function (newdatestring, redraw=true) {
        // validate, then set the date
        const ymd = newdatestring.split('-');
        if (! this.isValidDate(newdatestring) || ! decimaldate.isvalidmonthday(ymd[0], ymd[1], ymd[2])) {
            console.error(`OHMTimeSlider: setDate() invalid date: ${newdatestring}`);
            newdatestring = this.options.date;
        }
        this.controls.inputdate.value = newdatestring;

        // if the current date is outside of the new range, set the date to the start/end of this range
        // that would implicitly redraw the slider, so also handle the date being in range and trigger the redraw too
        const isoutofrange = this.checkDateOutOfRange();
        if (isoutofrange < 0) this.setRange([newdatestring, this.getRange()[1]], false);
        else if (isoutofrange > 0) this.setRange([this.getRange()[0], newdatestring], false);

        // done updating; refresh UI to this new state, and re-filter
        if (redraw) {
            this.refreshUiAndFiltering();
        }
    },
    setRange: function (newdatepair, redraw=true) {
        // validate, then set the dates
        let newmindate = newdatepair[0];
        let newmaxdate = newdatepair[1];
        let ymdmin = newmindate.split('-');
        let ymdmax = newmaxdate.split('-');

        if (! this.isValidDate(newmaxdate) || ! this.isValidDate(newmindate) || ! decimaldate.isvalidmonthday(ymdmin[0], ymdmin[1], ymdmin[2]) || ! decimaldate.isvalidmonthday(ymdmax[0], ymdmax[1], ymdmax[2])) {
            console.error(`setRange: setRange() invalid range: ${newmindate} - ${newmaxdate}`);
            newmindate = this.options.range[0];
            newmaxdate = this.options.range[1];
            ymdmin = newmindate.split('-');
            ymdmax = newmaxdate.split('-');
        }

        const decmin = decimaldate.iso2dec(newmindate);
        const decmax = decimaldate.iso2dec(newmaxdate);
        if (decmin >= decmax) return console.error(`OHMTimeSlider: setRange() min date must be less than max date: ${newmindate} - ${newmaxdate}`);

        this.controls.inputrangeemin.value = newmindate;
        this.controls.inputrangeemax.value = newmaxdate;

        // if the current date is outside of the new range, set the date to the start/end of this range
        // that would implicitly redraw the slider, so also handle the date being in range and trigger the redraw too
        const isoutofrange = this.checkDateOutOfRange();
        if (isoutofrange < 0) this.setDate(newmaxdate, false);
        else if (isoutofrange > 0) this.setDate(newmindate, false);

        // done updating; refresh UI to this new state, and re-filter
        if (redraw) {
            this.refreshUiAndFiltering();
        }
    },
    setDateFromSlider: function (redraw=true) {
        const newdatestring = decimaldate.dec2iso(this.controls.slider.value);
        this.setDate(newdatestring, redraw);
    },
    refreshUiAndFiltering: function () {
        // redraw the UI, setting the slider to the new date range & selected date
        // then apply filtering

        // adjust the slider and position the handle, to the current range & date
        const decrange = this.getRange(true);
        const deccurrent = this.getDate(true);
        this.controls.slider.min = decrange[0];
        this.controls.slider.max = decrange[1];
        this.controls.slider.value = deccurrent;

        // apply the filtering
        this.applyDateFiltering();
    },
    applyDateFiltering: function () {
        this._applyDateFilterToLayers();
    },

    //
    // the date filtering magic, adding new filter clauses to the vector style's layers
    // and then rewriting them on the fly to show features matching the date range
    //
    _getFilteredVectorLayers () {
        const mapstyle = this.getRealGlMap().getStyle();
        if (! mapstyle.sources[this.options.sourcename]) throw `OHMTimeSlider: vector layer has no source named ${this.options.sourcename}`;

        const filterlayers = mapstyle.layers.filter((layer) => layer.source == this.options.sourcename);
        return filterlayers;
    },
    _addDateFiltersToVectorLayers: function () {
        // inject the osmfilteringclause, ensuring it falls into sequence as filters[1]
        // right now that filter is always true, but filters[1] will be rewritten by _applyDateFilterToLayers() to apply date filtering
        //
        // warning: we are mutating someone else's map style in-place, and they may not be expecting that
        // if they go and apply their own filters later, it could get weird
        const osmfilteringclause = [ 'any', ['>', '1', '0'] ];
        const vecmap = this.getRealGlMap();
        const layers = this._getFilteredVectorLayers();

        layers.forEach(function (layer) {
            const oldfilters = vecmap.getFilter(layer.id);
            layer.oldfiltersbackup = oldfilters;  // keep a backup of the original filters for _removeDateFiltersFromVectorLayers()

            let newfilters;
            if (oldfilters === undefined) {  // no filter at all, so create one
                newfilters = [
                    "all",
                    osmfilteringclause,
                ];
                // console.debug([ `OHMTimeSlider: _setupDateFiltersForLayers() NoFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else if (oldfilters[0] === 'all') {  // all clause; we can just insert our clause into position as filters[1]
                newfilters = oldfilters.slice();
                newfilters.splice(1, 0, osmfilteringclause);
                // console.debug([ `OHMTimeSlider: _setupDateFiltersForLayers() AllFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else if (oldfilters[0] === 'any') {  // any clause; wrap theirs into a giant clause, prepend ours with an all
                newfilters = [
                    "all",
                    osmfilteringclause,
                    [ oldfilters ],
                ];
                // console.debug([ `OHMTimeSlider: _setupDateFiltersForLayers() AnyFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else if (Array.isArray(oldfilters)) {  // an array forming a single, simple-style filtering clause; rewrap as an "all"
                newfilters = [
                    "all",
                    osmfilteringclause,
                    oldfilters
                ];
                // console.debug([ `OHMTimeSlider: _setupDateFiltersForLayers() ArrayFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else {
                // some other condition I had not expected and need to figure out
                console.error(oldfilters);
                throw `OHMTimeSlider: _setupDateFiltersForLayers() got unexpected filtering condition on layer ${layer.id}`;
            }

            // apply the new filter, with the placeholder "eternal features" filter now prepended
            vecmap.setFilter(layer.id, newfilters);
        });
    },
    _removeDateFiltersFromVectorLayers: function () {
        // in _setupDateFiltersForLayers() we rewrote the layers' filters to support date filtering, but we also kept a backup
        // restore that backup now, so the layers are back where they started
        this._getFilteredVectorLayers().forEach((layer) => {
            this.getRealGlMap().setFilter(layer.id, layer.oldfiltersbackup);
        });
    },
    _applyDateFilterToLayers: function () {
        // back in _setupDateFiltersForLayers() we prepended a filtering clause as filters[1] which filters for "eternal" features lacking a OSM ID
        // here in _applyDateFilterToLayers() we add a second part to that, for features with a start_date and end_date fitting our date
        const deccurrent = this.getDate(true);
        const datesubfilter = [
            'all',
            // numerical start/end date either absent (beginning/end of time) or else within range
            [ 'any', ['!has', 'start_decdate'], ['<=', 'start_decdate', deccurrent] ],
            [ 'any', ['!has', 'end_decdate'], ['>=', 'end_decdate', deccurrent] ],
        ];

        const vecmap = this.getRealGlMap();
        const layers = this._getFilteredVectorLayers();
        layers.forEach((layer) => {
            const newfilters = vecmap.getFilter(layer.id).slice();
            newfilters[1][2] = datesubfilter.slice();
            vecmap.setFilter(layer.id, newfilters);
        });
    },

    //
    // other utility functions
    //
    isValidDate: function (datestring) {
        return datestring.match(/^\-?\d\d\d\d\-\d\d\-\d\d$/);
    },
    checkDateOutOfRange: function () {
        // return 0 if the current date is within the current range
        // return -1 if the current date is earlier than the range's min
        // return 1 if the current date is layer than the range's max
        const deccurrent = this.getDate(true);
        const decrange = this.getRange(true);

        if (deccurrent < decrange[0]) return -1;
        else if (deccurrent > decrange[1]) return 1;
        else return 0;
    },
    getRealGlMap: function () {
        return this.options.vectorlayer._glMap;
    },
});
