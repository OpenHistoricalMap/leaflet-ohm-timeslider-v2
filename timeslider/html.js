function getDatePickerModalHTML(translations, maxabsyear, text_ce, text_bce) {
  return `
<div class="leaflet-ohm-timeslider-modal-background"></div>
<div class="leaflet-ohm-timeslider-modal-panel">
    <div class="leaflet-ohm-timeslider-modal-content">
        <div class="leaflet-ohm-timeslider-modal-head">
            <h4>${translations.datepicker_title}</h4>
            <span class="leaflet-ohm-timeslider-modal-close" aria-label="${translations.close}" data-timeslider="datepickerclose">&times;</span>
        </div>
        <hr />
        <div class="leaflet-ohm-timeslider-modal-body">
            <p>${translations.datepicker_text}</p>
            <select data-timeslider="datepickermonth" aria-label="${translations.datepicker_month}">
                <option value="01">${translations.months[0]}</option>
                <option value="02">${translations.months[1]}</option>
                <option value="03">${translations.months[2]}</option>
                <option value="04">${translations.months[3]}</option>
                <option value="05">${translations.months[4]}</option>
                <option value="06">${translations.months[5]}</option>
                <option value="07">${translations.months[6]}</option>
                <option value="08">${translations.months[7]}</option>
                <option value="09">${translations.months[8]}</option>
                <option value="10">${translations.months[9]}</option>
                <option value="11">${translations.months[10]}</option>
                <option value="12">${translations.months[11]}</option>
            </select>
            <input type="number" data-timeslider="datepickerday" min="1" max="31" step="1"  class="leaflet-ohm-timeslider-datepicker-day" aria-label="${translations.datepicker_day}" />
            <input type="number" data-timeslider="datepickeryear" min="1" max="${maxabsyear}" step="1" class="leaflet-ohm-timeslider-datepicker-year" aria-label="${translations.datepicker_year}" />
            <select data-timeslider="datepickercebce" aria-label="${translations.datepicker_cebce}">
                <option value="+">${text_ce}</option>
                <option value="-">${text_bce}</option>
            </select>

            <p></p>
            <hr />
        </div>
        <div class="leaflet-ohm-timeslider-modal-foot">
            <button data-timeslider="datepickersubmit">${translations.datepicker_submit_text}</button>
            <button data-timeslider="datepickercancel">${translations.datepicker_cancel_text}</button>
        </div>
    </div>
</div>
`;
}

