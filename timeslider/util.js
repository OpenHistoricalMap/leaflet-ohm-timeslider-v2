function isValidDate(datestring) {
  if (!datestring.match(/^\-?\d{1,4}-\d\d\-\d\d$/)) return false;

  const ymd = splitYmdParts(datestring);
  let y = parseInt(ymd[0]);
  if (y <= 0) y -= 1;
  const m = parseInt(ymd[1]);
  const d = parseInt(ymd[2]);
  if (!decimaldate.isvalidmonthday(y, m, d)) return false;

  return true;
}

function zeroPadToLength(stringornumber, length) {
  const bits = (stringornumber + "").match(/^(\-?)(\d+)$/);
  let minus = "";

  if (bits.length == 2) {
    number = bits[1];
  } else if (bits.length == 3) {
    minus = bits[1];
    number = bits[2];
  } else
    throw `OHMTimeSlider: zeroPadToLength: invalid input ${stringornumber}`;

  let padded = number;
  while (padded.length < length) padded = "0" + padded;

  return minus + padded;
}

function formatDateShort(yyyymmdd) {
  const [y, m, d] = splitYmdParts(yyyymmdd);
  const thedate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  thedate.setUTCFullYear(y);

  const formatoptions = {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };
  if (y <= 0) formatoptions.era = "short";

  return new Intl.DateTimeFormat(navigator.languages, formatoptions).format(
    thedate
  );
}

function formatDateLong(yyyymmdd) {
  const [y, m, d] = splitYmdParts(yyyymmdd);
  const thedate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  thedate.setUTCFullYear(y);

  const formatoptions = {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  if (y <= 0) formatoptions.era = "short";

  return new Intl.DateTimeFormat(navigator.languages, formatoptions).format(
    thedate
  );
}

function getTextForBCE() {
  // use Intl.DateTimeFormat to generate BC/AD/BCE/CE text, so it matches to formatDateShort() et al which also use Intl.DateTimeFormat
  const testdate = new Date(Date.UTC(2020, 5, 15, 0, 0, 0, 0));
  testdate.setFullYear(-2000);

  const datebits = new Intl.DateTimeFormat(navigator.languages, {
    era: "short",
  }).formatToParts(testdate);
  const era = datebits.filter((f) => f.type == "era")[0].value;
  return era;
}

function getTextForCE() {
  // use Intl.DateTimeFormat to generate BC/AD/BCE/CE text, so it matches to formatDateShort() et al which also use Intl.DateTimeFormat
  const testdate = new Date(Date.UTC(2020, 5, 15, 0, 0, 0, 0));
  testdate.setFullYear(+2000);

  const datebits = new Intl.DateTimeFormat(navigator.languages, {
    era: "short",
  }).formatToParts(testdate);
  const era = datebits.filter((f) => f.type == "era")[0].value;
  return era;
}

function splitYmdParts(yyyymmdd) {
  // tease apart Y/M/D given possible - at the start
  let y, m, d;
  let bits = yyyymmdd.split("-");
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
}

function timeDelta(yyyymmdd, units, amount) {
  const ymd = splitYmdParts(yyyymmdd);
  const y = ymd[0];
  const m = ymd[1];
  const d = ymd[2];

  // let JavaScript do the date calculation, wrapping years and months
  let newdate = new Date(y, m - 1, d);
  newdate.setFullYear(y); // JS treats <100 as 1900

  switch (units) {
    case "year":
      newdate.setFullYear(y + amount);
      break;
    case "month":
      newdate.setMonth(newdate.getMonth() + amount);
      break;
    case "day":
      newdate.setDate(newdate.getDate() + amount);
      break;
  }

  // split out the yyyy-mm-dd part and hand it back
  return newdate.toISOString().split("T")[0];
}
