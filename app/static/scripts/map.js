// Global variables
var sidePanel = document.getElementById('sidePanel');
var riskInfo = document.getElementById('riskInfo');
var closeBtn = document.getElementById('closeBtn');
var slider = document.getElementById('daySlider');
var sliderDiv = document.getElementsByClassName("mt-3")
var load = document.getElementById('load')
var mapLoader = document.getElementById('map-loader');

// date for retrieving fire data from NASA FIRM API
const today = new Date();
today.setDate(today.getDate() - 1);
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');  
const dd = String(today.getDate()).padStart(2, '0');
const currentDate = `${yyyy}-${mm}-${dd}`;

let clusterMarkers = [];
let pointMarkers = [];
let staticClusters = [];
let superclusterInstance;
let activeRequestId = 0;

const fixedZoomLevel = 4;  
var predictionCirclesByDay = [];
var map;
var isSidePanelOpen = false; 

function setupSlider() {
  noUiSlider.create(slider, {
    start: 1,
    step: 1,
    range: {
      min: 1,
      max: 3
    },
    tooltips: false, 
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

  slider.noUiSlider.on('update', onSliderUpdate);
}


function setSidePanelOpen(state) {
  isSidePanelOpen = state;
  if (!state) {
    predictionCirclesByDay.forEach(dayCircles =>
      dayCircles.forEach(circle => map.hasLayer(circle) && map.removeLayer(circle))
    );
  }
}

function onSliderUpdate(values, handle) {
  const selectedDay = Number(values[handle]) - 1;
  // console.log('Day selected:', selectedDay + 1);
  if (!isSidePanelOpen) return;
  // Hide all circles
  predictionCirclesByDay.forEach(dayCircles =>
    dayCircles.forEach(circle => map.hasLayer(circle) && map.removeLayer(circle))
  );
  // Show selected day's circles
  predictionCirclesByDay[selectedDay]?.forEach(circle => circle.addTo(map));
}

// Map initialization 
function initMap() {
  map = drawMap(); 
  initCircles();
  setupSlider();
}

function drawMap() {
  var canadaBounds = L.latLngBounds(L.latLng(35, -150), L.latLng(90, -40));

  var mapInstance = L.map('map', {
    center: [56.1304, -106.3468],
    zoom: 4,
    minZoom: 4,
    maxZoom: 6,
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

function cleanData(csvText) {
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
  // console.log(riskPoints);
  return riskPoints;
}

async function getRiskPoints() {
  console.log('Attempting to fetch fire data...');
  try {
    const apiUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/7760496c7cb987792955447461887dae/VIIRS_NOAA20_NRT/-141,41.7,-52.6,83.1/1/${currentDate}/${currentDate}`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    
    const csvText = await response.text();
    console.log('Response text:', csvText.substring(0, 100));
    
    if (csvText.includes('Invalid API call')) {
      console.log('NASA API returned invalid call, using backup data');
      throw new Error('Invalid API call from NASA');
    }
    
    return cleanData(csvText)
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    // LOADS BACKUP DATA in the case that sattallite api goes down
    try {
      console.log('Loading backup data...');
      const fallbackResponse = await fetch('/static/backup_data/firms_canada_2025-06-30.csv');
      const fallbackCSV = await fallbackResponse.text();
      console.log('Backup data loaded successfully');
      return cleanData(fallbackCSV);
    } catch (fallbackError) {
      console.error('Failed to load fallback CSV:', fallbackError);
      return [];
    }
  }
}



// Clusters and prediction circles
async function initCircles() {
  const riskPoints = await getRiskPoints();
  const geojsonPoints = riskPoints.map(([lat, lon, risk], i) => ({
    type: 'Feature',
    properties: { id: i, risk },
    geometry: {
      type: 'Point',
      coordinates: [lon, lat]
    }
  }));

  superclusterInstance = new Supercluster({
    radius: 60,
    maxZoom: 14
  });

  superclusterInstance.load(geojsonPoints);

  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  staticClusters = superclusterInstance.getClusters(bbox, fixedZoomLevel);

  drawStaticClusters();
  // console.log("loaded");
  mapLoader.style.display = 'none';

  // Close side panel 
  closeBtn.onclick = function () {
    sidePanel.classList.remove('open');
    slider.noUiSlider.set(1);
    setSidePanelOpen(false);
    slider.style.display = 'none';
    clearPoints();
    drawStaticClusters();
    map.setView([56.1304, -106.3468], fixedZoomLevel);
  };
}

function drawStaticClusters() {
  clearClusters();

  staticClusters.forEach(cluster => {
    const [lon, lat] = cluster.geometry.coordinates;
    const pointCount = cluster.properties.cluster ? cluster.properties.point_count : 1;
    let fillColor;

    if (pointCount < 10) {
      fillColor = 'yellow';
    } else if (pointCount < 100) {
      fillColor = 'orange';
    } else {
      fillColor = 'red';
    }

    const marker = L.circleMarker([lat, lon], {
      color: fillColor,
      fillColor: fillColor,
      fillOpacity: 0.6,
      radius: 8 + Math.log(pointCount),
      pane: 'riskPane'
    }).bindTooltip(
      `${cluster.properties.cluster ? cluster.properties.point_count : 1} fires`
    );

    marker.on('click', () => {
      if (cluster.properties.cluster) {
        activeRequestId ++;
        const requestId = activeRequestId;
        const points = superclusterInstance.getLeaves(cluster.id, Infinity);
        clearClusters();
        drawPoints(points);

        const [clusterLng, clusterLat] = cluster.geometry.coordinates;
        map.setView([clusterLat, clusterLng+3], 8, { animate: true });

        sidePanel.classList.add('open');
        setSidePanelOpen(true);
        for (let e of sliderDiv) {
          e.style.display = 'none';
        } 
        load.style.display = 'block'

        // console.log('Cluster contains', points.length, 'points');

        var minLatPoint = null;
        var maxLatPoint = null;
        var minLngPoint = null;
        var maxLngPoint = null;
        
        // find largest + smallest lattitude + longitude and send to backend
        points.forEach(p => {
          const [lng, lat] = p.geometry.coordinates;

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
        // console.log(payload)

        fetch('/predict-spread', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
          .then(response => response.json())
          .then(data => {
            // console.log('Prediction from backend:', data.predictions);
            if (isSidePanelOpen && requestId == activeRequestId) {
              drawPredictionCircles(data.predictions);
              for (let e of sliderDiv) {
                e.style.display = 'block';
              }
              load.style.display = 'none';
            } else {
              // console.log('Side panel closed before predictions arrived; skipping drawing circles.');
            }
          });
      }
    });

    marker.addTo(map);
    clusterMarkers.push(marker);
  });
}

function drawPoints(points) {
  points.forEach(p => {
    const [lon, lat] = p.geometry.coordinates;
    const risk = p.properties.risk;
    // console.log(p.properties)

    const marker = L.circleMarker([lat, lon], {
      color: riskToColor(risk),
      fillColor: riskToColor(risk),
      fillOpacity: 0.8,
      radius: 5,
      pane: 'riskPane'
    });

    marker.on('click', () => {
      riskInfo.innerHTML =
        `<strong>Risk Level:</strong> ${Math.round(risk * 100)}%<br>
         <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      sidePanel.classList.add('open');
      setSidePanelOpen(true);
      map.flyTo([lat, lon+3], map.getZoom(), { animate: true, duration: 1.5 });
    });

    marker.addTo(map);
    pointMarkers.push(marker);
  });
}

function clearClusters() {
  clusterMarkers.forEach(marker => map.removeLayer(marker));
  clusterMarkers = [];
}

function clearPoints() {
  pointMarkers.forEach(marker => map.removeLayer(marker));
  pointMarkers = [];
}

function drawPredictionCircles(predictions) {
  // Clear previous circles
  predictionCirclesByDay.forEach(dayCircles => {
    dayCircles.forEach(item => {
      if (map.hasLayer(item)) {
        map.removeLayer(item);
      }
    });
  });
  predictionCirclesByDay = [];

  const allDays = predictions[0]; 

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
        radius: 5 + dayIndex,
        pane: 'riskPane',
        interactive: false
      }).bindTooltip(`Day ${dayIndex + 1}`, { permanent: false, direction: 'top' });

      if (dayIndex === 0) {
        circle.addTo(map);
      }

      dayCircles.push(circle);
    }

    if (latlngs.length >= 3) {
      const points = turf.featureCollection(
        latlngs.map(([lat, lon]) => turf.point([lon, lat]))
      );

      const hull = turf.convex(points);

      if (hull) {
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

        dayCircles.push(polygon);
      }
    }
    predictionCirclesByDay.push(dayCircles);
  });
}

// Helper functions
function riskToColor(risk) {
  var r = Math.round(255 * risk);
  var g = Math.round(255 * (1 - risk));
  return 'rgb(' + r + ',' + g + ',0)';
}

// Start app
initMap(); 
