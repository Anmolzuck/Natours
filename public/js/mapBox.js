/*eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYW5tb2x6YWtpZSIsImEiOiJja2Z2NGIzcG4weGF0MnF0OHlnNTVpd3NxIn0.JfCbGKfTygNavCtp_9nJ0A';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/anmolzakie/ckfv4yj5j0qmr19od7k6hsmtd',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //Extend map bounds to include  current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 150,
      right: 100,
    },
  });
};
