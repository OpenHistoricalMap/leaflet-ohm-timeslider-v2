function getTranslations() {
  const translations = {};

  translations["en"] = {
    close: "Close this panel",
    expandcollapse_title: "Maximize or minimize this panel",
    slider_description: "Select the date to display on the map",
    daterange_min_month_title: "Slider range, select starting month",
    daterange_min_day_title: "Slider range, select starting day",
    daterange_min_year_title: "Slider range, select starting year",
    daterange_min_cebce_title:
      "Slider range, select starting year as CE or BCE",
    daterange_max_month_title: "Slider range, select ending month",
    daterange_max_day_title: "Slider range, select ending day",
    daterange_max_year_title: "Slider range, select ending year",
    daterange_max_cebce_title: "Slider range, select ending year as CE or BCE",
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
    datepicker_month: "Month",
    datepicker_day: "Day",
    datepicker_year: "Year",
    datepicker_cebce: "BCE/BC or CE/AD",
    datepicker_submit_text: "Update Date",
    datepicker_cancel_text: "Cancel",
    datepicker_title: "Change Date",
    datepicker_format_text: "Date formats",
    datepicker_text:
      "Enter a new date to update the handle location and data displayed.",
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    ymd_placeholder_short: "dd/mm/yyyy",
  };

  translations["en-US"] = Object.assign({}, translations["en"], {
    ymd_placeholder_short: "mm/dd/yyyy",
  });
  translations["en-CA"] = translations["en-US"];

  translations["es"] = {
    close: "Minimizar esta ventana",
    expandcollapse_title: "Minimizar o restaurar la ventana",
    slider_description: "Personaliza la fecha que deseas explorar",
    daterange_min_month_title:
      "Selecciona en que mes debe comenzar la barra cronológica",
    daterange_min_day_title:
      "Selecciona en que día debe comenzar la barra cronológica",
    daterange_min_year_title:
      "Selecciona en que año debe comenzar la barra cronológica",
    daterange_min_cebce_title:
      "Selecciona el año final de la barra cronológica inicio como a. C. o d. C.",
    daterange_max_month_title:
      "Selecciona en que mes debe terminar la barra cronológica",
    daterange_max_day_title:
      "Selecciona en que día debe terminar la barra cronológica",
    daterange_max_year_title:
      "Selecciona en que año debe terminar la barra cronológica",
    daterange_max_cebce_title:
      "Selecciona el año de inicio de la barra cronológica como a. C. o d. C.",
    daterange_submit_text: "Aplicar",
    daterange_submit_title: "Aplicar la configuración",
    range_title: "Intervalo",
    stepamount_title: "Intervalos de desplazamiento",
    stepamount_selector_title:
      "Personaliza a que paso debe desplazarse el tiempo en la barra cronologica",
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
    datepicker_month: "Mes",
    datepicker_day: "Día",
    datepicker_year: "Año",
    datepicker_cebce: "a. C. o d. C.",
    datepicker_submit_text: "Aplicar fecha",
    datepicker_cancel_text: "Cancelar",
    datepicker_title: "Cambiar fecha",
    datepicker_format_text: "Formatos de fecha",
    datepicker_text:
      "Entra una nueva fecha para actualizar la ubicación del mango y los datos que se muestran.",
    months: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    ymd_placeholder_short: "dd/mm/aaaa",
  };

  translations["fr"] = {
    close: "Fermer ce panneau",
    expandcollapse_title: "Maximiser ou minimiser ce panneau",
    slider_description: "Sélectionner la date à afficher sur la carte",
    daterange_min_month_title:
      "Plage du curseur, sélectionner le mois de début",
    daterange_min_day_title: "Plage du curseur, sélectionner le jour de début",
    daterange_min_year_title: "Plage du curseur, sélectionner l'année de début",
    daterange_min_cebce_title:
      "Plage du curseur, sélectionner l'année comme ap. J.-C. ou av. J.-C.",
    daterange_max_month_title: "Plage du curseur, sélectionner le mois de fin",
    daterange_max_day_title: "Plage du curseur, sélectionner le jour de fin",
    daterange_max_year_title: "Plage du curseur, sélectionner l'année de fin",
    daterange_max_cebce_title:
      "Plage du curseur, sélectionner l'année comme ap. J.-C. ou av. J.-C.",
    daterange_submit_text: "Définir",
    daterange_submit_title: "Appliquer les paramètres",
    range_title: "Plage",
    stepamount_title: "Saut de Temps",
    stepamount_selector_title:
      "Sélectionner de combien de temps avancer par intervalle",
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
    datepicker_month: "Mois",
    datepicker_day: "Jour",
    datepicker_year: "Année",
    datepicker_cebce: "ap. J.-C. ou av. J.-C.",
    datepicker_submit_text: "Appliquer la date",
    datepicker_cancel_text: "Annuler",
    datepicker_title: "Mettre à Jour Date",
    datepicker_format_text: "Formats de date",
    datepicker_text:
      "Saisissez une nouvelle date pour mettre à jour la position du curseur et les données affichées.",
    months: [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobere",
      "Novembre",
      "Décembre",
    ],
    ymd_placeholder_short: "jj/mm/aaaa",
  };
  translations["fr-CA"] = translations["fr"];
  translations["fr-BE"] = translations["fr"];
  translations["fr-CH"] = translations["fr"];
  translations["fr-LU"] = translations["fr"];

  return translations;
}
