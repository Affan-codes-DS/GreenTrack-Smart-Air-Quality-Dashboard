// Interactive AQI Map functionality
class AQIMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userLocationMarker = null;
        this.currentLayer = 'aqi';
        this.cityData = {};
        this.isLoading = false;

        // Major cities worldwide with coordinates
        this.cities = [
            // India
            { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
            { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
            { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
            { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
            { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
            { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
            { name: 'Pune', lat: 18.5204, lng: 73.8567 },
            { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
            { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
            { name: 'Gorakhpur', lat: 26.7606, lng: 83.3732 },
            
            // China
            { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
            { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
            { name: 'Guangzhou', lat: 23.1291, lng: 113.2644 },
            { name: 'Shenzhen', lat: 22.5431, lng: 114.0579 },
            { name: 'Chengdu', lat: 30.5728, lng: 104.0668 },
            
            // USA
            { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
            { name: 'New York', lat: 40.7128, lng: -74.0060 },
            { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
            { name: 'Houston', lat: 29.7604, lng: -95.3698 },
            { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
            { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
            
            // Europe
            { name: 'London', lat: 51.5074, lng: -0.1278 },
            { name: 'Paris', lat: 48.8566, lng: 2.3522 },
            { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
            { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
            { name: 'Rome', lat: 41.9028, lng: 12.4964 },
            { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
            { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
            
            // Asia Pacific
            { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
            { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
            { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
            { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
            { name: 'Manila', lat: 14.5995, lng: 120.9842 },
            { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
            { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
            { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
            { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
            
            // Middle East
            { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
            { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
            { name: 'Doha', lat: 25.2854, lng: 51.5310 },
            { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
            { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
            
            // South America
            { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
            { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
            { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
            { name: 'Lima', lat: -12.0464, lng: -77.0428 },
            { name: 'Bogotá', lat: 4.7110, lng: -74.0721 },
            
            // Africa
            { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
            { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
            { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
            { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
            
            // Canada
            { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
            { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
            { name: 'Montreal', lat: 45.5017, lng: -73.5673 }
        ];

        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.initializeMap();
        await this.loadCityData();
        this.setupEventListeners();
        this.showLoading(false);
    }

    async initializeMap() {
        try {
            // Check if Leaflet is loaded
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            // Check if map container exists
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }

            // Initialize Leaflet map centered on world view
            this.map = L.map('map', {
                center: [20, 0], // Center on world view
                zoom: 2,
                minZoom: 2,
                maxZoom: 18,
                zoomControl: true
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Add dark mode support
            this.updateMapTheme();
            
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            showToast('Failed to initialize map: ' + error.message, 'error');
        }
    }

    async loadCityData() {
        this.isLoading = true;
        const promises = this.cities.map(async (city) => {
            try {
                const result = await AQI.fetchAQIData(city.name);
                this.cityData[city.name] = {
                    ...city,
                    ...result.data,
                    isMock: result.isMock,
                    isCached: result.isCached
                };
            } catch (error) {
                console.warn(`Failed to load data for ${city.name}:`, error);
                // Use mock data as fallback
                this.cityData[city.name] = {
                    ...city,
                    ...AQI.getMockData(city.name),
                    isMock: true
                };
            }
        });

        await Promise.allSettled(promises);
        this.updateMarkers();
        this.isLoading = false;
    }

    updateMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        Object.values(this.cityData).forEach(city => {
            const marker = this.createMarker(city);
            if (marker) {
                this.markers.push(marker);
                marker.addTo(this.map);
            }
        });
    }

    createMarker(city) {
        // Get value based on current layer
        let displayValue, displayLabel;
        
        switch(this.currentLayer) {
            case 'pm25':
                displayValue = city.pollutants.pm25 || '--';
                displayLabel = 'PM2.5';
                break;
            case 'pm10':
                displayValue = city.pollutants.pm10 || '--';
                displayLabel = 'PM10';
                break;
            case 'o3':
                displayValue = city.pollutants.o3 || '--';
                displayLabel = 'O₃';
                break;
            case 'no2':
                displayValue = city.pollutants.no2 || '--';
                displayLabel = 'NO₂';
                break;
            case 'aqi':
            default:
                displayValue = city.aqi;
                displayLabel = 'AQI';
                break;
        }

        const aqiLevel = AQI.getAQILevel(city.aqi);
        const size = this.getMarkerSize(city.aqi);
        const color = this.getMarkerColor(aqiLevel.class);

        // Create custom marker icon
        const icon = L.divIcon({
            className: 'aqi-marker',
            html: `
                <div class="marker-content" style="
                    background: ${color};
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: ${Math.max(10, size * 0.35)}px;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                    line-height: 1.1;
                    padding: 4px;
                ">
                    <div style="font-size: ${Math.max(8, size * 0.25)}px; opacity: 0.9;">${displayLabel}</div>
                    <div style="font-size: ${Math.max(11, size * 0.4)}px;">${displayValue}</div>
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });

        const marker = L.marker([city.lat, city.lng], { icon });

        // Add popup
        const popupContent = this.createPopupContent(city);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'aqi-popup'
        });

        return marker;
    }

    createPopupContent(city) {
        const aqiLevel = AQI.getAQILevel(city.aqi);
        const dataSource = city.isMock ? 'Demo Data' : (city.isCached ? 'Cached Data' : 'Live Data');

        return `
            <div class="popup-content">
                <h3>${city.city}</h3>
                <div class="popup-aqi" style="color: var(--aqi-${aqiLevel.class.replace('unhealthy-sensitive', 'unhealthy-sensitive').replace('very-unhealthy', 'very-unhealthy').replace('unhealthy', 'unhealthy')});">
                    <strong>AQI: ${city.aqi}</strong>
                    <span>(${aqiLevel.label})</span>
                </div>
                <div class="popup-pollutants">
                    <div>PM<sub>2.5</sub>: ${city.pollutants.pm25 || '--'} μg/m³</div>
                    <div>PM<sub>10</sub>: ${city.pollutants.pm10 || '--'} μg/m³</div>
                    <div>O₃: ${city.pollutants.o3 || '--'} μg/m³</div>
                    <div>NO₂: ${city.pollutants.no2 || '--'} μg/m³</div>
                </div>
                <div class="popup-meta">
                    <small>Updated: ${new Date(city.time).toLocaleString()}</small><br>
                    <small>Data: ${dataSource}</small>
                </div>
                <button class="popup-btn" onclick="window.location.href='index.html?city=${encodeURIComponent(city.city)}'">
                    View Details
                </button>
            </div>
        `;
    }

    getMarkerSize(aqi) {
        // Size based on AQI severity
        if (aqi <= 50) return 30;
        if (aqi <= 100) return 35;
        if (aqi <= 150) return 40;
        if (aqi <= 200) return 45;
        if (aqi <= 300) return 50;
        return 55;
    }

    getMarkerColor(levelClass) {
        const colors = {
            'good': '#00e400',
            'moderate': '#ffff00',
            'unhealthy-sensitive': '#ff7e00',
            'unhealthy': '#ff0000',
            'very-unhealthy': '#8f3f97',
            'hazardous': '#7e0023'
        };
        return colors[levelClass] || colors.hazardous;
    }

    setupEventListeners() {
        // Layer selector
        document.getElementById('mapLayerSelect').addEventListener('change', (e) => {
            this.currentLayer = e.target.value;
            this.updateMarkers();
            this.updateLegend();
            
            // Show toast notification
            const layerNames = {
                'aqi': 'AQI Levels',
                'pm25': 'PM2.5 Levels',
                'pm10': 'PM10 Levels',
                'o3': 'Ozone Levels',
                'no2': 'NO₂ Levels'
            };
            showToast(`Switched to ${layerNames[e.target.value]}`, 'info');
        });

        // Locate user
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.locateUser();
        });

        // Refresh data
        document.getElementById('refreshMapBtn').addEventListener('click', async () => {
            this.showLoading(true);
            await this.loadCityData();
            this.showLoading(false);
            showToast('Map data refreshed', 'success');
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.updateMapTheme();
        });

        // Listen for theme changes
        window.addEventListener('theme-changed', () => {
            this.updateMapTheme();
        });
    }

    async locateUser() {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by this browser', 'error');
            return;
        }

        showToast('Getting your location...', 'info', 1500);

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            
            // Remove previous user location marker if exists
            if (this.userLocationMarker) {
                this.map.removeLayer(this.userLocationMarker);
            }

            // Create a more visible user location marker
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: `
                    <div style="position: relative;">
                        <div style="
                            background: #667eea;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            border: 4px solid white;
                            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6), 0 0 0 8px rgba(102, 126, 234, 0.2);
                            animation: pulse 2s ease-in-out infinite;
                        "></div>
                        <div style="
                            position: absolute;
                            top: -8px;
                            left: -8px;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            border: 2px solid #667eea;
                            opacity: 0.4;
                            animation: ripple 2s ease-out infinite;
                        "></div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            // Add user location marker with higher z-index
            this.userLocationMarker = L.marker([latitude, longitude], { 
                icon: userIcon,
                zIndexOffset: 1000
            }).addTo(this.map);

            // Fetch AQI data for user location
            showToast('Fetching air quality data...', 'info', 2000);
            
            try {
                // Try to get nearest city data or fetch from coordinates
                const nearestCity = this.findNearestCity(latitude, longitude);
                let locationData;
                
                if (nearestCity && nearestCity.distance < 50) {
                    // Use nearest city data if within 50km
                    locationData = this.cityData[nearestCity.name];
                } else {
                    // Fetch fresh data for these coordinates
                    const result = await AQI.fetchAQIData(`${latitude},${longitude}`);
                    locationData = result.data;
                }
                
                const aqiInfo = AQI.getAQIInfo(locationData.aqi);
                
                // Bind popup with full AQI info
                this.userLocationMarker.bindPopup(`
                    <div class="popup-content">
                        <h3>📍 Your Location</h3>
                        <div class="popup-aqi" style="background: ${aqiInfo.color}; color: white; padding: 16px; border-radius: 12px; margin: 12px 0; text-align: center;">
                            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 4px;">${locationData.aqi}</div>
                            <div style="font-size: 1rem; font-weight: 600;">${aqiInfo.label}</div>
                        </div>
                        <div class="popup-pollutants">
                            <div><strong>PM2.5:</strong> ${locationData.pollutants.pm25} μg/m³</div>
                            <div><strong>PM10:</strong> ${locationData.pollutants.pm10} μg/m³</div>
                            <div><strong>O₃:</strong> ${locationData.pollutants.o3} μg/m³</div>
                            <div><strong>NO₂:</strong> ${locationData.pollutants.no2} μg/m³</div>
                        </div>
                        <div class="popup-meta">
                            <div>Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}</div>
                            ${nearestCity ? `<div>Near ${nearestCity.name} (${nearestCity.distance.toFixed(1)}km)</div>` : ''}
                        </div>
                    </div>
                `, {
                    maxWidth: 300,
                    className: 'aqi-popup'
                }).openPopup();
                
                showToast('Location air quality loaded! 📍', 'success');
            } catch (error) {
                console.error('Error fetching location AQI:', error);
                // Fallback to basic popup
                this.userLocationMarker.bindPopup(`
                    <div class="popup-content">
                        <h3>📍 Your Location</h3>
                        <div style="margin-top: 8px; font-size: 0.9rem;">
                            <div><strong>Latitude:</strong> ${latitude.toFixed(4)}</div>
                            <div><strong>Longitude:</strong> ${longitude.toFixed(4)}</div>
                            <div style="margin-top: 8px; color: #ef4444;">Unable to fetch air quality data</div>
                        </div>
                    </div>
                `, {
                    maxWidth: 250,
                    className: 'aqi-popup'
                }).openPopup();
            }

            // Animate to user location
            this.map.flyTo([latitude, longitude], 12, {
                duration: 1.5
            });

            showToast('Location found! 📍', 'success');
        } catch (error) {
            console.error('Error getting location:', error);
            let errorMessage = 'Unable to get your location';
            
            if (error.code === 1) {
                errorMessage = 'Location access denied. Please enable location permissions.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please try again.';
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
            }
            
            showToast(errorMessage, 'error', 5000);
        }
    }

    updateMapTheme() {
        const isDark = !document.body.classList.contains('theme-light');

        // Update map tiles for theme
        if (isDark) {
            // Dark theme tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);
        } else {
            // Light theme tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
        }
    }

    findNearestCity(lat, lng) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.cities.forEach(city => {
            const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { ...city, distance };
            }
        });
        
        return nearest;
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula for distance in kilometers
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    updateLegend() {
        const legendTitle = document.querySelector('.map-legend h3');
        if (legendTitle) {
            const titles = {
                'aqi': 'AQI Levels',
                'pm25': 'PM2.5 Concentration (μg/m³)',
                'pm10': 'PM10 Concentration (μg/m³)',
                'o3': 'Ozone Concentration (μg/m³)',
                'no2': 'NO₂ Concentration (μg/m³)'
            };
            legendTitle.textContent = titles[this.currentLayer] || 'AQI Levels';
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const mapLoading = document.getElementById('mapLoading');

        if (show) {
            overlay.classList.add('active');
            mapLoading.style.display = 'flex';
        } else {
            overlay.classList.remove('active');
            mapLoading.style.display = 'none';
        }
    }
}

// Global toast function
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Initialize map when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMapPage);
} else {
    // DOM already loaded
    initializeMapPage();
}

function initializeMapPage() {
    console.log('Initializing AQI Map...');

    // Wait a bit for all scripts to load
    setTimeout(() => {
        // Theme setup
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('theme-light', savedTheme === 'light');

        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
                const next = current === 'light' ? 'dark' : 'light';
                document.body.classList.toggle('theme-light', next === 'light');
                localStorage.setItem('theme', next);
                window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: next } }));
            });
        }

        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library failed to load');
            const mapLoading = document.getElementById('mapLoading');
            if (mapLoading) {
                mapLoading.innerHTML = '<p style="color: #ef4444;">Failed to load map library. Please refresh the page.</p>';
            }
            return;
        }

        // Initialize map
        try {
            new AQIMap();
            console.log('AQI Map initialized successfully!');
        } catch (error) {
            console.error('Error initializing map:', error);
            const mapLoading = document.getElementById('mapLoading');
            if (mapLoading) {
                mapLoading.innerHTML = '<p style="color: #ef4444;">Failed to initialize map: ' + error.message + '</p>';
            }
        }
    }, 100);
}
