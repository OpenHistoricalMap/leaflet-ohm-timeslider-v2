const START_ZOOM = 5.0;
const START_CENTER = [ 39.828175, -98.5795 ];

let MAP;
let OHMLAYER;
let TIMESLIDER;

document.addEventListener('DOMContentLoaded', function () {
    MAP = L.map('map', {
        zoomSnap: 0.1,
    })
    .setView(START_CENTER, START_ZOOM);

    L.control.scale().addTo(MAP);

    // and set up the radiobox behavior to pick a layer, and trigger it now

    const $checkboxes = document.querySelectorAll('input[type="radio"][name="layerchoice"]');
    [...$checkboxes].forEach(($checkbox) => {
        $checkbox.addEventListener('change', function () {
            const which = document.querySelector('input[type="radio"][name="layerchoice"]:checked').getAttribute('value');
            selectLayer(which);
        });
    });
    selectLayer( document.querySelector('input[type="radio"][name="layerchoice"]:checked').getAttribute('value') );
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
    switch (which) {
        case 'LIGHTEST':
            OHMLAYER = new L.MapboxGL({
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/OHM'>OHM</a>",
                style: MAPSTYLE_LIGHTEST,
                accessToken: "no-token",
            });
            break;
        case 'LIGHT':
            OHMLAYER = new L.MapboxGL({
                attribution: "<a href='http://wiki.openstreetmap.org/wiki/OHM'>OHM</a>",
                style: MAPSTYLE_LIGHT,
                accessToken: "no-token",
            });
            break;
        case 'FULLCOLOR':
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
            range: ['1800-01-01', '2022-01-01'],
            date: '2022-01-01',
            stepInterval: 1,
            stepAmount: '10year',
            onDateChange: function (date) {
                console.debug(['timeslider.js onDateChange', date, this]);
            },
            onRangeChange: function (range) {
                console.debug(['timeslider.js onRangeChange', range, this]);
            },
            onReady: function () {
                console.debug(['timeslider.js onReady', this]);
            },
        };

        if (olddate) tsoptions.date = olddate;
        if (oldrange) tsoptions.range = oldrange;

        TIMESLIDER = new L.Control.OHMTimeSlider(tsoptions).addTo(MAP);
    }, 1 * 1000);
}
