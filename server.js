const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws');
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

// Set up WebSocket server
const wss = new WebSocket.Server({ port: 5678 });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
        console.log(`Received message from client: ${message}`);
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

parser.on('data', (data) => {
    console.log('Received data:', data);

    // Parse the data
    const parsedData = parseSerialData(data);

    // Emit the parsed data to all connected Socket.IO clients
    io.emit('serialData', parsedData);

    // Prepare and emit gyroscope data via WebSocket
    const gyroData = {
        gx: parseFloat(parsedData.gx),
        gy: parseFloat(parsedData.gy),
        gz: parseFloat(parsedData.gz)
    };

    // Broadcast gyroscope data to all WebSocket clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gyroData));
        }
    });
});

// Function to parse data from serial port
function parseSerialData(data) {
    const [
        packet, date, time, temp, pressure, altitude, latitude, longitude, satellites, speed,
        gx, gy, gz, orientationUpward, ax, ay, az, acceleration
    ] = data.split(',');

    return {
        packet,
        date,
        time,
        temp,
        pressure,
        altitude,
        latitude,
        longitude,
        satellites, 
        speed,
        gx, 
        gy, 
        gz, 
        orientationUpward, 
        ax, 
        ay, 
        az, 
        acceleration
    };
}

// Serve static files from 'public' directory
app.use(express.static('public'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
