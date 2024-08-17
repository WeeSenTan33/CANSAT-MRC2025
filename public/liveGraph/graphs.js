const socket = io(); // Establish WebSocket connection

// Function to create Chart.js graphs
const createChart = (ctx, label, yAxisLabel) => {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                borderColor: 'rgb(64, 224, 208)',
                backgroundColor: 'rgba(64, 224, 208, 0.2)',
                data: [],
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (ms)'
                    },
                    ticks: {
                        callback: function(value) {
                            return (value / 1000).toFixed(0);
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            },
            animation: {
                duration: 0
            },
            plugins: {
                title: {
                    display: true,
                    text: label
                }
            }
        }
    });
};

const tempChart = createChart(document.getElementById('liveGraphTemp').getContext('2d'), 'Temperature', '°C');
const altitudeChart = createChart(document.getElementById('liveGraphAltitude').getContext('2d'), 'Altitude', 'm');
const pressureChart = createChart(document.getElementById('liveGraphPressure').getContext('2d'), 'Pressure', 'hPa');
const velocityChart = createChart(document.getElementById('liveGraphVelocity').getContext('2d'), 'Velocity', 'km/h');

// Function to create and update the descent path graph using Plotly.js
const createDescentGraph = () => {
    const layout = {
        title: 'Descent Path',
        scene: {
            xaxis: { title: 'Time (s)' },
            yaxis: { title: 'Altitude (m)' },
            zaxis: { title: 'Distance (m)' }
        }
    };
    window.Plotly.newPlot('descentGraph', [{
        type: 'scatter3d',
        mode: 'lines',
        line: { color: 'rgb(64, 224, 208)', width: 2 },
        x: [],
        y: [],
        z: []
    }], layout);
};

createDescentGraph();

// Function to update all graphs and status display with new data
function updateGraphs(data) {
    const now = Date.now();
    const { temp, altitude, pressure, velocity, latitude, longitude } = data;

    // Update the status display
    document.getElementById('status-latitude').textContent = `Latitude: ${latitude}°`;
    document.getElementById('status-longitude').textContent = `Longitude: ${longitude}°`;
    document.getElementById('status-temperature').textContent = `Temperature: ${temp}°C`;
    document.getElementById('status-height').textContent = `Height: ${altitude}m`;
    document.getElementById('status-pressure').textContent = `Pressure: ${pressure}hPa`;

    // Update the charts
    if (tempChart.data.labels.length >= 50) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
        altitudeChart.data.labels.shift();
        altitudeChart.data.datasets[0].data.shift();
        pressureChart.data.labels.shift();
        pressureChart.data.datasets[0].data.shift();
        velocityChart.data.labels.shift();
        velocityChart.data.datasets[0].data.shift();
    }

    tempChart.data.labels.push(now);
    tempChart.data.datasets[0].data.push({ x: now, y: parseFloat(temp) });
    tempChart.update();

    altitudeChart.data.labels.push(now);
    altitudeChart.data.datasets[0].data.push({ x: now, y: parseFloat(altitude) });
    altitudeChart.update();

    pressureChart.data.labels.push(now);
    pressureChart.data.datasets[0].data.push({ x: now, y: parseFloat(pressure) });
    pressureChart.update();

    velocityChart.data.labels.push(now);
    velocityChart.data.datasets[0].data.push({ x: now, y: parseFloat(velocity) });
    velocityChart.update();

    // Update descent graph
    const descentGraph = window.Plotly.getPlot('descentGraph');
    const descentData = descentGraph.data[0];
    if (descentData.x.length >= 50) {
        descentData.x.shift();
        descentData.y.shift();
        descentData.z.shift();
    }
    descentData.x.push(now);
    descentData.y.push(parseFloat(altitude));
    descentData.z.push(0); // Replace with actual distance data
    window.Plotly.update('descentGraph', { x: [descentData.x], y: [descentData.y], z: [descentData.z] });

    // Update Google Maps
    updateMap(parseFloat(latitude), parseFloat(longitude));
}

// Handle incoming data from the WebSocket connection
socket.on('serialData', function(data) {
    updateGraphs(data);
});

// Handle manual data input
function sendManualData() {
    const data = document.getElementById('manualData').value;
    const parsedData = parseManualData(data);
    updateGraphs(parsedData);
}

// Parse manual data input
function parseManualData(data) {
    const [temp, pressure, altitude, latitude, longitude, , , velocity] = data.trim().split(',');
    return { temp, pressure, altitude, latitude, longitude, velocity };
}
