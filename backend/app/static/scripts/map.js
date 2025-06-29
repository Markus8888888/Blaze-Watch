var sidePanel = document.getElementById('sidePanel');
var riskInfo = document.getElementById('riskInfo');
var closeBtn = document.getElementById('closeBtn');

var map;

function initMap() {
  map = drawMap(); 
  initCircles();
}

function drawMap() {
  var canadaBounds = L.latLngBounds(L.latLng(35, -150), L.latLng(90, -40));

  var mapInstance = L.map('map', {
    center: [56.1304, -106.3468],
    zoom: 4,
    minZoom: 4,
    maxZoom: 14,
    maxBounds: canadaBounds,
    maxBoundsViscosity: 1.0
  });

  mapInstance.on('drag', function() {
    mapInstance.panInsideBounds(canadaBounds, { animate: false });
  });

  mapInstance.createPane('riskPane');
  mapInstance.getPane('riskPane').style.zIndex = 650;

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 18,
      attribution: 'Tiles © Esri'
    }
  ).addTo(mapInstance);

  fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson')
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: 'black',
          weight: 1.5,
          fillOpacity: 0
        }
      }).addTo(mapInstance);
    });

  return mapInstance;
}

async function getRiskPoints() {
  try {
    const response = await fetch(
      'https://firms.modaps.eosdis.nasa.gov/api/country/csv/d1775654091d25f131d6db111a4a466a/LANDSAT_NRT/CAN/1/2025-06-28'
    );

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    const latIndex = headers.indexOf('latitude');
    const lonIndex = headers.indexOf('longitude');

    const riskPoints = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const lat = parseFloat(row[latIndex]);
      const lon = parseFloat(row[lonIndex]);
      const risk = 0.5;
      riskPoints.push([lat, lon, risk]);
    }
    console.log(riskPoints);
    return riskPoints;
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    return [];
  }
}

async function initCircles() {
  const riskPoints = await getRiskPoints();
  // console.log(riskPoints.length)

  closeBtn.onclick = function() {
    sidePanel.classList.remove('open');
  };

  // Create a marker cluster group to improve performance with many points
  var markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 40  // default 80. determines how close points need to be to cluster.
  });

  riskPoints.forEach(function(point) {
    var lat = point[0];
    var lon = point[1];
    var risk = point[2];
    var color = riskToColor(risk);

    var circle = L.circleMarker([lat, lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.8,
      radius: 5,
      pane: 'riskPane',
      interactive: true
    });

    circle.on('click', function() {
      riskInfo.innerHTML = `
        <strong>Risk Level:</strong> ${Math.round(risk * 100)}%<br>
        <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}
      `;
      sidePanel.classList.add('open');
      // map.flyTo([lat, lon], 8, { animate: true, duration: 1.5 });  // this one zooms out as well
      map.flyTo([lat, lon], map.getZoom(), { animate: true, duration: 1.5 });
    });

    markers.addLayer(circle);
  });

  map.addLayer(markers);
}


function riskToColor(risk) {
  var r = Math.round(255 * risk);
  var g = Math.round(255 * (1 - risk));
  return 'rgb(' + r + ',' + g + ',0)';
}

initMap(); 
