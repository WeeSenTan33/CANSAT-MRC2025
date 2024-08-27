const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = new SerialPort({
    path: process.env.SERIAL_PORT || 'COM10', // Use environment variable or default to COM10
    baudRate: parseInt(process.env.BAUD_RATE, 10) || 9600 // Use environment variable or default baud rate
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (data) => {
    try {
        // Basic validation to check if data format is correct
        if (data.split(',').length === 18) { // Expecting 18 fields
            const parsedData = parseSerialData(data);
            io.emit('serialData', parsedData);
        } else {
            console.error('Invalid data format:', data);
        }
    } catch (error) {
        console.error('Error parsing data:', error);
    }
});

parser.on('error', (err) => {
    console.error('Serial port error:', err);
});

function parseSerialData(data) {
    const [
        hi, packet, date, time, temp, pressure, altitude, lat, log, num_satellites,
        speed, gx, gy, gz, orientation_upward, ax, ay, az, acceleration
    ] = data.split(',');

    return {
        packet,
        date,
        time,
        temp: parseFloat(temp),
        pressure: parseFloat(pressure),
        altitude: parseFloat(altitude),
        lat: parseFloat(lat),
        log: parseFloat(log),
        num_satellites: parseInt(num_satellites, 10),
        speed: parseFloat(speed),
        gx: parseFloat(gx),
        gy: parseFloat(gy),
        gz: parseFloat(gz),
        orientation_upward,
        ax: parseFloat(ax),
        ay: parseFloat(ay),
        az: parseFloat(az),
        acceleration: parseFloat(acceleration)
    };
}

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
