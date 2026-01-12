// public/liveGraph/googleMaps.js  (Leaflet version, no API key)
(function () {
  let map = null, marker = null;

  // no-op until real map is ready (so other code can call updateMap safely)
  if (typeof window.updateMap !== 'function') window.updateMap = function(){};

  function leafletReady(){ return typeof L !== 'undefined' && !!L.map; }
  function containerReady(){
    const el = document.getElementById('map');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function init(){
    if (!leafletReady() || !containerReady()) return;
    const el = document.getElementById('map');
    const start = [3.139003, 101.686855]; // KL default

    map = L.map(el, { center:start, zoom:15, zoomControl:true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker(start).addTo(map);

    // real updater used by graphs.js
    window.updateMap = function(lat, log){
      const la = Number(lat), ln = Number(log);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
      const pos = [la, ln];
      marker.setLatLng(pos);
      map.setView(pos);
      setTimeout(() => map.invalidateSize(), 0);
    };

    setTimeout(() => map.invalidateSize(), 0);
    addEventListener('resize', () => map && map.invalidateSize());
  }

  // retry until Leaflet + container are ready
  let tries = 0;
  const t = setInterval(() => { if (map) return clearInterval(t);
    tries++; init(); if (tries > 60) clearInterval(t);
  }, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
