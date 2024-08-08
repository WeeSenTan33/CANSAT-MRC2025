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
                    text: 'Time (s)'
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
