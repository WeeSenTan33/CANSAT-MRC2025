const socket = io(); // Connect to the Socket.io server

// Get the context for the temperature graph
const tempCtx = document.getElementById('liveGraphTemp').getContext('2d');

const tempData = {
    labels: [],
    datasets: [{
        label: 'Temperature',
        borderColor: 'rgb(64, 224, 208)',
        backgroundColor: 'rgba(64, 224, 208, 0.2)',
        data: [],
        fill: false,
        tension: 0.1
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
                        return (value / 1000).toFixed(0);
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
            duration: 0
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

function updateTempGraph(temperature) {
    const now = Date.now();
    const label = now;

    if (tempData.labels.length >= 50) {
        tempData.labels.shift();
        tempData.datasets[0].data.shift();
    }

    tempData.labels.push(label);
    tempData.datasets[0].data.push({ x: label, y: temperature });

    tempChart.update();
}

socket.on('temperature-data', function(temperature) {
    console.log('Temperature received:', temperature);
    updateTempGraph(temperature);
});
