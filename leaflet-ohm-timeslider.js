L.Control.OHMTimeSlider = L.Control.extend({
    options: {
        position: 'bottomright',
        vectorlayer: null, // the L.MapboxGL that this will filter; required
        sourcename: 'osm', // within that vectorlayer, layers with this source will be managed/filtered
        range: null, // the [date, date] range corresponding to the slider's sliding range; default provided in initialize()
        date: null, // the date currently selected by the slider, interpolating over the range; default provided in initialize()
        stepspeed: 1, // the default stepspeed selection
        language: 'en', // default language translations from OHMTimeSlider.Translations
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

        // load the language translations, or die
        this._translations = L.Control.OHMTimeSlider.Translations[this.options.language];
        if (! this._translations) throw `OHMTimeSlider: unknown language '${this.options.language}'`;
    },

    onAdd: function (map) {
        // final sanity check, that the vectorlayer in fact is a MBGL map
        if (! this.options.vectorlayer._glMap) throw 'OHMTimeSlider: vectorlayer is not a MBGL layer, or is not yet initialized';

        // some internal constants
        this.constants = {};
        this.constants.onedaystep = 1 / 365.0;

        // looks good
        // create the container and UI
        const container = L.DomUtil.create('div', 'leaflet-ohm-timeslider');
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        container.innerHTML = `
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" />
        <div>
            <div>
                ${this._translations.rangepicker_title}:
                <input type="text" pattern="\-?\d\d\d\d\-\d\d\-\d\d" class="leaflet-ohm-timeslider-dateinput" data-timeslider="rangemin" placeholder="yyyy-mm-dd" value="${this.options.range[0]}" />
                <input type="text" pattern="\-?\d\d\d\d\-\d\d\-\d\d" class="leaflet-ohm-timeslider-dateinput" data-timeslider="rangemax" placeholder="yyyy-mm-dd" value="${this.options.range[1]}" />
            </div>
            <div>
                ${this._translations.currentdate_title}:
                <span data-timeslider="prev" role="button" tabindex="0" class="fa fa-minus" title="${this._translations.backwardbutton_title}"></span>
                &nbsp;
                <input type="text" pattern="\-?\d\d\d\d\-\d\d\-\d\d" class="leaflet-ohm-timeslider-dateinput" data-timeslider="currentdate" placeholder="yyyy-mm-dd" value="${this.options.date}" />
                &nbsp;
                <span data-timeslider="next" role="button" tabindex="0" class="fa fa-plus" title="${this._translations.forwardbutton_title}"></span>
            </div>
        </div>
        <div>
            <input type="range" min="" max="" step="${this.constants.onedaystep}" class="leaflet-ohm-timeslider-sliderbar" data-timeslider="slider" />
        </div>
        <div>
            ${this._translations.stepspeed_title}:
            <select data-timeslider="stepspeed">
                <option value="1">${this._translations.stepspeed_1day}</option>
                <option value="30">${this._translations.stepspeed_30day}</option>
                <option value="365">${this._translations.stepspeed_1year}</option>
                <option value="1825">${this._translations.stepspeed_5year}</option>
                <option value="3650">${this._translations.stepspeed_10year}</option>
                <option value="9125">${this._translations.stepspeed_25year}</option>
                <option value="36500">${this._translations.stepspeed_100year}</option>
            </select>
            &nbsp;
            <span data-timeslider="play" role="button" tabindex="0" class="fa fa-play" title="${this._translations.playbutton_title}"></span>
            <span data-timeslider="pause" role="button" tabindex="0" class="fa fa-pause" title="${this._translations.pausebutton_title}"></span>
        </div>
        `;

        // attach events: change, press enter, slide, play and pause, ...
        this.controls = {};
        this.controls.inputrangeemin = container.querySelector('[data-timeslider="rangemin"]');
        this.controls.inputrangeemax = container.querySelector('[data-timeslider="rangemax"]');
        this.controls.inputdate = container.querySelector('[data-timeslider="currentdate"]');
        this.controls.slider = container.querySelector('[data-timeslider="slider"]');
        this.controls.playbutton = container.querySelector('[data-timeslider="play"]');
        this.controls.pausebutton = container.querySelector('[data-timeslider="pause"]');
        this.controls.playnext = container.querySelector('[data-timeslider="next"]');
        this.controls.playprev = container.querySelector('[data-timeslider="prev"]');
        this.controls.stepspeed = container.querySelector('[data-timeslider="stepspeed"]');

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
        L.DomEvent.on(this.controls.playbutton, 'click', () => {
            this.autoplayStart();
        });
        L.DomEvent.on(this.controls.playbutton, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.pausebutton, 'click', () => {
            this.autoplayPause();
        });
        L.DomEvent.on(this.controls.pausebutton, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.playnext, 'click', () => {
            this.autoplayNext();
        });
        L.DomEvent.on(this.controls.playnext, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.playprev, 'click', () => {
            this.autoplayPrevious();
        });
        L.DomEvent.on(this.controls.playprev, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });

        // get started!
        setTimeout(() => {
            this._addDateFiltersToVectorLayers();
            this.refreshUiAndFiltering();
        }, 0.1 * 1000);

        this.autoplaytimer = null; // will become a setInterval(); see autoplayStart() and autoplayPause()
        this.autoplayPause();
        this.setStepSpeed(this.options.stepspeed);

        // done
        this._map = map;
        return container;
    },

    onRemove: function () {
        // stop autoplay if it's running
        this.autoplayPause();

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
            layer.oldfiltersbackup = oldfilters ? oldfilters.slice() : oldfilters;  // keep a backup of the original filters for _removeDateFiltersFromVectorLayers()

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
        const vecmap = this.getRealGlMap();
        this._getFilteredVectorLayers().forEach((layer) => {
            vecmap.setFilter(layer.id, layer.oldfiltersbackup);
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
    // playback functionality, to automagically move the slider
    //
    getAutoplayRunning: function () {
        return this.autoplaytimer ? true : false;
    },
    getStepSpeed: function () {
        return parseInt(this.controls.stepspeed.value);
    },
    setStepSpeed: function (newspeed) {
        // make sure this is a valid option
        const isoption = this.controls.stepspeed.querySelector(`option[value="${newspeed}"]`);
        if (! isoption) return console.error(`OHMTimeSlider: setStepSpeed() invalid speed option: ${newspeed}`);

        // go ahead and set it
        this.controls.stepspeed.value = newspeed;
    },
    autoplayStart: function () {
        this.controls.playbutton.style.display = 'none';
        this.controls.pausebutton.style.display = '';
        if (this.autoplaytimer) return; // already running

        this.autoplaytimer = setInterval(() => {
            this.autoplayNext();
        }, 1 * 1000);
    },
    autoplayPause: function () {
        this.controls.playbutton.style.display = '';
        this.controls.pausebutton.style.display = 'none';
        if (! this.autoplaytimer) return; // not running
        clearInterval(this.autoplaytimer);
        this.autoplaytimer = undefined;
    },
    autoplayNext: function () {
        const daystojump = this.getStepSpeed();
        const slidethismuch = this.constants.onedaystep * daystojump;

        const oldvalue = this.controls.slider.value;
        this.controls.slider.value = parseFloat(this.controls.slider.value) + slidethismuch;

        if (this.controls.slider.value != oldvalue) {
            this.controls.slider.dispatchEvent(new Event('input'));
        }
    },
    autoplayPrevious: function () {
        const daystojump = parseInt(this.controls.stepspeed.value);
        const slidethismuch = this.constants.onedaystep * daystojump;

        const oldvalue = this.controls.slider.value;
        this.controls.slider.value = parseFloat(this.controls.slider.value) - slidethismuch;

        if (this.controls.slider.value != oldvalue) {
            this.controls.slider.dispatchEvent(new Event('input'));
        }
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


L.Control.OHMTimeSlider.Translations = {};

L.Control.OHMTimeSlider.Translations['en'] = L.Control.OHMTimeSlider.Translations['en-US'] = {
    rangepicker_title: "Range",
    currentdate_title: "Date",
    stepspeed_title: "Step speed",
    playbutton_title: "Play",
    pausebutton_title: "Pause",
    stepspeed_1day: "1 day",
    stepspeed_30day: "30 days",
    stepspeed_1year: "1 year",
    stepspeed_5year: "5 years",
    stepspeed_10year: "10 years",
    stepspeed_25year: "25 years",
    stepspeed_100year: "100 years",
    forwardbutton_title: "Go forward one step",
    backwardbutton_title: "Go backward one step",
};

L.Control.OHMTimeSlider.Translations['es'] = {
    rangepicker_title: "Rango",
    currentdate_title: "Fecha",
    stepspeed_title: "Velocidad de paso",
    playbutton_title: "Correr",
    pausebutton_title: "Parar",
    stepspeed_1day: "1 día",
    stepspeed_30day: "30 días",
    stepspeed_1year: "1 año",
    stepspeed_5year: "5 años",
    stepspeed_10year: "10 años",
    stepspeed_25year: "25 años",
    stepspeed_100year: "100 años",
    forwardbutton_title: "Avanzar un paso",
    backwardbutton_title: "Retroceder un paso",
};
