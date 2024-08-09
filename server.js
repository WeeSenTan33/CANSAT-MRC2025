const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = new SerialPort('COM6', { baudRate: 9600 });
const parser = port.pipe(new Readline({ delimiter: '\n' }));

// Serve static files (HTML, JS, CSS)
app.use(express.static('public'));

// Emit data to the client
parser.on('data', (data) => {
    const parsedData = parseSerialData(data);
    io.emit('serialData', parsedData);
});

// Parse the incoming serial data
function parseSerialData(data) {
    const [temp, pressure, alt, lat, long, sat, alt2, speed, date] = data.trim().split(',');
    return { temp, pressure, alt, lat, long, sat, alt2, speed, date };
}

// Listen on port 3000
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
