const socket = io('http://localhost:5500'); // Connect to the Socket.io server

// Get the context for the temperature graph
const tempCtx = document.getElementById('liveGraphTemp').getContext('2d');

const tempData = {
    labels: [], // Initial empty labels
    datasets: [{
        label: 'Temperature',
        borderColor: 'rgb(64, 224, 208)', // Line color
        backgroundColor: 'rgba(64, 224, 208, 0.2)',
        data: [], // Initial empty data
        fill: false,
        tension: 0.1 // Smooth the line
    }]
};

const tempConfig = {
    type: 'line',
    data: tempData,
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'time (s)'
                },
                ticks: {
                    callback: function(value) {
                        return (value / 1000).toFixed(0); // Format X-axis labels as time in seconds
                    }
                }
            },
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: '°C'
                }
            }
        },
        animation: {
            duration: 0 // Disable animations for live updates
        },
        plugins: {
            title: {
                display: true,
                text: 'Temperature'
            }
        }
    }
};

const tempChart = new Chart(tempCtx, tempConfig);

// Function to update the temperature graph with new data
function updateTemperatureGraph(temperature) {
    const now = Date.now();

    if (tempData.labels.length >= 50) {
        tempData.labels.shift(); // Remove the first label
        tempData.datasets[0].data.shift(); // Remove the first data point
    }

    tempData.labels.push(now);
    tempData.datasets[0].data.push({ x: now, y: parseFloat(temperature) });

    tempChart.update();
}

// Function to handle incoming data
socket.on('temperature-data', function(temperature) {
    console.log('Temperature received:', temperature);
    updateTemperatureGraph(temperature);
});
