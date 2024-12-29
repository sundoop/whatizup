class LocationTracker {
    constructor() {
        this.map = null;
        this.marker = null;
        this.watchId = null;
        this.stadiaApiKey = window.STADIA_API_KEY;
        this.retryCount = 0;
        this.maxRetries = 3;

        // Update loading text
        document.getElementById('loading-text').textContent = 'Checking configuration...';

        // Validate API key before initialization
        if (!this.stadiaApiKey) {
            this.showError('Stadia Maps API key is not configured', false);
            console.error('Missing Stadia Maps API key');
            return;
        }

        console.log('LocationTracker initialized with API key present');
        this.init();
    }

    init() {
        document.getElementById('loading-text').textContent = 'Requesting location permission...';

        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            console.error('Geolocation API not supported');
            return;
        }

        console.log('Requesting initial location...');
        this.requestLocation();
    }

    showError(message, isTemporary = false) {
        console.error('Error:', message);
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorAlert.style.display = 'block';

        // Hide loading overlay if it's still visible
        document.getElementById('loading-overlay').style.display = 'none';

        // Hide error after 5 seconds if it's temporary
        if (isTemporary) {
            setTimeout(() => {
                errorAlert.style.display = 'none';
            }, 5000);
        }
    }

    initMap(position) {
        const { latitude, longitude } = position.coords;
        console.log(`Initializing map at coordinates: ${latitude}, ${longitude}`);

        document.getElementById('loading-text').textContent = 'Loading map...';

        try {
            // Create map instance
            this.map = new maplibregl.Map({
                container: 'map',
                style: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${this.stadiaApiKey}`,
                center: [longitude, latitude],
                zoom: 15,
                failIfMajorPerformanceCaveat: true
            });

            // Set up event listeners
            this.map.once('load', () => {
                console.log('Map loaded successfully');
                document.getElementById('loading-overlay').style.display = 'none';
                this.updateMarker(position);
                this.watchLocation();
            });

            this.map.on('error', (e) => {
                console.error('Map error:', e);
                this.showError(`Error loading map: ${e.error.message || 'Failed to load map tiles'}`, false);
            });

            // Add timeout for map loading
            setTimeout(() => {
                if (document.getElementById('loading-overlay').style.display !== 'none') {
                    console.error('Map load timeout');
                    this.showError('Map is taking too long to load. Please refresh the page.', false);
                }
            }, 15000);

        } catch (error) {
            console.error('Error creating map:', error);
            this.showError(`Failed to initialize map: ${error.message}`);
        }
    }

    updateMarker(position) {
        const { latitude, longitude } = position.coords;
        console.log(`Updating marker position: ${latitude}, ${longitude}`);

        // Update coordinates display
        document.getElementById('coordinates').textContent = 
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        // Remove existing marker if it exists
        if (this.marker) {
            this.marker.remove();
        }

        // Create new marker
        this.marker = new maplibregl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(this.map);

        // Center map on new position
        this.map.easeTo({
            center: [longitude, latitude],
            duration: 1000
        });
    }

    requestLocation() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Got initial position:', position);
                this.initMap(position);
                this.retryCount = 0; // Reset retry count on success
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                    default:
                        errorMessage = "An unknown error occurred.";
                }
                this.showError(errorMessage);

                // Retry on timeout if we haven't exceeded max retries
                if (error.code === error.TIMEOUT && this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`Retrying location request (${this.retryCount}/${this.maxRetries})...`);
                    setTimeout(() => this.requestLocation(), 2000);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    watchLocation() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                console.log('Position updated:', position);
                this.updateMarker(position);
            },
            (error) => {
                console.error('Watch position error:', error);
                if (error.code === error.TIMEOUT) {
                    // On timeout, try to restart the watch
                    console.log('Attempting to restart position watch...');
                    setTimeout(() => this.watchLocation(), 1000);
                } else {
                    this.showError("Error updating location: " + error.message);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 30000, // Increased timeout to 30 seconds
                maximumAge: 5000 // Allow positions up to 5 seconds old
            }
        );
    }
}

// Initialize the location tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing LocationTracker');
    new LocationTracker();
});