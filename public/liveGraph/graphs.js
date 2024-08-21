const socket = io(); // Establish WebSocket connection

// Function to create Chart.js graphs with a fixed size and scrollable feature
const createChart = (ctx, label, yAxisLabel) => {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                borderColor: 'rgb(128, 0, 128)', // Purple border color
                backgroundColor: 'rgba(128, 0, 128, 0.2)', // Purple background color
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
                        text: 'Time (s)' // Display time in seconds
                    },
                    ticks: {
                        stepSize: 1, // Display every 1 second
                        callback: function(value) {
                            return Math.floor(value); // Display as an integer with no decimal place
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

// Create charts
const tempChart = createChart(document.getElementById('liveGraphTemp').getContext('2d'), 'Temperature', '°C');
const altitudeChart = createChart(document.getElementById('liveGraphAltitude').getContext('2d'), 'Altitude', 'm');
const pressureChart = createChart(document.getElementById('liveGraphPressure').getContext('2d'), 'Pressure', 'hPa');
const velocityChart = createChart(document.getElementById('liveGraphVelocity').getContext('2d'), 'Velocity', 'km/h');

// Function to create and update the descent path graph using Plotly.js
const createDescentGraph = () => {
    const layout = {
        width: 600,
        height: 600,
        title: 'Descent Path (gx, gy, gz)',
        scene: {
            xaxis: { title: 'gx (rad/s)' },
            yaxis: { title: 'gy (rad/s)' },
            zaxis: { title: 'gz (rad/s)' }
        }
    };
    window.Plotly.newPlot('descentGraph', [{
        type: 'scatter3d',
        mode: 'lines',
        line: { color: 'rgb(128, 0, 128)', width: 2 }, // Purple line color
        x: [], // gx values
        y: [], // gy values
        z: []  // gz values
    }], layout);
};

createDescentGraph();

// Function to update all graphs and status display with new data
function updateGraphs(data) {
    const now = Date.now();
    const { temp, altitude, pressure, latitude, longitude, velocity, gx, gy, gz } = data;

    // Convert timestamp to seconds
    const secondsElapsed = Math.floor(now / 1000);

    // Update the status display
    document.getElementById('status-latitude').textContent = `Latitude: ${latitude}°`;
    document.getElementById('status-longitude').textContent = `Longitude: ${longitude}°`;
    document.getElementById('status-temperature').textContent = `Temperature: ${temp}°C`;
    document.getElementById('status-height').textContent = `Height: ${altitude}m`;
    document.getElementById('status-pressure').textContent = `Pressure: ${pressure}hPa`;

    // Update the charts
    tempChart.data.labels.push(secondsElapsed);
    tempChart.data.datasets[0].data.push({ x: secondsElapsed, y: temp });
    tempChart.update();

    altitudeChart.data.labels.push(secondsElapsed);
    altitudeChart.data.datasets[0].data.push({ x: secondsElapsed, y: altitude });
    altitudeChart.update();

    pressureChart.data.labels.push(secondsElapsed);
    pressureChart.data.datasets[0].data.push({ x: secondsElapsed, y: pressure });
    pressureChart.update();

    velocityChart.data.labels.push(secondsElapsed);
    velocityChart.data.datasets[0].data.push({ x: secondsElapsed, y: velocity });
    velocityChart.update();

    // Update descent graph with gx, gy, and gz data
    const descentGraph = window.Plotly.getPlot('descentGraph');
    if (descentGraph) {
        const descentData = descentGraph.data[0];
        descentData.x.push(gx);
        descentData.y.push(gy);
        descentData.z.push(gz);
        window.Plotly.update('descentGraph', { x: [descentData.x], y: [descentData.y], z: [descentData.z] });
    } else {
        console.error('Descent graph not found.');
    }

    // Update Google Maps
    updateMap(latitude, longitude);
}

// Handle incoming data from the WebSocket connection
socket.on('serialData', function(data) {
    updateGraphs(data);
});
