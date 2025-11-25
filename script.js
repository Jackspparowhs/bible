// Import Leaflet library
const L = window.L;

// Initialize map
let map;
let markers = [];
let currentLocationMarker = null;

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Initialize the map on page load
document.addEventListener('DOMContentLoaded', initializeMap);

function initializeMap() {
    // Create map centered on world view
    map = L.map('map').setView([20, 0], 3);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    // Initialize event listeners
    setupEventListeners();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const myLocationBtn = document.getElementById('myLocationBtn');
    const searchResults = document.getElementById('searchResults');

    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('blur', () => {
        setTimeout(() => searchResults.classList.remove('active'), 200);
    });

    // My Location button
    myLocationBtn.addEventListener('click', getCurrentLocation);

    // Map click to place marker
    map.on('click', function(e) {
        placeMarkerAtCoordinates(e.latlng.lat, e.latlng.lng);
    });
}

function handleSearch(e) {
    const query = e.target.value.trim();
    const searchResults = document.getElementById('searchResults');

    if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
    }

    // Search using Nominatim
    fetch(`${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=5`)
        .then(response => response.json())
        .then(data => {
            searchResults.innerHTML = '';

            if (data.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
            } else {
                data.forEach(result => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.textContent = result.display_name;
                    
                    resultItem.addEventListener('click', () => {
                        const lat = parseFloat(result.lat);
                        const lon = parseFloat(result.lon);
                        
                        // Move map to result
                        map.setView([lat, lon], 13);
                        placeMarkerAtCoordinates(lat, lon);
                        
                        // Clear search
                        document.getElementById('searchInput').value = '';
                        searchResults.classList.remove('active');
                    });
                    
                    searchResults.appendChild(resultItem);
                });
            }

            searchResults.classList.add('active');
        })
        .catch(error => {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="search-result-item">Error searching location</div>';
            searchResults.classList.add('active');
        });
}

function getCurrentLocation() {
    const btn = document.getElementById('myLocationBtn');
    btn.style.opacity = '0.6';

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        btn.style.opacity = '1';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Move map to current location
            map.setView([lat, lon], 13);

            // Add or update current location marker
            if (currentLocationMarker) {
                currentLocationMarker.setLatLng([lat, lon]);
            } else {
                currentLocationMarker = L.circleMarker([lat, lon], {
                    radius: 6,
                    fillColor: '#4285F4',
                    color: '#ffffff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                }).addTo(map);
            }

            btn.style.opacity = '1';
        },
        error => {
            console.error('Geolocation error:', error);
            alert('Could not get your location. Please check your browser permissions.');
            btn.style.opacity = '1';
        }
    );
}

function placeMarkerAtCoordinates(lat, lon) {
    // Create custom marker HTML
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';

    // Create marker with custom icon
    const marker = L.marker([lat, lon], {
        icon: L.divIcon({
            html: markerElement.outerHTML,
            iconSize: [32, 32],
            className: 'custom-marker-icon'
        })
    }).addTo(map);

    // Add popup with coordinates
    const popupContent = `
        <strong>Location</strong><br>
        Latitude: ${lat.toFixed(6)}<br>
        Longitude: ${lon.toFixed(6)}<br>
        <small>Click map to place another marker</small>
    `;
    
    marker.bindPopup(popupContent);

    // Store marker for later removal if needed
    markers.push(marker);

    // Open popup
    marker.openPopup();
}

// Debounce function for search
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
