// api/serial-data.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const port = new SerialPort({
    path: '/dev/ttyUSB0', // Adjust this for your environment
    baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Store the latest data
let latestData = {};

parser.on('data', (data) => {
    latestData = parseSerialData(data);
});

function parseSerialData(data) {
    const [temp, pressure, altitude, latitude, longitude, , , velocity] = data.split(',');
    return { temp, pressure, altitude, latitude, longitude, velocity };
}

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        res.status(200).json(latestData);
    } else {
        res.status(405).send('Method Not Allowed');
    }
};
