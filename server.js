const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport'); // Correct way to import SerialPort in version 12.0.0
const { ReadlineParser } = require('@serialport/parser-readline'); // Correct way to import ReadlineParser
const path = require('path');

// Setup the server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from 'public/liveGraph' directory
app.use(express.static(path.join(__dirname, 'public/liveGraph')));

// Setup serial port
const port = new SerialPort({
    path: 'COM6', // Update port name to COM6
    baudRate: 9600
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// On serial data received
parser.on('data', data => {
    console.log('Received:', data);

    // Extract temperature value from the incoming data
    const temperatureMatch = data.match(/Temperature\s*=\s*([\d.]+)\s*°C/);
    if (temperatureMatch) {
        const temperature = temperatureMatch[1]; // Extracted temperature value
        io.emit('temperature-data', temperature); // Send temperature to all connected clients
    }
});

// Start server
server.listen(5500, () => {
    console.log('Server is running on http://127.0.0.1:5500');
});
