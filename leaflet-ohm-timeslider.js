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
            this.options.range = [`${current_year - 100}-01-01`, `${current_year}-12-31`];
        }

        if (! this.options.date) {
            this.options.date = this.options.range[0];
        }

        // preliminary sanity checks
        if (! this.options.vectorLayer) throw `OHMTimeSlider: missing required vectorLayer`;
        if (! this.isValidDate(this.options.date) ) throw 'OHMTimeSlider: date must be YYYY-MM-DD format';
        if (! this.isValidDate(this.options.range[0]) ) throw 'OHMTimeSlider: range lower date must be YYYY-MM-DD format';
        if (! this.isValidDate(this.options.range[1]) ) throw 'OHMTimeSlider: range upper date must be YYYY-MM-DD format';

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

        // looks good
        // create the main container and the Change Date widget
        const container = L.DomUtil.create('div', 'leaflet-ohm-timeslider');
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        this.container = container;

        container.innerHTML = `
        <div class="leaflet-ohm-timeslider-expandcollapse" data-timeslider="expandcollapse" role="button" tabindex="0" title="${this._translations.expandcollapse_title}"><span></span></div>
        <div class="leaflet-ohm-timeslider-rangeinputs">
            <div class="leaflet-ohm-timeslider-rangeinputs-title">
                <strong>${this._translations.range_title}</strong>
            </div>
            <div class="leaflet-ohm-timeslider-rangeinputs-mindate">
                <select data-timeslider="rangeminmonth" aria-label="${this._translations.daterange_min_month_title}">
                    <option value="01">${this._translations.months[0]}</option>
                    <option value="02">${this._translations.months[1]}</option>
                    <option value="03">${this._translations.months[2]}</option>
                    <option value="04">${this._translations.months[3]}</option>
                    <option value="05">${this._translations.months[4]}</option>
                    <option value="06">${this._translations.months[5]}</option>
                    <option value="07">${this._translations.months[6]}</option>
                    <option value="08">${this._translations.months[7]}</option>
                    <option value="09">${this._translations.months[8]}</option>
                    <option value="10">${this._translations.months[9]}</option>
                    <option value="11">${this._translations.months[10]}</option>
                    <option value="12">${this._translations.months[11]}</option>
                </select>
                <input type="number" data-timeslider="rangeminday" min="1" max="31" step="1"  class="leaflet-ohm-timeslider-rangeinputs-day" aria-label="${this._translations.daterange_min_day_title}" />
                <input type="number" data-timeslider="rangeminyear" min="${this.constants.minYear}" max="${this.constants.maxYear}" step="1" class="leaflet-ohm-timeslider-rangeinputs-year" aria-label="${this._translations.daterange_min_year_title}" />
            </div>
            <div class="leaflet-ohm-timeslider-rangeinputs-separator">
                -
            </div>
            <div class="leaflet-ohm-timeslider-rangeinputs-maxdate">
                <select data-timeslider="rangemaxmonth" aria-label="${this._translations.daterange_max_month_title}">
                    <option value="01">${this._translations.months[0]}</option>
                    <option value="02">${this._translations.months[1]}</option>
                    <option value="03">${this._translations.months[2]}</option>
                    <option value="04">${this._translations.months[3]}</option>
                    <option value="05">${this._translations.months[4]}</option>
                    <option value="06">${this._translations.months[5]}</option>
                    <option value="07">${this._translations.months[6]}</option>
                    <option value="08">${this._translations.months[7]}</option>
                    <option value="09">${this._translations.months[8]}</option>
                    <option value="10">${this._translations.months[9]}</option>
                    <option value="11">${this._translations.months[10]}</option>
                    <option value="12">${this._translations.months[11]}</option>
                </select>
                <input type="number" data-timeslider="rangemaxday" min="1" max="31" step="1" class="leaflet-ohm-timeslider-rangeinputs-day" aria-label="${this._translations.daterange_max_day_title}" />
                <input type="number" data-timeslider="rangemaxyear" min="${this.constants.minYear}" max="${this.constants.maxYear}" step="1" class="leaflet-ohm-timeslider-rangeinputs-year" aria-label="${this._translations.daterange_max_year_title}" />
            </div>
            <div class="leaflet-ohm-timeslider-rangeinputs-submit">
                <button data-timeslider="rangesubmit" aria-label="${this._translations.daterange_submit_title}">${this._translations.daterange_submit_text}</button>
            </div>
        </div>
        <div class="leaflet-ohm-timeslider-datereadout">
            <span data-timeslider="datereadout"></span>
            <button type="button" data-timeslider="datepickeropen" aria-label="${this._translations.datepicker_title}"></button>
        </div>
        <div class="leaflet-ohm-timeslider-slider-wrap">
            <div>
                ${this.formatDateShortPlaceHolder()}
                <br/>
                <span data-timeslider="rangestartreadout"></span>
            </div>
            <div>
                <input type="range" min="" max="" step="${this.constants.onedaystep}" class="leaflet-ohm-timeslider-sliderbar" data-timeslider="slider" aria-label="${this._translations.slider_description}" />
            </div>
            <div>
                ${this.formatDateShortPlaceHolder()}
                <br/>
                <span data-timeslider="rangeendreadout"></span>
            </div>
        </div>
        <div class="leaflet-ohm-timeslider-playcontrols-wrap">
            <div class="leaflet-ohm-timeslider-playcontrols-buttons">
                <span data-timeslider="reset" role="button" tabindex="0" title="${this._translations.resetbutton_title}"></span>
                <span data-timeslider="play" role="button" tabindex="0" title="${this._translations.playbutton_title}"></span>
                <span data-timeslider="pause" role="button" tabindex="0" title="${this._translations.pausebutton_title}"></span>
                <span data-timeslider="prev" role="button" tabindex="0" title="${this._translations.backwardbutton_title}"></span>
                <span data-timeslider="next" role="button" tabindex="0" title="${this._translations.forwardbutton_title}"></span>
            </div>
            <div class="leaflet-ohm-timeslider-playcontrols-settings">
                <div>
                    <strong>${this._translations.stepamount_title}</strong>
                    <select data-timeslider="stepamount" aria-label="${this._translations.stepamount_selector_title}">
                        <option value="1day">${this._translations.stepamount_1day}</option>
                        <option value="1month">${this._translations.stepamount_1month}</option>
                        <option value="1year">${this._translations.stepamount_1year}</option>
                        <option value="10year">${this._translations.stepamount_10year}</option>
                        <option value="100year">${this._translations.stepamount_100year}</option>
                    </select>
                </div>
                <div>
                    <strong>${this._translations.stepinterval_title}</strong>
                    <select data-timeslider="stepinterval" aria-label="${this._translations.stepinterval_selector_title}">
                        <option value="5">${this._translations.stepinterval_5sec}</option>
                        <option value="2">${this._translations.stepinterval_2sec}</option>
                        <option value="1">${this._translations.stepinterval_1sec}</option>
                    </select>
                </div>
                <div>
                    <button data-timeslider="autoplaysubmit" aria-label="${this._translations.autoplay_submit_title}">${this._translations.autoplay_submit_text}</button>
                </div>
            </div>
        </div>
        `;

        const datepickermodal = L.DomUtil.create('div', 'leaflet-ohm-timeslider-modal leaflet-ohm-timeslider-datepicker');
        L.DomEvent.disableClickPropagation(datepickermodal);
        L.DomEvent.disableScrollPropagation(datepickermodal);
        this._datepickermodal = datepickermodal;

        datepickermodal.innerHTML = `
        <div class="leaflet-ohm-timeslider-modal-background"></div>
        <div class="leaflet-ohm-timeslider-modal-panel">
            <div class="leaflet-ohm-timeslider-modal-content">
                <div class="leaflet-ohm-timeslider-modal-head">
                    <h4>${this._translations.datepicker_title}</h4>
                    <span class="leaflet-ohm-timeslider-modal-close" aria-label="${this._translations.close}" data-timeslider="datepickerclose">&times;</span>
                </div>
                <hr />
                <div class="leaflet-ohm-timeslider-modal-body">
                    <p>${this._translations.datepicker_text}</p>
                    <p><input data-timeslider="datepicker" type="text" placeholder="${this.formatDateShortPlaceHolder()}" value="" autocomplete="off" /></p>
                    <p>${this._translations.datepicker_format_text}: ${this.formatDateShortPlaceHolder()}, yyyy-mm-dd</p>
                    <hr />
                </div>
                <div class="leaflet-ohm-timeslider-modal-foot">
                    <button data-timeslider="datepickersubmit">${this._translations.datepicker_submit_text}</button>
                    <button data-timeslider="datepickercancel">${this._translations.datepicker_cancel_text}</button>
                </div>
            </div>
        </div>
        `;

        // attach events: change, press enter, slide, play and pause, ...
        this.controls = {};
        this.controls.slider = container.querySelector('[data-timeslider="slider"]');
        this.controls.rangeminmonth = container.querySelector('select[data-timeslider="rangeminmonth"]');
        this.controls.rangeminday = container.querySelector('input[data-timeslider="rangeminday"]');
        this.controls.rangeminyear = container.querySelector('input[data-timeslider="rangeminyear"]');
        this.controls.rangemaxmonth = container.querySelector('select[data-timeslider="rangemaxmonth"]');
        this.controls.rangemaxday = container.querySelector('input[data-timeslider="rangemaxday"]');
        this.controls.rangemaxyear = container.querySelector('input[data-timeslider="rangemaxyear"]');
        this.controls.rangesubmit = container.querySelector('button[data-timeslider="rangesubmit"]');
        this.controls.playbutton = container.querySelector('[data-timeslider="play"]');
        this.controls.pausebutton = container.querySelector('[data-timeslider="pause"]');
        this.controls.playnext = container.querySelector('[data-timeslider="next"]');
        this.controls.playprev = container.querySelector('[data-timeslider="prev"]');
        this.controls.playreset = container.querySelector('[data-timeslider="reset"]');
        this.controls.stepamount = container.querySelector('[data-timeslider="stepamount"]');
        this.controls.stepinterval = container.querySelector('[data-timeslider="stepinterval"]');
        this.controls.autoplaysubmit = container.querySelector('[data-timeslider="autoplaysubmit"]');
        this.controls.rangestartreadout = container.querySelector('[data-timeslider="rangestartreadout"]');
        this.controls.rangeendreadout = container.querySelector('[data-timeslider="rangeendreadout"]');
        this.controls.datereadout = container.querySelector('[data-timeslider="datereadout"]');
        this.controls.expandcollapse = container.querySelector('[data-timeslider="expandcollapse"]');
        this.controls.datepickeropen = container.querySelector('button[data-timeslider="datepickeropen"]');
        this.controls.datepickerclose = datepickermodal.querySelector('span[data-timeslider="datepickerclose"]');
        this.controls.datepickerdatebox = datepickermodal.querySelector('input[data-timeslider="datepicker"]');
        this.controls.datepickersubmit = datepickermodal.querySelector('button[data-timeslider="datepickersubmit"]');
        this.controls.datepickercancel = datepickermodal.querySelector('button[data-timeslider="datepickercancel"]');

        L.DomEvent.on(this.controls.rangesubmit, 'click', () => {
            this.setRangeFromSelectors();
        });
        L.DomEvent.on(this.controls.rangesubmit, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.rangeminmonth, 'input', () => {
            this.adjustDateRangeInputsForSelectedMonthAndYear();
            this.setDateRangeFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.rangeminyear, 'input', () => {
            this.adjustDateRangeInputsForSelectedMonthAndYear();
            this.setDateRangeFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.rangeminday, 'input', () => {
            this.setDateRangeFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.rangemaxmonth, 'input', () => {
            this.adjustDateRangeInputsForSelectedMonthAndYear();
            this.setDateRangeFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.rangemaxyear, 'input', () => {
            this.adjustDateRangeInputsForSelectedMonthAndYear();
            this.setDateRangeFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.rangemaxday, 'input', () => {
            this.setDateRangeFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.slider, 'input', () => {
            // hack for <0 and >= -1 so we never have a -0.xxx value; without this "0" (1 BCE) exists twice whilst sliding
            // this does make a "funny step" in the range input between -0.999999 and -0.000001 but that beats seeing 1 BCE twice
            if (this.controls.slider.value < 0 && this.controls.slider.value > -1) {
                this.controls.slider.value = -1;
            }

            this.setDateFromSlider();
        });
        L.DomEvent.on(this.controls.playbutton, 'click', () => {
            this.autoplayStart();
            this.controls.pausebutton.focus();
        });
        L.DomEvent.on(this.controls.playbutton, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.pausebutton, 'click', () => {
            this.autoplayPause();
            this.controls.playbutton.focus();
        });
        L.DomEvent.on(this.controls.pausebutton, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.playnext, 'click', () => {
            this.sliderForwardOneStep();
        });
        L.DomEvent.on(this.controls.playnext, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.playprev, 'click', () => {
            this.sliderBackOneStep();
        });
        L.DomEvent.on(this.controls.playprev, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.playreset, 'click', () => {
            this.setDate(this.getRange()[0]);
        });
        L.DomEvent.on(this.controls.playreset, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.autoplaysubmit, 'click', () => {
            this.setAutoplayFromPickers();
        });
        L.DomEvent.on(this.controls.stepamount, 'input', () => {
            this.setAutoPlayFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.stepinterval, 'input', () => {
            this.setAutoPlayFormAsOutOfSync(true);
        });
        L.DomEvent.on(this.controls.autoplaysubmit, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.expandcollapse, 'click', () => {
            this.controlToggle();
        });
        L.DomEvent.on(this.controls.expandcollapse, 'keydown', (event) => {
            if (event.key == 'Enter' || event.key == 'Space') event.target.click();
        });
        L.DomEvent.on(this.controls.datepickeropen, 'click', () => {
            this.datepickerOpen();
        });
        L.DomEvent.on(this.controls.datepickerclose, 'click', () => {
            this.datepickerClose();
        });
        L.DomEvent.on(this.controls.datepickercancel, 'click', () => {
            this.controls.datepickerclose.click();
        });
        L.DomEvent.on(this.controls.datepickersubmit, 'click', () => {
            this.datepickerSubmit();
        });
        L.DomEvent.on(this.controls.datepickersubmit, 'keydown', (event) => {
            if (event.key == 'Escape') this.controls.datepickerclose.click();
        });
        L.DomEvent.on(this.controls.datepickerdatebox, 'keyup', (event) => {
            if (event.key == 'Enter') return this.controls.datepickersubmit.click();
            if (event.key == 'Escape') return this.controls.datepickerclose.click();

            // check if date string is valid, enable/disable the submit button
            const isvalid = this.datepickerGetIsoDate();
            if (isvalid) {
                this.controls.datepickersubmit.disabled = false;
            } else {
                this.controls.datepickersubmit.disabled = true;
            }
        });

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
        // there is no year 0; if we're trying to use it, skip to 1 or -1
        const ymd = this.splitYmdParts(newdatestring);
        if (! this.isValidDate(newdatestring)) {
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
        let ymdmin = this.splitYmdParts(newmindate);
        let ymdmax = this.splitYmdParts(newmaxdate);

        if (! this.isValidDate(newmindate)) {
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
        const y1 = this.controls.rangeminyear.value;
        const m1 = this.controls.rangeminmonth.value;
        const d1 = this.zeroPadToLength(this.controls.rangeminday.value, 2);

        const y2 = this.controls.rangemaxyear.value;
        const m2 = this.controls.rangemaxmonth.value;
        const d2 = this.zeroPadToLength(this.controls.rangemaxday.value, 2);

        if (! y1 || isNaN(y1) || y1 > this.constants.maxYear || y1 < this.constants.minYear) return console.error(`OHMTimeSlider setRangeFromSelectors() ignoring invalid year: ${y1}`);
        if (! y2 || isNaN(y2) || y2 > this.constants.maxYear || y2 < this.constants.minYear) return console.error(`OHMTimeSlider setRangeFromSelectors() ignoring invalid year: ${y2}`);

        const mindate = `${y1}-${m1}-${d1}`;
        const maxdate = `${y2}-${m2}-${d2}`;
        this.setRange([ mindate, maxdate ]);

        this.setDateRangeFormAsOutOfSync(false);
    },
    adjustDateRangeInputsForSelectedMonthAndYear: function () {
        // cap the day picker to the number of days in that month, accounting for leap years
        const days_min = decimaldate.daysinmonth(this.controls.rangeminyear.value, this.controls.rangeminmonth.value);
        const days_max = decimaldate.daysinmonth(this.controls.rangemaxyear.value, this.controls.rangemaxmonth.value);

        this.controls.rangeminday.max = days_min;
        this.controls.rangemaxday.max = days_max;

        if (parseInt(this.controls.rangeminday.value) > days_min) this.controls.rangeminday.value = days_min;
        if (parseInt(this.controls.rangemaxday.value) > days_max) this.controls.rangemaxday.value = days_max;
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
        // redraw the UI, setting the slider to the new date range & selected date
        // then apply filtering

        // set the date selectors to show the new range: year, month, day for start & end of range
        const rangeminymd = this.splitYmdParts(this.state.range[0]);
        const rangemaxymd = this.splitYmdParts(this.state.range[1]);

        if (this.controls.rangeminyear.value != rangeminymd[0]) this.controls.rangeminyear.value = rangeminymd[0];
        if (this.controls.rangeminmonth.value != rangeminymd[1]) this.controls.rangeminmonth.value = this.zeroPadToLength(rangeminymd[1], 2);
        if (this.controls.rangeminday.value != rangeminymd[2]) this.controls.rangeminday.value = rangeminymd[2];

        if (this.controls.rangemaxyear.value != rangemaxymd[0]) this.controls.rangemaxyear.value = rangemaxymd[0];
        if (this.controls.rangemaxmonth.value != rangemaxymd[1]) this.controls.rangemaxmonth.value = this.zeroPadToLength(rangemaxymd[1], 2);
        if (this.controls.rangemaxday.value != rangemaxymd[2]) this.controls.rangemaxday.value = rangemaxymd[2];

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
        this.controls.rangestartreadout.innerText = this.formatDateShort(ymdrange[0]);
        this.controls.rangeendreadout.innerText = this.formatDateShort(ymdrange[1]);
        this.controls.datereadout.innerText = this.formatDateLong(ymdcurrent);

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
        const osmfilteringclause = [ 'any', ['>', '1', '0'] ];
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
    _removeDateFiltersFromvectorLayers: function () {
        // in _setupDateFiltersForLayers() we rewrote the layers' filters to support date filtering, but we also kept a backup
        // restore that backup now, so the layers are back where they started
        const vecmap = this.getRealGlMap();
        this._getFilteredvectorLayers().forEach((layer) => {
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
        const layers = this._getFilteredvectorLayers();
        layers.forEach((layer) => {
            const newfilters = vecmap.getFilter(layer.id).slice();
            newfilters[1][2] = datesubfilter.slice();
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
        const newdate = this.timeDelta(olddate, unit, amount);

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
        const newdate = this.timeDelta(olddate, unit, -amount);

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
        // fill the existing date into the box, but in m/d/y or d/m/y format depending on locale
        const yyyymmdd = this.splitYmdParts(this.getDate());
        let mdy;
        switch (this._translations.dateformat) {
            case 'mdy':
                mdy = `${yyyymmdd[1]}/${yyyymmdd[2]}/${yyyymmdd[0]}`;
                break;
            case 'dmy':
                mdy = `${yyyymmdd[2]}/${yyyymmdd[1]}/${yyyymmdd[0]}`;
                break;
            default:
                console.error(`Timeslider datepickerOpen(): unknown date format ${this._translations.dateformat}`);
                mdy = "";
                break;
        }
        this.controls.datepickerdatebox.value = mdy;

        // show the modal
        this._map._container.appendChild(this._datepickermodal);

        // focus the date box for easy access
        // do this in a timeout, or else we get a bug: focused date box, enter-press, causes instant submit
        setTimeout(() =>{
            this.controls.datepickerdatebox.focus();
        }, 0.1 * 1000)
    },
    datepickerClose: function () {
        this._map._container.removeChild(this._datepickermodal);

        // focus the picker-open button, since that's probably how we got to the modal to close it
        this.controls.datepickeropen.focus();
    },
    datepickerSubmit: function () {
        const yyyymmdd = this.datepickerGetIsoDate();
        if (! yyyymmdd) return;

        // set the date; this will implicitly set the slider as needed to include the date
        this.setDate(yyyymmdd);

        // close the datepicker
        this.datepickerClose();
    },
    datepickerGetIsoDate: function () {
        const entered = this.controls.datepickerdatebox.value.trim();
        const yyyymmdd = this.localeDateToIsoDate(entered);
        return yyyymmdd;

    },
    localeDateToIsoDate: function (localdate) {
        // if the date is already in ISO format (presumed if there are - dashes instead of / slashes)
        // then skip massaging it into shape
        let yyyymmdd = "";
        if (this.isValidDate(localdate)) {
            yyyymmdd = localdate;
        } else if (this._translations.dateformat == 'mdy') {
            const bits = localdate.split('/');
            if (bits && bits.length == 3) {
                bits[2] = this.zeroPadToLength(bits[2], 4);
                bits[1] = this.zeroPadToLength(bits[1], 2);
                bits[0] = this.zeroPadToLength(bits[0], 2);
                yyyymmdd = `${bits[2]}-${bits[0]}-${bits[1]}`;
            }
        } else if (this._translations.dateformat == 'dmy') {
            const bits = localdate.split('/');
            if (bits && bits.length == 3) {
                bits[2] = this.zeroPadToLength(bits[2], 4);
                bits[1] = this.zeroPadToLength(bits[1], 2);
                bits[0] = this.zeroPadToLength(bits[0], 2);
                yyyymmdd = `${bits[2]}-${bits[1]}-${bits[0]}`;
            }
        } else {
            console.error(`Timeslider localeDateToIsoDate(): unknown date format ${this._translations.dateformat}`);
            // now let it fail the isValidDate() check below
        }

        return this.isValidDate(yyyymmdd) ? yyyymmdd : null;
    },

    //
    // other utility functions
    //
    isValidDate: function (datestring) {
        if (! datestring.match(/^\-?\d{1,4}-\d\d\-\d\d$/)) return false;

        const ymd = this.splitYmdParts(datestring);
        if (! decimaldate.isvalidmonthday(ymd[0], this.zeroPadToLength(ymd[1], 2), this.zeroPadToLength(ymd[2], 2))) return false;

        return true;
    },
    zeroPadToLength: function (stringornumber, length) {
        const bits = (stringornumber + '').match(/^(\-?)(\d+)$/);
        if (! bits) return stringornumber;
        let minus = '';

        if (bits.length == 2) {
            number = bits[1];
        }
        else if (bits.length == 3) {
            minus = bits[1];
            number = bits[2];
        }
        else throw `OHMTimeSlider: zeroPadToLength: invalid input ${stringornumber}`;

        let padded = number;
        while (padded.length < length) padded = '0' + padded;

        return minus + padded;
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
    formatDateShortPlaceHolder: function (yyyymmdd) {
        switch (this._translations.dateformat) {
            case 'mdy':
                return 'mm/dd/yyyy';
                break;
            default:  // default = dmy
                return 'dd/mm/yyyy';
                break;
        }
    },
    formatDateShort: function (yyyymmdd) {
        const ymd = this.splitYmdParts(yyyymmdd);
        const bce = ymd[0] < 1 ? (' ' + this._translations.bce) : '';

        let y = Math.abs(ymd[0]);
        if (bce) y += 1;  // ISO 8601 = 0 is 1 bce, -1 is 2 bce, and so on
        const m = ymd[1];
        const d = ymd[2];

        switch (this._translations.dateformat) {
            case 'mdy':
                return `${m}/${d}/${y}${bce}`;
                break;
            default:  // default = dmy
                return `${d}/${m}/${y}${bce}`;
                break;
        }
    },
    formatDateLong: function (yyyymmdd) {
        const ymd = this.splitYmdParts(yyyymmdd);
        const bce = ymd[0] < 1 ? (' ' + this._translations.bce) : '';

        let y = Math.abs(ymd[0]);
        if (bce) y += 1;  // ISO 8601 = 0 is 1 bce, -1 is 2 bce, and so on
        const m = this._translations.months[ ymd[1] - 1 ];
        const d = ymd[2];

        switch (this._translations.dateformat) {
            case 'mdy':
                return `${m} ${d}, ${y}${bce}`;
                break;
            default:  // default = dmy
                return `${d} ${m} ${y}${bce}`;
                break;
        }
    },
    splitYmdParts: function (yyyymmdd) {
        // tease apart Y/M/D given possible - at the start
        let y, m, d;
        let bits = yyyymmdd.split('-');
        if (bits.length == 4) {
            y = -parseInt(bits[1]);
            m = parseInt(bits[2]);
            d = parseInt(bits[3]);
        } else {
            y = parseInt(bits[0]);
            m = parseInt(bits[1]);
            d = parseInt(bits[2]);
        }

        return [y, m, d];
    },
    timeDelta: function (yyyymmdd, units, amount) {
        const ymd = this.splitYmdParts(yyyymmdd);
        const y = ymd[0];
        const m = ymd[1];
        const d = ymd[2];

        // let JavaScript do the date calculation, wrapping years and months
        let newdate = new Date(y, m - 1, d);
        newdate.setFullYear(y); // JS treats <100 as 1900

        switch (units) {
            case 'year':
                newdate.setFullYear(y + amount);
                break;
            case 'month':
                newdate.setMonth(newdate.getMonth() + amount);
                break;
            case 'day':
                newdate.setDate(newdate.getDate() + amount);
                break;
        }

        // split out the yyyy-mm-dd part and hand it back
        return newdate.toISOString().split('T')[0];
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


L.Control.OHMTimeSlider.Translations = {};

L.Control.OHMTimeSlider.Translations['en'] = {
    close: "Close this panel",
    expandcollapse_title: "Maximize or minimize this panel",
    slider_description: "Select the date to display on the map",
    daterange_min_month_title: "Slider range, select starting month",
    daterange_min_day_title: "Slider range, select starting day",
    daterange_min_year_title: "Slider range, select starting year",
    daterange_max_month_title: "Slider range, select ending month",
    daterange_max_day_title: "Slider range, select ending day",
    daterange_max_year_title: "Slider range, select ending year",
    daterange_submit_text: "Set",
    daterange_submit_title: "Apply settings",
    range_title: "Range",
    stepamount_title: "Time Jump",
    stepamount_selector_title: "Select how much time to advance with each step",
    stepamount_1day: "1 day",
    stepamount_1month: "1 month",
    stepamount_1year: "1 year",
    stepamount_10year: "10 years",
    stepamount_100year: "100 years",
    stepinterval_title: "Speed",
    stepinterval_selector_title: "Select how often to step forward",
    stepinterval_5sec: "5 Seconds",
    stepinterval_2sec: "2 Seconds",
    stepinterval_1sec: "1 Second",
    playbutton_title: "Play",
    pausebutton_title: "Pause",
    forwardbutton_title: "Skip forward",
    backwardbutton_title: "Skip backward",
    resetbutton_title: "Go to the start of the range",
    autoplay_submit_text: "Set",
    autoplay_submit_title: "Apply settings",
    datepicker_submit_text: "Update Date",
    datepicker_cancel_text: "Cancel",
    datepicker_title: "Change Date",
    datepicker_format_text: "Date formats",
    datepicker_text: "Enter a new date to update the handle location and data displayed.",
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    bce: "BCE",
    dateformat: 'dmy',
};
L.Control.OHMTimeSlider.Translations['en-US'] = Object.assign({}, L.Control.OHMTimeSlider.Translations['en'], {
    dateformat: 'mdy',
});
L.Control.OHMTimeSlider.Translations['en-CA'] = L.Control.OHMTimeSlider.Translations['en-US'];

L.Control.OHMTimeSlider.Translations['es'] = {
    close: "Minimizar esta ventana",
    expandcollapse_title: "Minimizar o restaurar la ventana",
    slider_description: "Personaliza la fecha que deseas explorar",
    daterange_min_month_title: "Selecciona en que mes debe comenzar la barra cronológica",
    daterange_min_day_title: "Selecciona en que día debe comenzar la barra cronológica",
    daterange_min_year_title: "Selecciona en que año debe comenzar la barra cronológica",
    daterange_max_month_title: "Selecciona en que mes debe terminar la barra cronológica",
    daterange_max_day_title: "Selecciona en que día debe terminar la barra cronológica",
    daterange_max_year_title: "Selecciona en que año debe terminar la barra cronológica",
    daterange_submit_text: "Aplicar",
    daterange_submit_title: "Aplicar la configuración",
    range_title: "Intervalo",
    stepamount_title: "Intervalos de desplazamiento",
    stepamount_selector_title: "Personaliza a que paso debe desplazarse el tiempo en la barra cronologica",
    stepamount_1day: "1 día",
    stepamount_1month: "1 mes",
    stepamount_1year: "1 año",
    stepamount_10year: "10 años",
    stepamount_100year: "100 años",
    stepinterval_title: "Velocidad de reproducción",
    stepinterval_selector_title: "Seleccionar la escala de tiempo",
    stepinterval_5sec: "5 Segundos",
    stepinterval_2sec: "2 Segundos",
    stepinterval_1sec: "1 Segundo",
    playbutton_title: "Reproducir",
    pausebutton_title: "Pausa",
    forwardbutton_title: "Siguiente paso",
    backwardbutton_title: "Paso anterior",
    resetbutton_title: "Ir al inicio del alcance",
    autoplay_submit_text: "Aplicar",
    autoplay_submit_title: "Aplicar la configuración",
    datepicker_submit_text: "Aplicar fecha",
    datepicker_cancel_text: "Cancelar",
    datepicker_title: "Cambiar fecha",
    datepicker_format_text: "Formatos de fecha",
    datepicker_text: "Entra una nueva fecha para actualizar la ubicación del mango y los datos que se muestran.",
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    bce: "aec",
    dateformat: 'dmy',
};

L.Control.OHMTimeSlider.Translations['fr'] = {
    close: "Fermer ce panneau",
    expandcollapse_title: "Maximiser ou minimiser ce panneau",
    slider_description: "Sélectionner la date à afficher sur la carte",
    daterange_min_month_title: "Plage du curseur, sélectionner le mois de début",
    daterange_min_day_title: "Plage du curseur, sélectionner le jour de début",
    daterange_min_year_title: "Plage du curseur, sélectionner l'année de début",
    daterange_max_month_title: "Plage du curseur, sélectionner le mois de fin",
    daterange_max_day_title: "Plage du curseur, sélectionner le jour de fin",
    daterange_max_year_title: "Plage du curseur, sélectionner l'année de fin",
    daterange_submit_text: "Définir",
    daterange_submit_title: "Appliquer les paramètres",
    range_title: "Plage",
    stepamount_title: "Saut de Temps",
    stepamount_selector_title: "Sélectionner de combien de temps avancer par intervalle",
    stepamount_1day: "1 jour",
    stepamount_1month: "1 mois",
    stepamount_1year: "1 an",
    stepamount_10year: "10 ans",
    stepamount_100year: "100 ans",
    stepinterval_title: "Vitesse",
    stepinterval_selector_title: "Sélectionner la fréquence d'avancement",
    stepinterval_5sec: "5 Secondes",
    stepinterval_2sec: "2 Secondes",
    stepinterval_1sec: "1 Seconde",
    playbutton_title: "Lecture",
    pausebutton_title: "Pause",
    forwardbutton_title: "Saut avant",
    backwardbutton_title: "Saut arrière",
    resetbutton_title: "Aller au début de la plage",
    autoplay_submit_text: "Définir",
    autoplay_submit_title: "Appliquer les paramètres",
    datepicker_submit_text: "Update Date",
    datepicker_cancel_text: "Cancel",
    datepicker_title: "Mettre à Jour Date",
    datepicker_format_text: "Formats de date",
    datepicker_text: "Saisissez une nouvelle date pour mettre à jour la position du curseur et les données affichées.",
    months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobere', 'Novembre', 'Décembre'],
    bce: "AEC",
    dateformat: 'dmy',
};
L.Control.OHMTimeSlider.Translations['fr-CA'] = L.Control.OHMTimeSlider.Translations['fr'];
L.Control.OHMTimeSlider.Translations['fr-BE'] = L.Control.OHMTimeSlider.Translations['fr'];
L.Control.OHMTimeSlider.Translations['fr-CH'] = L.Control.OHMTimeSlider.Translations['fr'];
L.Control.OHMTimeSlider.Translations['fr-LU'] = L.Control.OHMTimeSlider.Translations['fr'];