function getControlHTML(
  translations,
  maxabsyear,
  text_ce,
  text_bce,
  constants
) {
  return `
<div class="leaflet-ohm-timeslider-expandcollapse" data-timeslider="expandcollapse" role="button" tabindex="0" title="${translations.expandcollapse_title}"><span></span></div>
<div class="leaflet-ohm-timeslider-rangeinputs">
    <div class="leaflet-ohm-timeslider-rangeinputs-title">
        <strong>${translations.range_title}</strong>
    </div>
    <div class="leaflet-ohm-timeslider-rangeinputs-mindate">
        <select data-timeslider="rangeminmonth" aria-label="${translations.daterange_min_month_title}">
            <option value="01">${translations.months[0]}</option>
            <option value="02">${translations.months[1]}</option>
            <option value="03">${translations.months[2]}</option>
            <option value="04">${translations.months[3]}</option>
            <option value="05">${translations.months[4]}</option>
            <option value="06">${translations.months[5]}</option>
            <option value="07">${translations.months[6]}</option>
            <option value="08">${translations.months[7]}</option>
            <option value="09">${translations.months[8]}</option>
            <option value="10">${translations.months[9]}</option>
            <option value="11">${translations.months[10]}</option>
            <option value="12">${translations.months[11]}</option>
        </select>
        <input type="number" data-timeslider="rangeminday" min="1" max="31" step="1"  class="leaflet-ohm-timeslider-rangeinputs-day" aria-label="${translations.daterange_min_day_title}" />
        <input type="number" data-timeslider="rangeminyear" min="1" max="${maxabsyear}" step="1" class="leaflet-ohm-timeslider-rangeinputs-year" aria-label="${translations.daterange_min_year_title}" />
        <select data-timeslider="rangemincebce" aria-label="${translations.daterange_min_cebce_title}">
            <option value="+">${text_ce}</option>
            <option value="-">${text_bce}</option>
        </select>
    </div>
    <div class="leaflet-ohm-timeslider-rangeinputs-separator">
        -
    </div>
    <div class="leaflet-ohm-timeslider-rangeinputs-maxdate">
        <select data-timeslider="rangemaxmonth" aria-label="${translations.daterange_max_month_title}">
            <option value="01">${translations.months[0]}</option>
            <option value="02">${translations.months[1]}</option>
            <option value="03">${translations.months[2]}</option>
            <option value="04">${translations.months[3]}</option>
            <option value="05">${translations.months[4]}</option>
            <option value="06">${translations.months[5]}</option>
            <option value="07">${translations.months[6]}</option>
            <option value="08">${translations.months[7]}</option>
            <option value="09">${translations.months[8]}</option>
            <option value="10">${translations.months[9]}</option>
            <option value="11">${translations.months[10]}</option>
            <option value="12">${translations.months[11]}</option>
        </select>
        <input type="number" data-timeslider="rangemaxday" min="1" max="31" step="1" class="leaflet-ohm-timeslider-rangeinputs-day" aria-label="${translations.daterange_max_day_title}" />
        <input type="number" data-timeslider="rangemaxyear" min="1" max="${maxabsyear}" step="1" class="leaflet-ohm-timeslider-rangeinputs-year" aria-label="${translations.daterange_max_year_title}" />
        <select data-timeslider="rangemaxcebce" aria-label="${translations.daterange_max_cebce_title}">
            <option value="+">${text_ce}</option>
            <option value="-">${text_bce}</option>
        </select>
    </div>
    <div class="leaflet-ohm-timeslider-rangeinputs-submit">
        <button data-timeslider="rangesubmit" aria-label="${translations.daterange_submit_title}">${translations.daterange_submit_text}</button>
    </div>
</div>
<div class="leaflet-ohm-timeslider-datereadout">
    <span data-timeslider="datereadout"></span>
    <button type="button" data-timeslider="datepickeropen" aria-label="${translations.datepicker_title}"></button>
</div>
<div class="leaflet-ohm-timeslider-slider-wrap">
    <div>
        ${translations.ymd_placeholder_short}
        <br/>
        <span data-timeslider="rangestartreadout"></span>
    </div>
    <div>
        <input type="range" min="" max="" step="${constants.onedaystep}" class="leaflet-ohm-timeslider-sliderbar" data-timeslider="slider" aria-label="${translations.slider_description}" />
    </div>
    <div>
        ${translations.ymd_placeholder_short}
        <br/>
        <span data-timeslider="rangeendreadout"></span>
    </div>
</div>
<div class="leaflet-ohm-timeslider-playcontrols-wrap">
    <div class="leaflet-ohm-timeslider-playcontrols-buttons">
        <span data-timeslider="reset" role="button" tabindex="0" title="${translations.resetbutton_title}"></span>
        <span data-timeslider="play" role="button" tabindex="0" title="${translations.playbutton_title}"></span>
        <span data-timeslider="pause" role="button" tabindex="0" title="${translations.pausebutton_title}"></span>
        <span data-timeslider="prev" role="button" tabindex="0" title="${translations.backwardbutton_title}"></span>
        <span data-timeslider="next" role="button" tabindex="0" title="${translations.forwardbutton_title}"></span>
    </div>
    <div class="leaflet-ohm-timeslider-playcontrols-settings">
        <div>
            <strong>${translations.stepamount_title}</strong>
            <select data-timeslider="stepamount" aria-label="${translations.stepamount_selector_title}">
                <option value="1day">${translations.stepamount_1day}</option>
                <option value="1month">${translations.stepamount_1month}</option>
                <option value="1year">${translations.stepamount_1year}</option>
                <option value="10year">${translations.stepamount_10year}</option>
                <option value="100year">${translations.stepamount_100year}</option>
            </select>
        </div>
        <div>
            <strong>${translations.stepinterval_title}</strong>
            <select data-timeslider="stepinterval" aria-label="${translations.stepinterval_selector_title}">
                <option value="5">${translations.stepinterval_5sec}</option>
                <option value="2">${translations.stepinterval_2sec}</option>
                <option value="1">${translations.stepinterval_1sec}</option>
            </select>
        </div>
        <div>
            <button data-timeslider="autoplaysubmit" aria-label="${translations.autoplay_submit_title}">${translations.autoplay_submit_text}</button>
        </div>
    </div>
</div>
`;
}
