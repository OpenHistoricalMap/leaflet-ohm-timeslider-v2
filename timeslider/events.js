function bindTimeSliderEvents(timeslider) {
  const controls = timeslider.controls;

  L.DomEvent.on(controls.rangesubmit, "click", () => {
    timeslider.setRangeFromSelectors();
  });
  L.DomEvent.on(controls.rangesubmit, "keydown", (event) => {
    if (event.key == "Enter" || event.key == "Space") event.target.click();
  });

  L.DomEvent.on(controls.rangeminyear, "change", () => {
    const value = parseInt(controls.rangeminyear.value);
    const min = parseInt(controls.rangeminyear.min);
    const max = parseInt(controls.rangeminyear.max);

    if (value < min) controls.rangeminyear.value = min;
    else if (value > max) controls.rangeminyear.value = max;

    timeslider.adjustDateRangeInputsForSelectedMonthAndYear();
    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangeminmonth, "input", () => {
    timeslider.adjustDateRangeInputsForSelectedMonthAndYear();
    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangeminday, "change", () => {
    const value = parseInt(controls.rangeminday.value);
    const min = parseInt(controls.rangeminday.min);
    const max = parseInt(controls.rangeminday.max);

    if (value < min) controls.rangeminday.value = min;
    else if (value > max) controls.rangeminday.value = max;

    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangemincebce, "change", () => {
    timeslider.adjustDateRangeInputsForSelectedMonthAndYear();
    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangemaxyear, "change", () => {
    const value = parseInt(controls.rangemaxyear.value);
    const min = parseInt(controls.rangemaxyear.min);
    const max = parseInt(controls.rangemaxyear.max);

    if (value < min) controls.rangemaxyear.value = min;
    else if (value > max) controls.rangemaxyear.value = max;

    timeslider.adjustDateRangeInputsForSelectedMonthAndYear();
    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangemaxmonth, "input", () => {
    timeslider.adjustDateRangeInputsForSelectedMonthAndYear();
    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangemaxday, "change", () => {
    const value = parseInt(controls.rangemaxday.value);
    const min = parseInt(controls.rangemaxday.min);
    const max = parseInt(controls.rangemaxday.max);

    if (value < min) controls.rangemaxday.value = min;
    else if (value > max) controls.rangemaxday.value = max;

    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.rangemaxcebce, "change", () => {
    timeslider.adjustDateRangeInputsForSelectedMonthAndYear();
    timeslider.setDateRangeFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.slider, "input", () => {
    timeslider.setDateFromSlider();
  });

  L.DomEvent.on(controls.playbutton, "click", () => {
    timeslider.autoplayStart();
    controls.pausebutton.focus();
  });

  L.DomEvent.on(controls.pausebutton, "click", () => {
    timeslider.autoplayPause();
    controls.playbutton.focus();
  });

  L.DomEvent.on(controls.playnext, "click", () => {
    timeslider.sliderForwardOneStep();
  });

  L.DomEvent.on(controls.playprev, "click", () => {
    timeslider.sliderBackOneStep();
  });

  L.DomEvent.on(controls.playreset, "click", () => {
    timeslider.setDate(timeslider.getRange()[0]);
  });

  [controls.playbutton, controls.pausebutton, controls.playnext, 
   controls.playprev, controls.playreset].forEach(control => {
    L.DomEvent.on(control, "keydown", (event) => {
      if (event.key == "Enter" || event.key == "Space") event.target.click();
    });
  });

  L.DomEvent.on(controls.autoplaysubmit, "click", () => {
    timeslider.setAutoplayFromPickers();
  });

  L.DomEvent.on(controls.stepamount, "input", () => {
    timeslider.setAutoPlayFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.stepinterval, "input", () => {
    timeslider.setAutoPlayFormAsOutOfSync(true);
  });

  L.DomEvent.on(controls.autoplaysubmit, "keydown", (event) => {
    if (event.key == "Enter" || event.key == "Space") event.target.click();
  });

  L.DomEvent.on(controls.expandcollapse, "click", () => {
    timeslider.controlToggle();
  });

  L.DomEvent.on(controls.expandcollapse, "keydown", (event) => {
    if (event.key == "Enter" || event.key == "Space") event.target.click();
  });

  L.DomEvent.on(controls.datepickeropen, "click", () => {
    timeslider.datepickerOpen();
  });

  L.DomEvent.on(controls.datepickerclose, "click", () => {
    timeslider.datepickerClose();
  });

  L.DomEvent.on(controls.datepickercancel, "click", () => {
    controls.datepickerclose.click();
  });

  L.DomEvent.on(controls.datepickersubmit, "click", () => {
    timeslider.datepickerSubmit();
  });

  L.DomEvent.on(controls.datepickersubmit, "keydown", (event) => {
    if (event.key == "Escape") controls.datepickerclose.click();
  });

  L.DomEvent.on(controls.datepickermonth, "input", () => {
    timeslider.adjustDatePickerInputsForSelectedMonthAndYear();
  });

  L.DomEvent.on(controls.datepickerday, "change", () => {
    const value = parseInt(controls.datepickerday.value);
    const min = parseInt(controls.datepickerday.min);
    const max = parseInt(controls.datepickerday.max);

    if (value < min) controls.datepickerday.value = min;
    else if (value > max) controls.datepickerday.value = max;
  });

  L.DomEvent.on(controls.datepickeryear, "change", () => {
    const value = parseInt(controls.datepickeryear.value);
    const min = parseInt(controls.datepickeryear.min);
    const max = parseInt(controls.datepickeryear.max);

    if (value < min) controls.datepickeryear.value = min;
    else if (value > max) controls.datepickeryear.value = max;

    timeslider.adjustDatePickerInputsForSelectedMonthAndYear();
  });

  L.DomEvent.on(controls.datepickercebce, "change", () => {
    timeslider.adjustDatePickerInputsForSelectedMonthAndYear();
  });
}
