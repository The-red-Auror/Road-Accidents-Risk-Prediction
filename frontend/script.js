// Pune center
const PUNE_LAT = 18.5204;
const PUNE_LON = 73.8567;

// Initialize map
const map = L.map("map").setView([PUNE_LAT, PUNE_LON], 12);

// Load tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Marker (initially null)
let marker = null;

//click to select location
map.on("click", function (e) {
  const lat = e.latlng.lat.toFixed(6);
  const lon = e.latlng.lng.toFixed(6);

  // Update inputs
  document.getElementById("latitude").value = lat;
  document.getElementById("longitude").value = lon;

  // Place or move marker
  if (marker) {
    marker.setLatLng(e.latlng);
  } else {
    marker = L.marker(e.latlng).addTo(map);
  }
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
    resultDiv.innerHTML = "❌ Error connecting to server";
  }
}
