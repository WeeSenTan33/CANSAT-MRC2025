const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { SerialPort } = require('serialport'); // Destructure SerialPort from 'serialport'
const { ReadlineParser } = require('@serialport/parser-readline'); // Import ReadlineParser as a function

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up SerialPort with proper initialization
const port = new SerialPort({
    path: 'COM10', // Update the COM port if needed
    baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

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
