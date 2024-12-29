class LocationTracker {
    constructor() {
        this.map = null;
        this.marker = null;
        this.watchId = null;
        this.stadiaApiKey = 'YOUR-API-KEY'; // Replace with actual key in production
        
        this.init();
    }

    init() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.requestLocation();
    }

    showError(message) {
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorAlert.style.display = 'block';
        
        // Hide loading overlay if it's still visible
        document.getElementById('loading-overlay').style.display = 'none';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }

    initMap(position) {
        const { latitude, longitude } = position.coords;

        this.map = new maplibregl.Map({
            container: 'map',
            style: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${this.stadiaApiKey}`,
            center: [longitude, latitude],
            zoom: 15
        });

        this.map.on('load', () => {
            // Hide loading overlay
            document.getElementById('loading-overlay').style.display = 'none';
            
            // Add marker
            this.updateMarker(position);
            
            // Start watching position
            this.watchLocation();
        });
    }

    updateMarker(position) {
        const { latitude, longitude } = position.coords;
        
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
                this.initMap(position);
            },
            (error) => {
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
                this.updateMarker(position);
            },
            (error) => {
                this.showError("Error updating location: " + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

// Initialize the location tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LocationTracker();
});
