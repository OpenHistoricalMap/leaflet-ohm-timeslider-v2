const START_ZOOM = 5.0;
const START_CENTER = [ 39.828175, -98.5795 ];

let DEFAULT_RANGE = ['1800-01-01', '2022-01-01'];
let DEFAULT_DATE = '2022-01-01';

let MAP; // the L.Map
let SELECTEDVIZ; // string, currently-selected map
let OHMLAYER; // the L.MBGL layer
let TIMESLIDER; // the TimeSlider

document.addEventListener('DOMContentLoaded', function () {
    const urlparams = new URLSearchParams(document.location.hash.replace(/^#/, ''));

    // override DEFAULT_RANGE and DEFAULT_DATEif given in URL params
    if (urlparams.get('date')) {
        DEFAULT_DATE = urlparams.get('date');
    }
    if (urlparams.get('range')) {
        DEFAULT_RANGE = urlparams.get('range').split(',');
    }

    // start the map
    // starting view overridden by x/y/z params
    MAP = L.map('map', {
        zoomSnap: 0.1,
    });

    if (urlparams.get('z') && urlparams.get('x') && urlparams.get('y')) {
        const z = parseFloat(urlparams.get('z'));
        const x = parseFloat(urlparams.get('x'));
        const y = parseFloat(urlparams.get('y'));
        MAP.setView([y, x], z);
    } else {
        MAP.setView(START_CENTER, START_ZOOM);
    }

    L.control.scale().addTo(MAP);

    // set up the radiobox behavior to pick a layer & add the timeslider to it
    // check one of the boxes, either from URL param or default
    // and trigger it now
    const $checkboxes = document.querySelectorAll('input[type="radio"][name="layerchoice"]');
    [...$checkboxes].forEach(($checkbox) => {
        $checkbox.addEventListener('change', function () {
            const which = document.querySelector('input[type="radio"][name="layerchoice"]:checked').getAttribute('value');
            selectLayer(which);
        });
    });

    if (urlparams.get('layer')) {
        const selected = urlparams.get('layer');
        document.querySelector(`input[type="radio"][name="layerchoice"][value="${selected}"]`).checked = true;
    } else {
        document.querySelector('input[type="radio"][name="layerchoice"][value="fullcolor"]').checked = true;
    }

    selectLayer( document.querySelector('input[type="radio"][name="layerchoice"]:checked').getAttribute('value') );

    // start updating the URL hash every few seconds
    setInterval(function () {
        updateUrlHash();
    }, 1 * 1000);
});


function selectLayer (which) {
    // remove the layers & timeslider, but note the settings from the slider
    let oldrange, olddate, vectorlayer;
    if (OHMLAYER) {
        MAP.removeLayer(OHMLAYER);
        OHMLAYER = undefined;
    }
    if (TIMESLIDER) {
        MAP.removeControl(TIMESLIDER);
        olddate = TIMESLIDER.getDate();
        oldrange = TIMESLIDER.getRange();
        TIMESLIDER = undefined;
    }

    // create the new vector layer, reloading the style from scratch
    // then apply the 'slider to it
    SELECTEDVIZ = which;
    switch (which) {
        case 'lightest':
            OHMLAYER = new L.MapboxGL({
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/OHM'>OHM</a>",
                style: MAPSTYLE_LIGHTEST,
                accessToken: "no-token",
            });
            break;
        case 'light':
            OHMLAYER = new L.MapboxGL({
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/OHM'>OHM</a>",
                style: MAPSTYLE_LIGHT,
                accessToken: "no-token",
            });
            break;
        case 'fullcolor':
            OHMLAYER = new L.MapboxGL({
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/OHM'>OHM</a>",
                style: MAPSTYLE_FULLCOLOR,
                accessToken: "no-token",
            });
            break;
        default:
            throw new Error("Unknown layer choice");
            break;
    }

    OHMLAYER.addTo(MAP);

    setTimeout(() => {
        const tsoptions = {
            vectorLayer: OHMLAYER,
            vectorSourceName: 'osm',
            range: DEFAULT_RANGE,
            date: DEFAULT_DATE,
            stepInterval: 1,
            stepAmount: '10year',
        };

        if (olddate) tsoptions.date = olddate;
        if (oldrange) tsoptions.range = oldrange;

        TIMESLIDER = new L.Control.OHMTimeSlider(tsoptions).addTo(MAP);
    }, 1 * 1000);
}


function updateUrlHash () {
    if (! TIMESLIDER)  return;

    const params = {};

    params.z = MAP.getZoom().toFixed(2);
    params.y = MAP.getCenter().lat.toFixed(6);
    params.x = MAP.getCenter().lng.toFixed(6);
    params.date = TIMESLIDER.getDate();
    params.range = TIMESLIDER.getRange().join(',');
    params.layer = SELECTEDVIZ;

    const urlhash = `x=${params.x}&y=${params.y}&z=${params.z}&date=${params.date}&range=${params.range}&layer=${params.layer}`;
    document.location.hash = urlhash;
}
