import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import { fromLonLat, toLonLat } from 'https://cdn.skypack.dev/ol/proj.js';

// Inisialisasi peta
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([107.9019822944495, -7.215907720160664]),
    zoom: 12,
  }),
  controls: [] // Menonaktifkan kontrol default agar lebih rapi
});

// Elemen untuk menampilkan informasi lokasi
const locationCoordinates = document.getElementById('location-coordinates');
const locationAddress = document.getElementById('location-address');
const saveBtn = document.getElementById('save-btn');
const refreshBtn = document.getElementById('refresh-btn');
const savedLocationsList = document.getElementById('saved-locations-list');

// Fungsi untuk mendapatkan alamat berdasarkan koordinat
async function getAddress(lon, lat) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lon=${lon}&lat=${lat}&zoom=18&addressdetails=1`
  );
  if (response.ok) {
    const data = await response.json();
    return data.display_name || 'Address not found';
  } else {
    console.error('Failed to fetch address');
    return 'Failed to fetch address';
  }
}

// Event klik pada peta
map.on('click', async (event) => {
  const coordinate = event.coordinate;
  const lonLat = toLonLat(coordinate);
  const lon = lonLat[0].toFixed(6);
  const lat = lonLat[1].toFixed(6);

  // Dapatkan alamat dari API
  const address = await getAddress(lon, lat);

  // Update informasi lokasi pada elemen di halaman
  locationCoordinates.textContent = `Coordinates: Longitude: ${lon}, Latitude: ${lat}`;
  locationAddress.textContent = `Address: ${address}`;

  // Enable the Save button once a location is selected
  saveBtn.disabled = false;
});

// Event klik pada tombol Save
saveBtn.addEventListener('click', () => {
  const coordinates = locationCoordinates.textContent;
  const address = locationAddress.textContent;

  // Simpan data ke sessionStorage
  const savedLocations = JSON.parse(sessionStorage.getItem('savedLocations')) || [];
  savedLocations.push({ coordinates, address });
  sessionStorage.setItem('savedLocations', JSON.stringify(savedLocations));

  alert('Location saved!');
  saveBtn.disabled = true; // Disable save button after saving

  // Update the saved locations list
  updateSavedLocations();
});

// Event klik pada tombol Refresh
refreshBtn.addEventListener('click', () => {
  // Hapus data yang disimpan dari sessionStorage
  sessionStorage.removeItem('savedLocations');

  // Update the saved locations list (clear the list)
  updateSavedLocations();
  alert('Saved locations have been cleared!');
});

// Fungsi untuk memperbarui tampilan daftar lokasi yang disimpan
function updateSavedLocations() {
  const savedLocations = JSON.parse(sessionStorage.getItem('savedLocations')) || [];
  savedLocationsList.innerHTML = ''; // Clear current list

  savedLocations.forEach((location, index) => {
    const div = document.createElement('div');
    div.classList.add('saved-location');
    div.innerHTML = `
      <span>Location ${index + 1}:</span>
      <p><strong>Coordinates:</strong> ${location.coordinates}</p>
      <p><strong>Address:</strong> ${location.address}</p>
    `;
    savedLocationsList.appendChild(div);
  });
}

// Load saved locations when the page loads
updateSavedLocations();
