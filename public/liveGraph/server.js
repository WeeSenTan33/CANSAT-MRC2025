const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (like your HTML, CSS, and client-side JS)
app.use(express.static('public'));

// Initialize the serial port
const port = new SerialPort('COM10', { baudRate: 9600 });

// Use Readline parser to read the data from the serial port
const parser = port.pipe(new Readline({ delimiter: '\n' }));

// Listen for data on the serial port
parser.on('data', (data) => {
    console.log('Received data:', data);
    // Emit the data to all connected WebSocket clients
    io.emit('serialData', parseSerialData(data));
});

// Parse the incoming serial data (assuming the same format as before)
function parseSerialData(data) {
    const [temp, pressure, altitude, latitude, longitude, , , velocity] = data.trim().split(',');
    return { temp, pressure, altitude, latitude, longitude, velocity };
}

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
