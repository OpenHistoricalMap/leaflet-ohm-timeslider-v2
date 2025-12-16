async function loadMapStyle() {
  const response = await fetch('https://www.openhistoricalmap.org/map-styles/historical/historical.json');
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}
