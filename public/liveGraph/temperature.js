const socket = io('http://127.0.0.1:5500'); // Connect to the Socket.io server

socket.on('temperature-data', function(temperature) {
    console.log('Temperature received:', temperature);
    updateTemperatureGraph(temperature);
});

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
