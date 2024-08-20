const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = new SerialPort({
    path: process.env.SERIAL_PORT || '/dev/ttyUSB0', // Use environment variable or default path
    baudRate: parseInt(process.env.BAUD_RATE, 10) || 9600 // Use environment variable or default baud rate
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (data) => {
    try {
        // Basic validation to check if data format is correct
        if (data.split(',').length === 17) {
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
        packetCount, date, time, temp, pressure, altitude, latitude, longitude, satellites,
        ax, ay, az, gx, gy, gz, mx, my, mz
    ] = data.split(',');

    return {
        packetCount,
        date,
        time,
        temp: parseFloat(temp),
        pressure: parseFloat(pressure),
        altitude: parseFloat(altitude),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        satellites: parseInt(satellites, 10),
        ax: parseFloat(ax),
        ay: parseFloat(ay),
        az: parseFloat(az),
        gx: parseFloat(gx),
        gy: parseFloat(gy),
        gz: parseFloat(gz),
        mx: parseFloat(mx),
        my: parseFloat(my),
        mz: parseFloat(mz)
    };
}

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
