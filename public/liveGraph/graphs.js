// ===== Global Chart.js defaults =====
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// ===== Socket.IO (single instance, explicit URL) =====
const socket = io('http://localhost:3000', { transports: ['websocket', 'polling'] });
socket.on('connect',      () => console.log('socket.io connected'));
socket.on('connect_error',err => console.warn('socket.io error:', err?.message));

// ===== Connection status indicator =====
const connDot  = document.getElementById('connDot');
const connText = document.getElementById('connText');

function setConnectedUI(isConnected) {
  if (!connDot || !connText) return;
  connDot.classList.remove('offline', 'online');
  connDot.classList.add(isConnected ? 'online' : 'offline');
  connText.textContent = isConnected ? 'Connected' : 'Disconnected';
}

socket.on('connect',      () => setConnectedUI(true));
socket.on('disconnect',   () => setConnectedUI(false));
socket.on('connect_error',() => setConnectedUI(false));

// ===== X-axis in seconds since first packet =====
const MAX_POINTS = 600;
let t0Sec = null;
function relSeconds() {
  const s = performance.now() / 1000;
  if (t0Sec === null) t0Sec = s;
  return +(s - t0Sec).toFixed(1);
}

const two = v => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};

function createTimeChart(canvasEl, label, yAxisLabel) {
  if (!canvasEl) return null;
  return new Chart(canvasEl, {
    type: 'line',
    data: { datasets: [{
      label, data: [], borderWidth: 1.6, pointRadius: 0, tension: 0.1,
      borderColor: 'rgba(232, 225, 232, 1)',
      backgroundColor: 'rgba(128, 0, 128, 0.2)', fill: false
    }]},
    options: {
      parsing: false, normalized: true, animation: { duration: 0 }, responsive: true,
      maintainAspectRatio: false, layout: { padding: { bottom: 18 } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Time (s)' },
             ticks: { autoSkip: true, maxTicksLimit: 8, callback: v => Math.floor(v) } },
        y: { beginAtZero: false, title: { display: false, text: yAxisLabel },
             ticks: { callback: v => Number(v).toFixed(2) } }
      },
      plugins: { title: { display: false, text: label }, legend: { display: false } }
    }
  });
}

function pushPoint(chart, yVal) {
  if (!chart || yVal == null) return;
  const ds = chart.data.datasets[0];
  ds.data.push({ x: relSeconds(), y: two(yVal) });
  if (ds.data.length > MAX_POINTS) ds.data.shift();
  chart.update('none');
}

// ===== Create charts =====
const tempChart     = createTimeChart(document.getElementById('liveGraphTemp'),      'Temperature', '°C');
const altitudeChart = createTimeChart(document.getElementById('liveGraphAltitude'),  'Altitude',    'm');
const pressureChart = createTimeChart(document.getElementById('liveGraphPressure'),  'Pressure',    'Pa');
const accelChart    = createTimeChart(document.getElementById('liveGraphAccel'),     'Acceleration', 'm/s²');

// ===== Map updater (Leaflet) =====
let pendingPos = null;
function tryUpdateMap(lat, lng) {
  if (typeof window.updateMap === 'function') {
    window.updateMap(lat, lng);
  } else {
    pendingPos = [lat, lng];
  }
}
setInterval(() => {
  if (pendingPos && typeof window.updateMap === 'function') {
    const [la, ln] = pendingPos; pendingPos = null; window.updateMap(la, ln);
  }
}, 500);

// ===== Telemetry handler =====
function updateGraphs(data) {
  if (typeof window.__markTelemetry === 'function') window.__markTelemetry();

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  if (data.date) setText('status-date', String(data.date));
  if (data.time) setText('status-time', String(data.time));

  const lat = data.latitude ?? data.lat;
  const lng = data.longitude ?? data.log;
  if (lat != null) setText('status-latitude',  `${Number(lat).toFixed(6)}°`);
  if (lng != null) setText('status-longitude', `${Number(lng).toFixed(6)}°`);

  if (data.temp     != null) setText('status-temperature', `${Number(data.temp).toFixed(2)}°C`);
  if (data.altitude != null) setText('status-height',      `${Math.round(Number(data.altitude))} m`);
  if (data.pressure != null) setText('status-pressure',    `${Math.round(Number(data.pressure))} Pa`);
  if (data.vz         != null) setText('status-vz', `${Number(data.vz).toFixed(2)} m/s`);
  const satVal = data.satellites ?? data.sat;
  const satCount = document.getElementById('status-satcount');
  if (satCount && satVal != null && satVal >= 0) {
    satCount.textContent = satVal;
    satCount.style.color = satVal < 4 ? 'var(--err)' : 'var(--ok)';
  } else if (satCount) {
    satCount.textContent = '—';
    satCount.style.color = 'var(--muted)';
  }
  
  const hdop = document.getElementById('status-hdop');
  if (data.hdop != null) {
    const value = Number(data.hdop);
    hdop.textContent = value.toFixed(1);
    hdop.style.color = value > 2.5 ? 'var(--err)' : 'var(--ok)';
  }

  if (data.temp     != null) pushPoint(tempChart,     data.temp);
  if (data.altitude != null) pushPoint(altitudeChart, data.altitude);
  if (data.pressure != null) pushPoint(pressureChart, data.pressure);

  if (data.ax != null && data.ay != null && data.az != null) {
    const magnitude = Math.sqrt(data.ax**2 + data.ay**2 + data.az**2);
    pushPoint(accelChart, magnitude);
  } else {
    console.warn('[missing accel]', data);
  }

  if (lat != null && lng != null) tryUpdateMap(Number(lat), Number(lng));

  function update3DModel(data) {
    if (!window.cylinder || !data) return;

    const roll  = Number(data.gx || 0);  // rotation around Z
    const pitch = Number(data.gy || 0);  // rotation around X
    const yaw   = Number(data.gz || 0);  // rotation around Y

    // Convert degrees to radians for Babylon.js
    window.cylinder.rotation.x = pitch * Math.PI / 180;
    window.cylinder.rotation.y = -yaw   * Math.PI / 180;
    window.cylinder.rotation.z = roll  * Math.PI / 180;
  }

  if (typeof update3DModel === 'function') {
    update3DModel(data);
  }

}

// ===== Wire socket → graphs =====
socket.on('serialData', updateGraphs);
