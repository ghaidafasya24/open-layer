import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import { Icon, Style } from 'https://cdn.skypack.dev/ol/style.js';
import { fromLonLat, toLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import * as turf from 'https://cdn.skypack.dev/@turf/turf';
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { addCSS } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";

addCSS("https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css");

// Initialize the map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([107.54249456754211, -6.884723248778016]),
    zoom: 8,
  }),
});

// Create a vector source and layer for markers
const markerSource = new VectorSource();
const markerLayer = new VectorLayer({
  source: markerSource,
});
map.addLayer(markerLayer);

// Get DOM elements for popup and marker description
const popup = document.getElementById('popup');
const descriptionInput = document.getElementById('marker-description');
const addMarkerButton = document.getElementById('add-marker');
const cancelButton = document.getElementById('cancel');

// Variable to hold the selected coordinates
let selectedCoordinates = null;

// Handle map click for selecting coordinates
map.on('click', (event) => {
  const coordinates = toLonLat(event.coordinate);
  const longitude = coordinates[0].toFixed(6);
  const latitude = coordinates[1].toFixed(6);

  selectedCoordinates = event.coordinate;

  popup.querySelector('h3').textContent = `
    Masukkan Lokasi:
    Longitude: ${longitude}
    Latitude: ${latitude}
  `;
  popup.classList.remove('hidden');
});

// Add marker when the 'Add Marker' button is clicked
addMarkerButton.addEventListener('click', () => {
  const description = descriptionInput.value.trim();
  if (description && selectedCoordinates) {
    const marker = new Feature({
      geometry: new Point(selectedCoordinates),
      description: description,
      longitude: toLonLat(selectedCoordinates)[0].toFixed(6),
      latitude: toLonLat(selectedCoordinates)[1].toFixed(6),
    });

    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scale: 0.05,
        }),
      })
    );

    markerSource.addFeature(marker);
    popup.classList.add('hidden');
    descriptionInput.value = '';
  }
});

// Hide the popup when 'Cancel' button is clicked
cancelButton.addEventListener('click', () => {
  popup.classList.add('hidden');
  descriptionInput.value = '';
});

// Display marker details when a marker is clicked
map.on('click', (event) => {
  map.forEachFeatureAtPixel(event.pixel, (feature) => {
    const description = feature.get('description');
    const longitude = feature.get('longitude');
    const latitude = feature.get('latitude');
    
    if (description) {
      const infoPopup = document.createElement('div');
      infoPopup.className = 'popup';
      infoPopup.innerHTML = `
        <div class="popup-content">
          <h3>Informasi Marker:</h3>
          <p><strong>Deskripsi:</strong> ${description}</p>
          <p><strong>Longitude:</strong> ${longitude}</p>
          <p><strong>Latitude:</strong> ${latitude}</p>
          <button id="close-info">Tutup</button>
        </div>
      `;
      document.body.appendChild(infoPopup);

      infoPopup.querySelector('#close-info').addEventListener('click', () => {
        infoPopup.remove();
      });
    }
  });
});

// Function to add user's location marker
function addUserLocationMarker() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoordinates = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        console.log("Koordinat pengguna berhasil diperoleh:", userCoordinates);

        const userMarker = new Feature({
          geometry: new Point(fromLonLat(userCoordinates)),
        });

        userMarker.setStyle(
          new Style({
            image: new Icon({
              src: 'https://cdn-icons-png.flaticon.com/512/64/64113.png', // User icon
              scale: 0.05,
              anchor: [0.5, 1],
            }),
          })
        );

        const userLayer = new VectorLayer({
          source: new VectorSource({
            features: [userMarker],
          }),
        });

        map.addLayer(userLayer);

        map.getView().animate({
          center: fromLonLat(userCoordinates),
          zoom: 16,
        });

        // Find nearest parking location
        const nearestLocation = findNearestLocation(userCoordinates, parkingLocations);
        if (nearestLocation) {
          const nearestMarker = new Feature({
            geometry: new Point(fromLonLat(nearestLocation.coordinates)),
            description: nearestLocation.name,
          });

          nearestMarker.setStyle(
            new Style({
              image: new Icon({
                src: 'https://cdn-icons-png.flaticon.com/512/854/854878.png', // Nearest location icon
                scale: 0.05,
              }),
            })
          );

          markerSource.addFeature(nearestMarker);

          // Show notification for nearest parking
          Swal.fire({
            title: "Lokasi Terdekat",
            text: `Lokasi terdekat adalah ${nearestLocation.name}.`,
            icon: "info",
          });
        }
      },
      (error) => {
        console.error("Gagal mendapatkan lokasi pengguna:", error.message);
        Swal.fire({
          title: "Lokasi tidak tersedia",
          text: "Pastikan fitur lokasi di perangkat Anda aktif.",
          icon: "error",
        });
      }
    );
  } else {
    Swal.fire({
      title: "Geolokasi tidak didukung",
      text: "Perangkat Anda tidak mendukung geolokasi.",
      icon: "warning",
    });
  }
}

// Parking locations array
const parkingLocations = [
  { name: "Lokasi Terdekat", coordinates: [107.580642, -6.883722] },
  { name: "lokasi terdekat adalah", coordinates: [107.579529, -6.882788] },
];

// Function to find the nearest parking location
function findNearestLocation(userCoordinates, locations) {
  let nearest = null;
  let minDistance = Infinity;

  locations.forEach((location) => {
    const distance = turf.distance(
      turf.point(userCoordinates),
      turf.point(location.coordinates)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  });

  return nearest;
}

// Initialize the user's location marker
addUserLocationMarker();
