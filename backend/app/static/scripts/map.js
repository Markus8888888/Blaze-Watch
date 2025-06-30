// Global variables
var sidePanel = document.getElementById('sidePanel');
var riskInfo = document.getElementById('riskInfo');
var closeBtn = document.getElementById('closeBtn');
var slider = document.getElementById('daySlider');

const today = new Date();
today.setDate(today.getDate() - 1);
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');  
const dd = String(today.getDate()).padStart(2, '0');
const currentDate = `${yyyy}-${mm}-${dd}`;

var predictionCirclesByDay = [];
var map;
var isSidePanelOpen = false; 
setSidePanelOpen(false);

noUiSlider.create(slider, {
  start: 1,
  step: 1,
  range: {
    min: 1,
    max: 3
  },
  tooltips: false, // removes the little number that appears above the slider
  format: {
    to: value => Math.round(value),
    from: value => Number(value)
  },
  pips: {
    mode: 'steps',
    stepped: true,
    density: 20
  }
});

function setSidePanelOpen(state) {
  isSidePanelOpen = state;

  if (!state) {
    // Remove all yellow prediction circles when panel closes
    predictionCirclesByDay.forEach(dayCircles => {
      dayCircles.forEach(circle => {
        if (map.hasLayer(circle)) {
          map.removeLayer(circle);
        }
      });
    });
  }
}

slider.noUiSlider.on('update', function (values, handle) {
  const selectedDay = Number(values[handle]) - 1; // zero-based index
  console.log('Day selected:', selectedDay + 1);

  if (!isSidePanelOpen) {
    return;
  }

  // Hide all circles first
  predictionCirclesByDay.forEach((dayCircles, index) => {
    dayCircles.forEach(circle => {
      if (map.hasLayer(circle)) {
        map.removeLayer(circle);
      }
    });
  });

  // Show only circles for the selected day
  if (predictionCirclesByDay[selectedDay]) {
    predictionCirclesByDay[selectedDay].forEach(circle => {
      circle.addTo(map);
    });
  }
});

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
      `https://firms.modaps.eosdis.nasa.gov/api/country/csv/d1775654091d25f131d6db111a4a466a/VIIRS_NOAA20_NRT/CAN/1/${currentDate}`
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
      const risk = 1.0;
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

  closeBtn.onclick = function() {
    sidePanel.classList.remove('open');
    setSidePanelOpen(false);
    slider.style.display = 'none';

    // Remove all yellow prediction circles from the map
    predictionCirclesByDay.forEach(dayCircles => {
      dayCircles.forEach(circle => {
        if (map.hasLayer(circle)) {
          map.removeLayer(circle);
        }
      });
    });
  };

  // Create a marker cluster group to improve performance with many points
  var markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 30,  // default 80. determines how close points need to be to cluster.
    disableClusteringAtZoom: 8  // default 14. clusters will not be created at this zoom level and below.
  });

  markers.on('clusterclick', function (a) {
    var cluster = a.layer; // the clicked cluster
    var points = cluster.getAllChildMarkers();
    
    sidePanel.classList.add('open');
    setSidePanelOpen(true);
    slider.style.display = 'block';  

    console.log('Cluster contains', points.length, 'points');

    var minLatPoint = null;
    var maxLatPoint = null;
    var minLngPoint = null;
    var maxLngPoint = null;

    points.forEach(p => {
      const { lat, lng } = p.getLatLng();

      if (!minLatPoint || lat < minLatPoint.lat) minLatPoint = { lat, lng };
      if (!maxLatPoint || lat > maxLatPoint.lat) maxLatPoint = { lat, lng };
      if (!minLngPoint || lng < minLngPoint.lng) minLngPoint = { lat, lng };
      if (!maxLngPoint || lng > maxLngPoint.lng) maxLngPoint = { lat, lng };
    });

    var payload = {
      lat_max_lat: maxLatPoint.lat,
      lat_max_lng: maxLatPoint.lng,
      lat_min_lat: minLatPoint.lat,
      lat_min_lng: minLatPoint.lng,
      lon_max_lat: maxLngPoint.lat,
      lon_max_lng: maxLngPoint.lng,
      lon_min_lat: minLngPoint.lat,
      lon_min_lng: minLngPoint.lng
    };

    fetch('/predict-spread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Prediction from backend:', data.predictions);
        if (isSidePanelOpen) {
          drawPredictionCircles(data.predictions);
        } else {
          console.log('Side panel closed before predictions arrived; skipping drawing circles.');
        }
      });
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
      setSidePanelOpen(true);
      map.flyTo([lat, lon], map.getZoom(), { animate: true, duration: 1.5 });
    });

    markers.addLayer(circle);
  });

  map.addLayer(markers);
}
function drawPredictionCircles(predictions) {
  // Clear previous circles and polylines
  predictionCirclesByDay.forEach(dayCircles => {
    dayCircles.forEach(item => {
      if (map.hasLayer(item)) {
        map.removeLayer(item);
      }
    });
  });
  predictionCirclesByDay = [];

  const allDays = predictions[0]; // [ [day1 coords], [day2 coords], ..., [day5 coords] ]

  allDays.forEach((dayPoints, dayIndex) => {
    const dayCircles = [];
    const latlngs = [];

    for (let i = 0; i < dayPoints.length; i += 2) {
      const lat = dayPoints[i];
      const lon = dayPoints[i + 1];
      latlngs.push([lat, lon]);

      const circle = L.circleMarker([lat, lon], {
        color: 'yellow',
        fillColor: 'yellow',
        fillOpacity: 0.8,
        radius: 5 + dayIndex, // slightly larger each day
        pane: 'riskPane',
        interactive: false
      }).bindTooltip(`Day ${dayIndex + 1}`, {
        permanent: false,
        direction: 'top'
      });

      if (dayIndex === 0) {
        circle.addTo(map);  // Only show Day 1 initially
      }

      dayCircles.push(circle);
    }

    // Draw a yellow polygon (shaded area) connecting the day's points
    if (latlngs.length >= 3) {
      // Convert to GeoJSON points
      const points = turf.featureCollection(
        latlngs.map(([lat, lon]) => turf.point([lon, lat]))
      );

      const hull = turf.convex(points);

      if (hull) {
        // Extract and convert to Leaflet [lat, lon]
        const hullCoords = hull.geometry.coordinates[0].map(([lon, lat]) => [lat, lon]);

        const polygon = L.polygon(hullCoords, {
          color: 'yellow',
          fillColor: 'yellow',
          fillOpacity: 0.3,
          weight: 1 + dayIndex,
          pane: 'riskPane'
        });

        if (dayIndex === 0) {
          polygon.addTo(map);  // Only show Day 1 initially
        }

        dayCircles.push(polygon); // store the polygon
      }
    }
    predictionCirclesByDay.push(dayCircles);
  });
}

function riskToColor(risk) {
  var r = Math.round(255 * risk);
  var g = Math.round(255 * (1 - risk));
  return 'rgb(' + r + ',' + g + ',0)';
}

initMap(); 
