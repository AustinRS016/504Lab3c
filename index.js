var map = L.map('map').setView([47.741, -121.984], 14);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    id: 'mapbox/satellite-streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYXVzdGlucnMxNiIsImEiOiJja2hjcTRidmgwOWdpMnNxc3NmaHE5OXg1In0.va6GbxRjrFnzt6QWT_bwfQ'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var cartoData = L.layerGroup().addTo(map);
var url = "https://austinrs16.carto.com/api/v2/sql";
var urlGeoJSON = url + "?format=GeoJSON&q=";
var sqlQuery = "SELECT * FROM delivery_data";
function addPopup(feature, layer) {
    layer.bindPopup(
        feature.properties.name + "<br>" +
        feature.properties.address + "<br>" +
        feature.properties.gravel + "<br>" +
        feature.properties.tip + "<br>" +
        feature.properties.google_loc + "<br>" +
        feature.properties.walk + "<br>" +
        feature.properties.notes
    );
}

fetch(urlGeoJSON + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
    });

new L.Control.Draw({
    draw : {
        polygon : false,
        polyline : false,
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);


//on draw - create editable popup
map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});


//On edit or delete - close popup
map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});


//Editable Popup
function createFormPopup() {
    var popupContent =
        '<form>'+
        'Address:<br><input type="text" id="address"><br>'+
        'User\'s Name:<br><input type="text" id="input_name"><br>'+
        'Did you drive on gravel?<br><input type="checkbox" id="gravel"><br>'+
        'Tip:<br><input type="number" id="tip"><br>'+
        'Was the google pin on the house?<br><input type="checkbox" id="google_loc"><br>'+
        'Rate the walk to the house from the car out of 3 (1 = shorter, 3 = longer):<br><input type="string" id="walk"><br>'+
        'Additional notes:<br><input type="string" id="notes"><br>'+
        '<input type="button" value="Submit" id="submit">'+
        '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
};




//Submit
function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredUsername = document.getElementById("input_name").value;
        var address = document.getElementById("address").value;
        var gravel = document.getElementById("gravel").checked;
        var tip = document.getElementById("tip").value;
        var google_loc = document.getElementById("google_loc").checked;
        var walk = document.getElementById("walk").value;
        var notes = document.getElementById("notes").value;

        // For each drawn layer
      drawnItems.eachLayer(function(layer) {

  			// Create SQL expression to insert layer
              var drawing = JSON.stringify(layer.toGeoJSON().geometry);
              var sql =
                  "INSERT INTO delivery_data (the_geom, name, address, gravel, tip, google_loc, walk, notes) " +
                  "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                  drawing + "'), 4326), '" +
                  enteredUsername + "', '" +
                  address + "', '" +
                  gravel + "', '" +
                  tip + "', '" +
                  google_loc + "', '" +
                  walk + "', '" +
                  notes + "')";
              console.log(sql);

              // Send the data
              fetch(url, {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/x-www-form-urlencoded"
                  },
                  body: "q=" + encodeURI(sql)
              })
              .then(function(response) {
                  return response.json();
              })
              .then(function(data) {
                  console.log("Data saved:", data);
              })
              .catch(function(error) {
                  console.log("Problem saving the data:", error);
              });

          // Transfer submitted drawing to the CARTO layer
          //so it persists on the map without you having to refresh the page
          var newData = layer.toGeoJSON();
          newData.properties.name = enteredUsername;
          newData.properties.address= address;
          newData.properties.gravel= gravel;
          newData.properties.tip= tip;
          newData.properties.google_loc= google_loc;
          newData.properties.walk= walk;
          newData.properties.notes= notes;
          L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);

      });

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}
//Submit 'click'
document.addEventListener("click", setData);


//Alert on
function infoAlert(){
  alert("The purpose of this map is to test funcionality of data collection with leaflet. Using the buttons on the left side of the screen submit data on your favorite place to eat or hangout by creating a polygon or point.")
}
