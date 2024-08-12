const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up SerialPort with proper initialization
const port = new SerialPort('COM10', {
    baudRate: 9600
});

const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

parser.on('data', (data) => {
    console.log('Received data:', data);
    // Emit data to clients
    io.emit('serialData', parseSerialData(data));
});

// Example function to parse data from serial port
function parseSerialData(data) {
    // Implement your parsing logic here
    const [temp, pressure, altitude, latitude, longitude, , , velocity] = data.split(',');
    return { temp, pressure, altitude, latitude, longitude, velocity };
}

// Serve static files from 'public' directory
app.use(express.static('public'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
