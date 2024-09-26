let map;
let marker;
let polyline;
let path = [];
let directionsService;

// Configurar Flatpickr para el rango de fechas
flatpickr("#date-range", {
    mode: "range",
    dateFormat: "Y-m-d", // Formato de la fecha
    allowInput: true // Permitir que el usuario escriba la fecha manualmente si quiere
});

// Configurar Flatpickr para el rango de horas (opcional)
flatpickr("#time-range", {
    enableTime: true,
    noCalendar: true, // Solo para horas
    dateFormat: "H:i", // Formato de hora 24h
    time_24hr: true,
    mode: "range" // Permite seleccionar un rango de horas
});

// Función para manejar la validación y el envío de la consulta
document.getElementById('submit-btn').addEventListener('click', () => {
    const dateRange = document.getElementById('date-range').value;
    const timeRange = document.getElementById('time-range').value;

    if (!dateRange) {
        alert('Debes seleccionar un rango de fechas.');
        return;
    }

    const dates = dateRange.split(" to ");
    const startDate = dates[0];
    const endDate = dates[1] || startDate; // Si no hay fecha final, se toma solo el primer día

    let startTime, endTime;

    if (timeRange) {
        const times = timeRange.split(" to ");
        startTime = times[0];
        endTime = times[1] || '23:59';

        if (startDate === endDate && startTime >= endTime) {
            alert('El rango de horas es incorrecto. La hora de inicio debe ser menor que la hora de fin.');
            return;
        }
    }

    // Enviar la solicitud al servidor
    fetchHistoricalData(startDate, endDate, startTime, endTime);
});


// Función para hacer la solicitud de datos históricos al servidor
function fetchHistoricalData(startDate, endDate, startTime = '00:00', endTime = '23:59') {
    const query = {
        startDate,
        endDate,
        startTime,
        endTime
    };

    // Realizar solicitud al servidor
    fetch('/historical_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
    })
    .then(response => response.json())
    .then(data => {
        displayHistoricalDataOnMap(data.locations); // Mostrar los datos en el mapa
    })
    .catch(err => {
        console.error('Error fetching historical data:', err);
        alert('Hubo un error al obtener los datos históricos.');
    });
}

// Función para mostrar los datos históricos en el mapa
function displayHistoricalDataOnMap(locations) {
    path = []; // Reiniciar la ruta

    // Recorrer las ubicaciones y agregarlas al mapa
    locations.forEach(loc => {
        const latLng = new google.maps.LatLng(loc.latitude, loc.longitude);
        path.push(latLng);
    });

    if (path.length > 0) {
        polyline.setPath(path);
        map.setCenter(path[0]); // Centrar el mapa en la primera ubicación

        // Ajustar el zoom para ver toda la ruta
        const bounds = new google.maps.LatLngBounds();
        path.forEach(point => bounds.extend(point));
        map.fitBounds(bounds);
    }
}

// Inicializar el mapa de Google Maps
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 14
    });

    polyline = new google.maps.Polyline({
        path: path,
        strokeColor: '#6F2F9E',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        geodesic: true,
        map: map
    });

    directionsService = new google.maps.DirectionsService();
}

// Cargar el mapa con la clave de la API de Google Maps
function loadMap() {
    fetch('/api_key')
        .then(response => response.json())
        .then(data => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMap`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        })
        .catch(err => console.error('Error fetching API key:', err));
}



loadMap(); // Cargar el mapa al cargar la página
