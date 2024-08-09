function initMap() {
    const mapOptions = {
        center: { lat: 38.2323, lng: 24.067 },
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    window.map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function updateMap(latitude, longitude) {
    if (window.map) {
        const position = { lat: latitude, lng: longitude };
        window.map.setCenter(position);
        new google.maps.Marker({
            position: position,
            map: window.map
        });
    }
}

function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAFlntHbx9kufQHz-R4w9mNwp0XbU8cW4A&callback=initMap`;
    script.defer = true;
    document.head.appendChild(script);
}

window.onload = loadGoogleMaps;
