// server.js (FIXED: delimiter is a STRING, not RegExp)
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const HTTP_PORT   = Number(process.env.HTTP_PORT || 3000);
const SERIAL_PATH = process.env.SERIAL_PORT || '';        // e.g. COM5 or /dev/ttyACM0
const SERIAL_BAUD = Number(process.env.SERIAL_BAUD || 9600);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

server.listen(HTTP_PORT, () => console.log(`✅ UI: http://localhost:${HTTP_PORT}`));

io.on('connection', s => {
  console.log('🌐 Browser connected');
  s.on('disconnect', () => console.log('🌐 Browser disconnected'));
});

function emitClean(obj) {
  const clean = Object.fromEntries(Object.entries(obj).filter(([, v]) =>
    v !== undefined && v !== null && v !== ''
  ));
  if (Object.keys(clean).length) {
    io.emit('serialData', clean);
    console.log('→', clean); // keep ON for now so you can see parsed output
  }
}

/* ---------- Parsers (JSON / CSV / Labeled) ---------- */
function parseJSON(line) {
  try { return JSON.parse(line); } catch { return {}; }
}

function parseCSV(line) {
  // 0:Timestamp_ms,1:Date,2:Time_MYT,3:Latitude,4:Longitude,5:GPS_Alt_m,6:Sats,
  // 7:BMP_Temp_C,8:Pressure_hPa,9:Baro_Alt_m,10:AccelX,11:AccelY,12:AccelZ,
  // 13:GyroX,14:GyroY,15:GyroZ,16:MagX,17:MagY,18:MagZ
  const p = line.split(',').map(s => s.trim());
  if (p.length < 10) return {};
  const out = {};
  if (p[1]) out.date = p[1];
  if (p[2]) out.time = p[2];
  if (p[3]) out.latitude  = +p[3];
  if (p[4]) out.longitude = +p[4];
  if (p[9]) out.altitude  = +p[9]; else if (p[5]) out.altitude = +p[5];
  if (p[7]) out.temp     = +p[7];
  if (p[8]) out.pressure = Math.round(+p[8] * 100); // hPa → Pa
  if (p[13]) out.gx = +p[13];
  if (p[14]) out.gy = +p[14];
  if (p[15]) out.gz = +p[15];
  return out;
}

function parseLabeled(line) {
  const out = {};
  let m;
  m = line.match(/Lat:\s*(-?\d+(?:\.\d+)?).*?Lon:\s*(-?\d+(?:\.\d+)?)/i);
  if (m) { out.latitude = +m[1]; out.longitude = +m[2]; }
  m = line.match(/Alt:\s*(-?\d+(?:\.\d+)?)\s*m/i);
  if (m) out.altitude = +m[1];
  m = line.match(/Speed:\s*(-?\d+(?:\.\d+)?)\s*km\/h/i);
  if (m) out.speed = (+m[1]) / 3.6; // km/h → m/s
  m = line.match(/Date:\s*(\d{4}-\d{1,2}-\d{1,2})/i);
  if (m) out.date = m[1];
  m = line.match(/Time\(UTC\):\s*(\d{2}:\d{2}:\d{2})/i);
  if (m) out.time = m[1];
  m = line.match(/Temp:\s*(-?\d+(?:\.\d+)?)\s*C/i);
  if (m) out.temp = +m[1];
  m = line.match(/Press:\s*(-?\d+(?:\.\d+)?)\s*hPa/i);
  if (m) out.pressure = Math.round(+m[1] * 100);
  m = line.match(/BaroAlt:\s*(-?\d+(?:\.\d+)?)\s*m/i);
  if (m) out.altitude = Number.isFinite(+m[1]) ? +m[1] : out.altitude;
  m = line.match(/Gyro\[dps\]:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) { out.gx = +m[1]; out.gy = +m[2]; out.gz = +m[3]; }
  return out;
}

function parseLine(line) {
  const s = String(line).trim();
  if (!s) return {};
  if (s.startsWith('{') && s.endsWith('}')) return parseJSON(s);
  const commas = (s.match(/,/g) || []).length;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  if (commas >= 10 && letters < 30) return parseCSV(s);
  return parseLabeled(s);
}
/* --------------------------------------------------- */

let port, parser;

async function pickSerial() {
  if (SERIAL_PATH) return SERIAL_PATH;
  const list = await SerialPort.list();
  const cand = list.find(p =>
    /arduino|wch|usbserial|usbmodem|ftdi/i.test(`${p.manufacturer} ${p.path} ${p.friendlyName}`)
  ) || list[0];
  if (!cand) throw new Error('No serial ports. Set SERIAL_PORT=COMx or /dev/ttyACM0');
  console.log(`🔎 Auto-selected ${cand.path}`);
  return cand.path;
}

(async () => {
  try {
    const pathSel = await pickSerial();
    port = new SerialPort({ path: pathSel, baudRate: SERIAL_BAUD });

    // *** FIXED: use '\n' (string) for delimiter ***
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    console.log(`🔌 Serial: ${pathSel} @ ${SERIAL_BAUD}`);
    console.log('⚠️  Close the Arduino Serial Monitor (only one app can open the port).');

    parser.on('data', (line) => {
      const raw = String(line).trim();
      if (!raw) return;
      // Debug raw lines for a moment to prove data is flowing:
      console.log('RAW:', raw);
      const data = parseLine(raw);
      if (Object.keys(data).length) emitClean(data);
    });

    port.on('error', e => console.error('Serial error:', e.message));
    port.on('close', () => console.log('Serial closed'));
  } catch (e) {
    console.error('Serial setup failed:', e.message);
  }
})();
