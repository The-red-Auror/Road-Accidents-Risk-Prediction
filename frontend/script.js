// Pune center
const PUNE_LAT = 18.5204;
const PUNE_LON = 73.8567;

// Initialize map
const map = L.map("map").setView([PUNE_LAT, PUNE_LON], 12);

// Load tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);


let hotspotLayer = L.layerGroup().addTo(map);

//all lat long in the route
let routePoints = [];
//all lat long of risk points in the route
let riskMarkers = [];

// -----------------------------
// STEP 1: Start & End Selection
// -----------------------------

let startPoint = null;
let endPoint = null;

let startMarker = null;
let endMarker = null;
let routeControl = null;

map.on("click", function (e) {

  // 1. Select START
  if (!startPoint) {
    startPoint = e.latlng;

    startMarker = L.marker(startPoint)
      .addTo(map)
      .bindPopup("Start Location")
      .openPopup();

    console.log("Start selected:", startPoint);
    return;
  }

  // 2. Select DESTINATION
  if (!endPoint) {
    endPoint = e.latlng;

    endMarker = L.marker(endPoint)
      .addTo(map)
      .bindPopup("Destination")
      .openPopup();

    console.log("Destination selected:", endPoint);

    drawRoute();   //route will be drawn here
    return;
  }

});


// RESET BUTTON
document.getElementById("resetBtn").addEventListener("click", function () {

  // Remove start & end markers
  if (startMarker) {
    map.removeLayer(startMarker);
    startMarker = null;
  }

  if (endMarker) {
    map.removeLayer(endMarker);
    endMarker = null;
  }

  // Remove route line
  if (routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }

  // Remove risk hotspots
  if (hotspotLayer) {
    hotspotLayer.clearLayers();
  }

  // Clear stored data
  startPoint = null;
  endPoint = null;
  routePoints = [];

  // ✅ HIDE ROUTE STATUS MESSAGE
  const statusDiv = document.getElementById("routeStatus");
  statusDiv.classList.add("hidden");

  console.log("Route reset complete");
});






//allow manual lat long update
function updateMarkerFromInputs() {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lon = parseFloat(document.getElementById("longitude").value);

  if (!isNaN(lat) && !isNaN(lon)) {
    const latLng = [lat, lon];
    map.setView(latLng, 14);

    if (marker) {
      marker.setLatLng(latLng);
    } else {
      marker = L.marker(latLng).addTo(map);
    }
  }
}


async function predictRisk() {
  const data = {
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    road_type: document.getElementById("road_type").value,
    lanes: parseInt(document.getElementById("lanes").value),
    speed_limit: parseInt(document.getElementById("speed_limit").value)
  };

  const resultDiv = document.getElementById("result");
  resultDiv.className = "result";
  resultDiv.innerHTML = "⏳ Predicting...";
  resultDiv.classList.remove("hidden");

  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const res = await response.json();

    let riskClass = res.risk.toLowerCase();

    resultDiv.classList.add(riskClass);
    resultDiv.innerHTML = `
      <strong>${res.risk} Risk</strong><br/>
      Confidence: ${res.confidence}<br/>
      Weather: ${res.weather}<br/>
      Time: ${res.time}<br/>
      Date: ${res.date}
    `;
  } catch (err) {
    resultDiv.classList.add("high");
    resultDiv.innerHTML = "Error connecting to server";
  }
}


// // TEMP TEST ROUTE (ignore clicks)
// L.Routing.control({
//   waypoints: [
//     L.latLng(18.5204, 73.8567),
//     L.latLng(18.5304, 73.8667)
//   ],
//   routeWhileDragging: false
// }).addTo(map);

function drawRoute() {
  if (routeControl) {
    map.removeControl(routeControl);
  }

  routeControl = L.Routing.control({
    waypoints: [
      L.latLng(startPoint.lat, startPoint.lng),
      L.latLng(endPoint.lat, endPoint.lng)
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    show: false,
    lineOptions: {
      styles: [{ color: "blue", weight: 4 }]
    }
  })
    .on("routesfound", function (e) {
      const route = e.routes[0];
      const coordinates = route.coordinates;

      console.log("Route points:", coordinates);
      console.log("Total points on route:", coordinates.length);

      // Store route points globally (used in next steps)
      routePoints = coordinates;
       // SEND ROUTE TO BACKEND
      sendRouteForRisk();
    })
    .addTo(map);
}


async function sendRouteForRisk() {
  if (!routePoints || routePoints.length === 0) {
    alert("No route points available");
    return;
  }

  const payload = {
    route_points: routePoints
      .filter(p => p && p.lat !== undefined && p.lng !== undefined)
      .map(p => ({
        lat: p.lat,
        lon: p.lng
      }))
  };


  const response = await fetch("http://127.0.0.1:8000/route-risk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  
  const data = await response.json();
  console.log("Route risk response:", data);

   if (data.route_risk) {
    drawHotspots(data.route_risk);
  }

  const totalPoints = data.route_risk.length;
  const redPoints = data.route_risk.filter(p => p.risk === "Medium").length;
  const redPercentage = (redPoints / totalPoints) * 100;
  console.log("Red %:", redPercentage);
  let routeMessage = "";
  let routeColor = "";

  if (redPercentage < 25) {
    routeMessage = "✅ Route is safe";
    routeColor = "green";
  } else if (redPercentage >= 25 && redPercentage <= 50) {
    routeMessage = "⚠ Route has hotspots. Drive carefully";
    routeColor = "orange";
  } else {
    routeMessage = "🚨 Route is dangerous";
    routeColor = "red";
  }


//Temp testing
//  drawHotspots([
//    { lat: routePoints[10].lat, lon: routePoints[10].lng, risk: "Low" },
//    { lat: routePoints[50].lat, lon: routePoints[50].lng, risk: "Medium" },
//    { lat: routePoints[100].lat, lon: routePoints[100].lng, risk: "High" }
//  ]);

// route statuse message
  const statusDiv = document.getElementById("routeStatus");

  statusDiv.innerText = routeMessage;
  statusDiv.className = `route-status ${routeColor}`;
  statusDiv.classList.remove("hidden");

 
}


function drawHotspots(points) {
  hotspotLayer.clearLayers();

  points.forEach(p => {
    let color = "green";

    if (p.risk === "High") color = "red";
    else if (p.risk === "Medium") color = "orange";

    L.circleMarker([p.lat, p.lon], {
      radius: 5,
      color: color,
      fillColor: color,
      fillOpacity: 0.8
    })
      .bindPopup(`Risk: ${p.risk}`)
      .addTo(hotspotLayer);
  });
}

