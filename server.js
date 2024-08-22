const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up SerialPort to connect to COM10
const port = new SerialPort({
    path: 'COM10', 
    baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (data) => {
    console.log('Received data:', data);

    // Parse the data
    const parsedData = parseSerialData(data);

    // Emit the parsed data to all connected clients via Socket.IO
    io.emit('serialData', parsedData);

    // Prepare and emit gyroscope data via WebSocket
    const gyroData = {
        gx: parseFloat(parsedData.gx),
        gy: parseFloat(parsedData.gy),
        gz: parseFloat(parsedData.gz)
    };

    io.emit('gyroData', gyroData);  // Emit gyro data separately
});

// Function to parse data from serial port
function parseSerialData(data) {
    const [
        packetCount, date, time, temp, pressure, altitude, latitude, longitude, satellites,
        ax, ay, az, gx, gy, gz, mx, my, mz
    ] = data.split(',');

    return {
        packetCount,
        date,
        time,
        temp,
        pressure,
        altitude,
        latitude,
        longitude,
        satellites,
        ax,
        ay,
        az,
        gx,
        gy,
        gz,
        mx,
        my,
        mz
    };
}

// Serve static files from 'public' directory
app.use(express.static('public'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
