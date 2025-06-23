//= require timeslider/html
//= require timeslider/translations
//= require timeslider/controls
//= require timeslider/events
//= require timeslider/util

L.Control.OHMTimeSlider = L.Control.extend({
    options: {
        position: 'bottomright',
        vectorLayer: null, // the L.MapboxGL that this will filter; required
        vectorSourceName: 'osm', // within that vectorLayer, layers with this source will be managed/filtered
        range: null, // the [date, date] range corresponding to the slider's sliding range; default provided in initialize()
        date: null, // the date currently selected by the slider, interpolating over the range; default provided in initialize()
        stepInterval: 5, // when autoplaying, how many seconds between ticks
        stepAmount: '100year', // when autoplaying, how far to skip in time per tick
        language: undefined, // language translations from OHMTimeSlider.Translations; specify in constructor, or else will auto-detect
        sliderColorBefore: '#003AFA', // color of the time-slider, left side before the currntly-selected date
        sliderColorAfter: '#668CFF', // color of the time-slider, right side after the currntly-selected date
        onReady: function () {}, // called when control is all initialized and has started filtering the vectorLayer
        onDateChange: function () {}, // called when date is changed
        onRangeChange: function () {}, // called when range is changed
    },

    initialize: function (options={}) {
        L.setOptions(this, options);

        if (! this.options.range) {
            const current_year = (new Date()).getFullYear();
            this.options.range = [`${current_year - 200}-01-01`, `${current_year}-12-31`];
        }

        if (! this.options.date) {
            // Get today's date
            let today = new Date();
            // Subtract 100 years
            today.setFullYear(today.getFullYear() - 100);
            // Format the date as yyyy-mm-dd
            let formattedDate = today.toISOString().split('T')[0];
            this.options.date = formattedDate;
        }

        // preliminary sanity checks
        if (! this.options.vectorLayer) throw `OHMTimeSlider: missing required vectorLayer`;

        if (! isValidDate(this.options.date) ) throw 'OHMTimeSlider: date must be YYYY-MM-DD format';
        if (! isValidDate(this.options.range[0]) ) throw 'OHMTimeSlider: range lower date must be YYYY-MM-DD format';
        if (! isValidDate(this.options.range[1]) ) throw 'OHMTimeSlider: range upper date must be YYYY-MM-DD format';

        // load the language translations, or die
        const lang0 = this.options.language || 'undefined';
        const lang1 = navigator.language;
        const lang2 = navigator.language.substr(0, 2).toLowerCase();
        this._translations = L.Control.OHMTimeSlider.Translations[lang0] || L.Control.OHMTimeSlider.Translations[lang1] || L.Control.OHMTimeSlider.Translations[lang2];
        if (! this._translations) {
            this._translations = L.Control.OHMTimeSlider.Translations['en-US'];
            console.error(`OHMTimeSlider: unknown language, using en-US; options were '${[lang0, lang1, lang2].join(',')}'`);
        }
    },

    onAdd: function (map) {
        // final sanity check, that the vectorLayer in fact is a MBGL map
        if (! this.options.vectorLayer._glMap) throw 'OHMTimeSlider: vectorLayer is not a MBGL layer, or is not yet initialized';

        // some internal constants
        this.constants = {};
        this.constants.onedaystep = 1 / 365.0;
        this.constants.minYear = -4000;
        this.constants.maxYear = (new Date()).getFullYear();

        // internal state of selected range & date
        this.state = {};
        this.state.date = this.options.date;
        this.state.range = this.options.range;

        // the max year to allow in the range picker inputs
        const maxabsyear = Math.max(Math.abs(this.constants.minYear), Math.abs(this.constants.maxYear));

        // the BCE/CE pickers, get their options text from Intl.DateTimeFormat so it matches the displays in formatDateShort() and formatDateLong()
        const text_ce = getTextForCE();
        const text_bce = getTextForBCE();

        // looks good
        // create the main container and the Change Date widget
        const container = L.DomUtil.create('div', 'leaflet-ohm-timeslider');
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        this.container = container;

        container.innerHTML = getControlHTML(this._translations, maxabsyear, text_ce, text_bce, this.constants);

        const datepickermodal = L.DomUtil.create('div', 'leaflet-ohm-timeslider-modal leaflet-ohm-timeslider-datepicker');
        L.DomEvent.disableClickPropagation(datepickermodal);
        L.DomEvent.disableScrollPropagation(datepickermodal);
        this._datepickermodal = datepickermodal;

        datepickermodal.innerHTML = getDatePickerModalHTML(this._translations, maxabsyear, text_ce, text_bce);

        // attach events: change, press enter, slide, play and pause, ...
        this.controls = createControls(container, datepickermodal);
        bindTimeSliderEvents(this);

        // shuffle the layout, swapping the range elements' month & day pickers, to fit their browser's date format M/D/Y or D/M/Y
        // the layout already in place above is M/D/Y so no action needed if that's still the case
        this.preferreddateformat = 'mdy';

        const testdate = new Date(Date.UTC(2000, 11, 31, 12, 0, 0, 0));
        testdate.setFullYear(2000);
        const formatted = new Intl.DateTimeFormat(navigator.languages, {year: 'numeric', month: 'numeric', day: 'numeric'}).format(testdate);
        const dateparts = formatted.split(/\D/);

        if (dateparts.indexOf('31') == 1) this.preferreddateformat = 'mdy';
        else if (dateparts.indexOf('31') == 0) this.preferreddateformat = 'dmy';

        if (this.preferreddateformat == 'dmy') {
            this.controls.rangeminui.insertBefore(this.controls.rangeminday, this.controls.rangeminmonth);
            this.controls.rangeminui.insertBefore(document.createTextNode(' '), this.controls.rangeminmonth);

            this.controls.rangemaxui.insertBefore(this.controls.rangemaxday, this.controls.rangemaxmonth);
            this.controls.rangemaxui.insertBefore(document.createTextNode(' '), this.controls.rangemaxmonth);
        }

        // set up autoplay state
        this.autoplay = {};
        this.autoplay.timer = null; // will become a setInterval(); see autoplayStart() and autoplayPause()
        this.setStepAmount(this.options.stepAmount); // this.autoplay.stepamount
        this.setStepInterval(this.options.stepInterval); // this.autoplay.stepinterval
        this.autoplayPause();

        // get started!
        this.controlExpand();
        setTimeout(() => {
            this._addDateFiltersTovectorLayers();
            this.refreshUiAndFiltering();
            this.options.onReady.call(this);
        }, 0.1 * 1000);

        // done
        this._map = map;
        return container;
    },

    onRemove: function () {
        // stop autoplay if it's running
        this.autoplayPause();

        // remove our injected date filters
        this._removeDateFiltersFromvectorLayers();
    },

    //
    // the core functions for the slider and filtering by date inputs
    //
    getDate: function (asdecimal=false) {
        const thedate = this.state.date;
        return asdecimal ? decimaldate.iso2dec(thedate) : thedate;
    },
    setDate: function (newdatestring, redraw=true) {
        // validate, then set the date
        const ymd = splitYmdParts(newdatestring);
        if (! isValidDate(newdatestring)) {
            console.error(`OHMTimeSlider: setDate() invalid date: ${newdatestring}`);
            return;
        }
        this.state.date = newdatestring;

        // if the current date is outside of the new range, set the date to the start/end of this range
        // that would implicitly redraw the slider, so also handle the date being in range and trigger the redraw too
        const isoutofrange = this.checkDateOutOfRange();
        if (isoutofrange < 0) this.setRange([newdatestring, this.getRange()[1]], false);
        else if (isoutofrange > 0) this.setRange([this.getRange()[0], newdatestring], false);

        // done updating; refresh UI to this new state, and re-filter
        if (redraw) {
            this.refreshUiAndFiltering();
        }

        // call the onDateChange callback
        this.options.onDateChange.call(this, this.getDate());
    },
    getRange: function (asdecimal=false) {
        const therange = this.state.range.slice();
        if (asdecimal) {
            therange[0] = decimaldate.iso2dec(therange[0]);
            therange[1] = decimaldate.iso2dec(therange[1]);
        }
        return therange;
    },
    setRange: function (newdatepair, redraw=true) {
        // validate, then set the date range
        let newmindate = newdatepair[0];
        let newmaxdate = newdatepair[1];
        let ymdmin = splitYmdParts(newmindate);
        let ymdmax = splitYmdParts(newmaxdate);

        if (! isValidDate(newmindate)) {
            console.error(`OHMTimeSlider: setRange() invalid range: ${newmindate} - ${newmaxdate}`);
            return;
        }

        const decmin = decimaldate.iso2dec(newmindate);
        const decmax = decimaldate.iso2dec(newmaxdate);
        if (decmin >= decmax) {
            console.error(`OHMTimeSlider: setRange() min date must be less than max date: ${newmindate} - ${newmaxdate}`);
            return;
        }

        this.state.range[0] = newmindate;
        this.state.range[1] = newmaxdate;

        // if the current date is outside of the new range, set the date to the start/end of this range
        // that would implicitly redraw the slider, so also handle the date being in range and trigger the redraw too
        const isoutofrange = this.checkDateOutOfRange();
        if (isoutofrange < 0) this.setDate(newmaxdate, false);
        else if (isoutofrange > 0) this.setDate(newmindate, false);

        // done updating; refresh UI to this new state, and re-filter
        if (redraw) {
            this.refreshUiAndFiltering();
        }

        // call the onRangeChange callback
        this.options.onRangeChange.call(this, this.getRange());
    },
    setDateFromSlider: function (redraw=true) {
        const newdatestring = decimaldate.dec2iso(this.controls.slider.value);
        this.setDate(newdatestring, redraw);
    },
    setRangeFromSelectors: function () {
        // check that the year isn't out of range; if so, cap it
        let miny = parseInt(this.controls.rangeminyear.value);
        if (this.controls.rangemincebce.value == '-') miny *= -1;
        if (miny < this.constants.minYear) miny = this.constants.minYear;
        if (miny > this.constants.maxYear) miny = this.constants.maxYear;

        let maxy = parseInt(this.controls.rangemaxyear.value);
        if (this.controls.rangemaxcebce.value == '-') maxy *= -1;
        if (maxy < this.constants.minYear) maxy = this.constants.minYear;
        if (maxy > this.constants.maxYear) maxy = this.constants.maxYear;

        const minm = zeroPadToLength(this.controls.rangeminmonth.value, 2);
        const maxm = zeroPadToLength(this.controls.rangemaxmonth.value, 2);

        const mind = zeroPadToLength(this.controls.rangeminday.value, 2);
        const maxd = zeroPadToLength(this.controls.rangemaxday.value, 2);

        // concatenate to make the ISO string, since we already have them as 2-digit month & day, and year can be any number of digits
        // the internal ISO date, if BCE then subtract 1 from abs(year) because ISO 8601 is offset by 1: 0000 is 1 BCE (-1), -0001 is 2 BCE (-2), and so on...
        // conversely refreshUiAndFiltering() will -1 to get from ISO value (-499) to input value (500 BCE)
        const mindate = `${miny > 0 ? miny : miny + 1}-${minm}-${mind}`;
        const maxdate = `${maxy > 0 ? maxy : maxy + 1}-${maxm}-${maxd}`;

        if (! isValidDate(mindate)) return console.error(`OHMTimeSlider setRangeFromSelectors() invalid date: ${mindate}`);
        if (! isValidDate(maxdate)) return console.error(`OHMTimeSlider setRangeFromSelectors() invalid date: ${maxdate}`);

        this.setRange([ mindate, maxdate ]);
        this.setDateRangeFormAsOutOfSync(false);
    },
    adjustDateRangeInputsForSelectedMonthAndYear: function () {
        // cap the day picker to the number of days in that month, accounting for leap years and the CE/BCE picker
        // then trigger a change event, to change their value if it is now out of range
        let miny = parseInt(this.controls.rangeminyear.value);
        if (this.controls.rangemincebce.value == '-') miny *= -1;
        const minm = parseInt(this.controls.rangeminmonth.value);

        let maxy = parseInt(this.controls.rangemaxyear.value);
        if (this.controls.rangemaxcebce.value == '-') maxy *= -1;
        const maxm = parseInt(this.controls.rangemaxmonth.value);

        this.controls.rangeminday.max = decimaldate.daysinmonth(miny, minm);
        this.controls.rangemaxday.max = decimaldate.daysinmonth(maxy, maxm);
        this.controls.rangeminday.dispatchEvent(new Event('change'));
        this.controls.rangemaxday.dispatchEvent(new Event('change'));
    },
    setDateRangeFormAsOutOfSync: function (outofsync) {
        // color the Set button to show that they need to click it
        if (outofsync) {
            this.controls.rangesubmit.classList.add('leaflet-ohm-timeslider-outofsync');
        } else {
            this.controls.rangesubmit.classList.remove('leaflet-ohm-timeslider-outofsync');
        }
    },
    refreshUiAndFiltering: function () {
        // redraw the UI
        // set the range controls to the internal range
        // set the slider to the new date range & selected date
        // apply filtering

        // set the date selectors to show the new range: year, month, day for start & end of range
        const rangeminymd = splitYmdParts(this.state.range[0]);
        const rangemaxymd = splitYmdParts(this.state.range[1]);

        const mincebce = parseInt(rangeminymd[0]) < 0 ? '-' : '+';
        const maxcebce = parseInt(rangemaxymd[0]) < 0 ? '-' : '+';

        // for BCE dates, ISO 8601 is off by 1 from what we want to show: 1 BCE = 0000, 2 BCE = -0001, ... so -1 to the year for display purposes
        // conversely setRangeFromSelectors() will +1 to get from input value (500 BCE) to ISO value (-499)
        let minyshow = parseInt(rangeminymd[0]);
        let maxyshow = parseInt(rangemaxymd[0]);
        if (minyshow < 0) minyshow -= 1;
        if (maxyshow < 0) maxyshow -= 1;

        if (this.controls.rangeminyear.value != rangeminymd[0]) this.controls.rangeminyear.value = Math.abs(minyshow);
        if (this.controls.rangeminmonth.value != rangeminymd[1]) this.controls.rangeminmonth.value = zeroPadToLength(rangeminymd[1], 2);
        if (this.controls.rangeminday.value != rangeminymd[2]) this.controls.rangeminday.value = parseInt(rangeminymd[2]);
        if (this.controls.rangemincebce.value != mincebce) this.controls.rangemincebce.value = mincebce;

        if (this.controls.rangemaxyear.value != rangemaxymd[0]) this.controls.rangemaxyear.value = Math.abs(maxyshow);
        if (this.controls.rangemaxmonth.value != rangemaxymd[1]) this.controls.rangemaxmonth.value = zeroPadToLength(rangemaxymd[1], 2);
        if (this.controls.rangemaxday.value != rangemaxymd[2]) this.controls.rangemaxday.value = parseInt(rangemaxymd[2]);
        if (this.controls.rangemaxcebce.value != maxcebce) this.controls.rangemaxcebce.value = maxcebce;

        // adjust the slider and position the handle, to the current range & date
        const decrange = this.getRange(true);
        const deccurrent = this.getDate(true);
        this.controls.slider.min = decrange[0];
        this.controls.slider.max = decrange[1];
        this.controls.slider.value = deccurrent;

        // add color gradient to the slider to color before & after
        // thanks to https://stackoverflow.com/a/57153340
        const slidevalue = (this.controls.slider.value - this.controls.slider.min) / (this.controls.slider.max - this.controls.slider.min) * 100;
        this.controls.slider.style.background = `linear-gradient(to right, ${this.options.sliderColorBefore} 0%, ${this.options.sliderColorBefore} ${slidevalue}%, ${this.options.sliderColorAfter} ${slidevalue}%, ${this.options.sliderColorAfter} 100%)`;

        // fill in the date readouts, showing the range dates in mm/dd/yyyy format and the current date in long-word fprmat
        const ymdrange = this.getRange();
        const ymdcurrent = this.getDate();
        this.controls.rangestartreadout.innerText = formatDateShort(ymdrange[0]);
        this.controls.rangeendreadout.innerText = formatDateShort(ymdrange[1]);
        this.controls.datereadout.innerText = formatDateLong(ymdcurrent);

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
    _getFilteredvectorLayers () {
        const mapstyle = this.getRealGlMap().getStyle();
        if (! mapstyle.sources[this.options.vectorSourceName]) throw `OHMTimeSlider: vector layer has no source named ${this.options.vectorSourceName}`;

        const filterlayers = mapstyle.layers.filter((layer) => layer.source == this.options.vectorSourceName);
        return filterlayers;
    },
    _addDateFiltersTovectorLayers: function () {
        // inject the osmfilteringclause, ensuring it falls into sequence as filters[1]
        // right now that filter is always true, but filters[1] will be rewritten by _applyDateFilterToLayers() to apply date filtering
        //
        // warning: we are mutating someone else's map style in-place, and they may not be expecting that
        // if they go and apply their own filters later, it could get weird
        const osmfilteringclause = ["==", "nodatefilter", ["literal", "nodatefilter"]];
        const vecmap = this.getRealGlMap();
        const layers = this._getFilteredvectorLayers();

        layers.forEach(function (layer) {
            const oldfilters = vecmap.getFilter(layer.id);
            layer.oldfiltersbackup = oldfilters ? oldfilters.slice() : oldfilters;  // keep a backup of the original filters for _removeDateFiltersFromvectorLayers()

            let newfilters;
            if (oldfilters === undefined) {  // no filter at all, so create one
                newfilters = [
                    "all",
                    osmfilteringclause,
                ];
                // console.debug([ `OHMTimeSlider: _addDateFiltersToVectorLayers() NoFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else if (oldfilters[0] === 'all') {  // all clause; we can just insert our clause into position as filters[1]
                newfilters = oldfilters.slice();
                newfilters.splice(1, 0, osmfilteringclause);
                // console.debug([ `OHMTimeSlider: _addDateFiltersToVectorLayers() AllFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else if (oldfilters[0] === 'any') {  // any clause; wrap theirs into a giant clause, prepend ours with an all
                newfilters = [
                    "all",
                    osmfilteringclause,
                    [ oldfilters ],
                ];
                // console.debug([ `OHMTimeSlider: _addDateFiltersToVectorLayers() AnyFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else if (Array.isArray(oldfilters)) {  // an array forming a single, simple-style filtering clause; rewrap as an "all"
                newfilters = [
                    "all",
                    osmfilteringclause,
                    oldfilters
                ];
                // console.debug([ `OHMTimeSlider: _addDateFiltersToVectorLayers() ArrayFilter ${layer.id}`, oldfilters, newfilters ]);
            }
            else {
                // some other condition I had not expected and need to figure out
                console.error(oldfilters);
                throw `OHMTimeSlider: _addDateFiltersToVectorLayers() got unexpected filtering condition on layer ${layer.id}`;
            }

            // apply the new filter, with the placeholder "eternal features" filter now prepended
            vecmap.setFilter(layer.id, newfilters);
        });
    },
    _removeDateFiltersFromvectorLayers: function () {
        // in _addDateFiltersToVectorLayers() we rewrote the layers' filters to support date filtering, but we also kept a backup
        // restore that backup now, so the layers are back where they started
        const vecmap = this.getRealGlMap();
        this._getFilteredvectorLayers().forEach((layer) => {
            vecmap.setFilter(layer.id, layer.oldfiltersbackup);
        });
    },
    _applyDateFilterToLayers: function () {
        // back in _addDateFiltersToVectorLayers() we prepended a filtering clause as filters[1] which filters for "eternal" features lacking a OSM ID
        // here in _applyDateFilterToLayers() we add a second part to that, for features with a start_date and end_date fitting our date
        // the new date filtering expression is:
        // numerical start date either absent (beginning/end of time) or else within range, and same for numerical end date
        const deccurrent = this.getDate(true);
        const datesubfilter = [
            'all',
            [
                'any',
                ['!', ['has', 'start_decdate']],
                ['<=', ['to-number', ['get', 'start_decdate'], -Infinity], ['literal', deccurrent]]
            ],
            [
                'any',
                ['!', ['has', 'end_decdate']],
                ['>=', ['to-number', ['get', 'end_decdate'], Infinity], ['literal', deccurrent]]
            ],
        ];

        const vecmap = this.getRealGlMap();
        const layers = this._getFilteredvectorLayers();
        layers.forEach((layer) => {
            const newfilters = vecmap.getFilter(layer.id).slice();
            newfilters[1] = datesubfilter.slice();
            vecmap.setFilter(layer.id, newfilters);
        });
    },

    //
    // playback functionality, to automagically move the slider
    //
    autoplayIsRunning: function () {
        return this.autoplay.timer ? true : false;
    },
    getStepAmount: function () {
        return this.autoplay.stepamount;
    },
    setStepAmount: function (newvalue) {
        // make sure this is a valid option
        const isoption = this.controls.stepamount.querySelector(`option[value="${newvalue}"]`);
        if (! isoption) return console.error(`OHMTimeSlider: setStepAmount() invalid option: ${newspeed}`);

        // set the picker and set the internal value
        this.controls.stepamount.value = newvalue;
        this.autoplay.stepamount = newvalue;

        // if we were playing, pause and restart at the new amount & interval
        if (this.autoplayIsRunning()) {
            this.autoplayPause();
            this.autoplayStart();
        }
    },
    getStepInterval: function () {
        return this.autoplay.stepinterval;
    },
    setStepInterval: function (newvalue) {
        // make sure this is a valid option
        const isoption = this.controls.stepinterval.querySelector(`option[value="${newvalue}"]`);
        if (! isoption) return console.error(`OHMTimeSlider: setStepInterval() invalid option: ${newvalue}`);

        // set the picker and set the internal value
        this.controls.stepinterval.value = newvalue;
        this.autoplay.stepinterval = parseFloat(newvalue);

        // if we were playing, pause and restart at the new amount & interval
        if (this.autoplayIsRunning()) {
            this.autoplayPause();
            this.autoplayStart();
        }
    },
    sliderForwardOneStep: function () {
        const step = this.getStepAmount();
        const amount = parseInt( step.match(/^(\d+)(\w+)$/)[1] );
        const unit = step.match(/^(\d+)(\w+)$/)[2];
        const olddate = this.getDate();
        const newdate = timeDelta(olddate, unit, amount);

        const oldvalue = this.controls.slider.value;
        const newvalue = decimaldate.iso2dec(newdate);
        if (newvalue != oldvalue) {
            this.controls.slider.value = newvalue;
            this.controls.slider.dispatchEvent(new Event('input'));
        }
    },
    sliderBackOneStep: function () {
        const step = this.getStepAmount();
        const amount = parseInt( step.match(/^(\d+)(\w+)$/)[1] );
        const unit = step.match(/^(\d+)(\w+)$/)[2];
        const olddate = this.getDate();
        const newdate = timeDelta(olddate, unit, -amount);

        const oldvalue = this.controls.slider.value;
        const newvalue = decimaldate.iso2dec(newdate);
        if (newvalue != oldvalue) {
            this.controls.slider.value = newvalue;
            this.controls.slider.dispatchEvent(new Event('input'));
        }
    },
    setAutoplayFromPickers: function () {
        // peek at the interval & amount select elements, call setStepAmount() and setStepInterval() to match
        this.setStepAmount(this.controls.stepamount.value);
        this.setStepInterval(this.controls.stepinterval.value);
        this.setAutoPlayFormAsOutOfSync();
    },
    setAutoPlayFormAsOutOfSync: function (outofsync) {
        // color the Set button to show that they need to click it
        if (outofsync) {
            this.controls.autoplaysubmit.classList.add('leaflet-ohm-timeslider-outofsync');
        } else {
            this.controls.autoplaysubmit.classList.remove('leaflet-ohm-timeslider-outofsync');
        }
    },
    autoplayStart: function () {
        this.controls.playbutton.style.display = 'none';
        this.controls.pausebutton.style.display = '';
        if (this.autoplay.timer) return; // already running

        this.autoplay.timer = setInterval(() => {
            this.sliderForwardOneStep();
        }, this.getStepInterval() * 1000);
    },
    autoplayPause: function () {
        this.controls.playbutton.style.display = '';
        this.controls.pausebutton.style.display = 'none';
        if (! this.autoplay.timer) return; // not running

        clearInterval(this.autoplay.timer);
        this.autoplay.timer = undefined;
    },

    //
    // expand/collapse the map control
    //
    controlToggle: function () {
        if (this.controlIsExpanded()) {
            this.controlCollapse();
        } else {
            this.controlExpand();
        }
    },
    controlIsExpanded: function () {
        return this.container.classList.contains('leaflet-ohm-timeslider-expanded');
    },
    controlExpand: function () {
        this.container.classList.add('leaflet-ohm-timeslider-expanded');
        this.container.classList.remove('leaflet-ohm-timeslider-collapsed');
    },
    controlCollapse: function () {
        this.container.classList.remove('leaflet-ohm-timeslider-expanded');
        this.container.classList.add('leaflet-ohm-timeslider-collapsed');
    },

    //
    // date picker modal
    //
    datepickerOpen: function () {
        // show the modal
        this._map._container.appendChild(this._datepickermodal);

        // set the date picker UI show the new range: year, month, day, bce/ce
        // for BCE dates, ISO 8601 is off by 1 from what we want to show: 1 BCE = 0000, 2 BCE = -0001, ... so -1 to the year for display purposes
        // conversely datepickerSubmit() will +1 to get from input value (500 BCE) to ISO value (-499)
        const datebits = splitYmdParts(this.getDate());
        const mincebce = parseInt(datebits[0]) < 0 ? '-' : '+';

        let minyshow = parseInt(datebits[0]);
        if (minyshow < 0) minyshow -= 1;

        if (this.controls.datepickeryear.value != datebits[0]) this.controls.datepickeryear.value = Math.abs(minyshow);
        if (this.controls.datepickermonth.value != datebits[1]) this.controls.datepickermonth.value = zeroPadToLength(datebits[1], 2);
        if (this.controls.datepickerday.value != datebits[2]) this.controls.datepickerday.value = parseInt(datebits[2]);
        if (this.controls.datepickercebce.value != mincebce) this.controls.datepickercebce.value = mincebce;

        // focus the month picker for easy access for keyboard users
        this.controls.datepickermonth.focus();
    },
    datepickerClose: function () {
        // hide the modal
        this._map._container.removeChild(this._datepickermodal);

        // focus the picker-open button, since that's probably how we got to the modal to close it
        this.controls.datepickeropen.focus();
    },
    datepickerSubmit: function () {
        // check that the year isn't out of range; if so, cap it
        let year = parseInt(this.controls.datepickeryear.value);
        if (this.controls.datepickercebce.value == '-') year *= -1;
        if (year < this.constants.yearear) year = this.constants.yearear;
        if (year > this.constants.maxYear) year = this.constants.maxYear;

        const month = zeroPadToLength(this.controls.datepickermonth.value, 2);

        const day = zeroPadToLength(this.controls.datepickerday.value, 2);

        // concatenate to make the ISO string, since we already have them as 2-digit month & day, and year can be any number of digits
        // the internal ISO date, if BCE then subtract 1 from abs(year) because ISO 8601 is offset by 1: 0000 is 1 BCE (-1), -0001 is 2 BCE (-2), and so on...
        // conversely datepickerOpen() will -1 to get from ISO value (-499) to input value (500 BCE)
        const yyyymmdd = `${year > 0 ? year : year + 1}-${month}-${day}`;
        if (! isValidDate(yyyymmdd)) return console.error(`OHMTimeSlider datepickerSubmit() invalid date: ${yyyymmdd}`);

        // set the date; this will implicitly set the slider as needed to include the date
        this.setDate(yyyymmdd);

        // close the datepicker
        this.datepickerClose();
    },
    adjustDatePickerInputsForSelectedMonthAndYear: function () {
        // cap the day picker to the number of days in that month, accounting for leap years and the CE/BCE picker
        // then trigger a change event, to change their value if it is now out of range
        let year = parseInt(this.controls.datepickeryear.value);
        if (this.controls.datepickercebce.value == '-') year *= -1;
        const month = parseInt(this.controls.datepickermonth.value);

        this.controls.datepickerday.max = decimaldate.daysinmonth(year, month);
        this.controls.datepickerday.dispatchEvent(new Event('change'));
    },

    //
    // other utility functions
    //
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
        return this.options.vectorLayer._glMap;
    },
    listLanguages: function () {
        const langs = Object.keys(L.Control.OHMTimeSlider.Translations);
        langs.sort();
        return langs;
    },
});


L.Control.OHMTimeSlider.Translations = getTranslations();
