const tempCtx = document.getElementById('liveGraphTemp').getContext('2d');

const tempData = {
    labels: [], // Initial empty labels
    datasets: [{
        label: 'Temperature',
        borderColor: 'rgb(64, 224, 208)', // Red color for the line
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

// Function to generate random increasing temperature data for demonstration
function generateRandomTempData(prevValue) {
    const fluctuation = Math.random() * 0.2 - 0.1; // Small random fluctuation
    return (prevValue || 27) + fluctuation; // Start around 27°C and fluctuate
}

// Function to update the graph with new data
function updateTempGraph() {
    const now = Date.now();
    const label = now;
    const prevValue = tempData.datasets[0].data.length ? tempData.datasets[0].data[tempData.datasets[0].data.length - 1].y : 27;
    const value = generateRandomTempData(prevValue);

    if (tempData.labels.length >= 50) {
        tempData.labels.shift(); // Remove the first label
        tempData.datasets[0].data.shift(); // Remove the first data point
    }

    tempData.labels.push(label);
    tempData.datasets[0].data.push({ x: label, y: value });

    tempChart.update();
}

// Update the graph every second
setInterval(updateTempGraph, 1000);