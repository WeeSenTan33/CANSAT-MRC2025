// Initialize the Google Earth view
function initGoogleEarth() {
    const mapOptions = {
        center: { lat: 38.2323, lng: 24.067 }, // Initial coordinates
        zoom: 8, // Initial zoom level
        mapTypeId: google.maps.MapTypeId.SATELLITE // Display as satellite view
    };

    const map = new google.maps.Map(document.getElementById('googleEarthContainer'), mapOptions);

    // Marker to indicate the current position
    const marker = new google.maps.Marker({
        position: mapOptions.center,
        map: map,
        title: 'Current Position'
    });

    // Update the position of the marker every second
    setInterval(() => {
        // Generate new coordinates (this is a placeholder, replace with actual data)
        const newLat = mapOptions.center.lat + (Math.random() - 0.5) * 0.01;
        const newLng = mapOptions.center.lng + (Math.random() - 0.5) * 0.01;

        const newPosition = { lat: newLat, lng: newLng };
        marker.setPosition(newPosition);
        map.panTo(newPosition);
    }, 1000);
}

// Initialize Google Earth when the page loads
window.onload = initGoogleEarth;
