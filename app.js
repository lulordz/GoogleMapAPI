let directionsService;
let directionsRenderer;
const markers = [];

function initMap() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  // The location of Cebu
  const cebu = {lat: 10.3157, lng: 123.8854};
  // The map, centered at Cebu
  const map = new google.maps.Map(document.getElementById('map'), {
      	zoom: 13, 
      	center: cebu
      });
  directionsRenderer.setMap(map);

  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.CIRCLE
      ]
    },
    circleOptions: {
      fillColor: "#ffff00",
      fillOpacity: 1,
      strokeWeight: 2,
      clickable: false,
      editable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);

  $.getJSON("stores.json", res => {
    const jsonData = res['features'];

    $.each(jsonData, (key, data) => {
      const point = new google.maps.LatLng(
        parseFloat(data['geometry']['coordinates'][0]),
        parseFloat(data['geometry']['coordinates'][1]),
      );
      const title = data['properties']['name'];

      const marker = new google.maps.Marker({
        position: point,
        title: title,
        map: map,
        properties: data['properties']
       });

      const infoWindow = new google.maps.InfoWindow();
      marker.addListener('click', () => {
        let category = data['properties']['category'];
        let name = data['properties']['name'];
        let description = data['properties']['description'];
        let specialty = data['properties']['specialty'];
        let hours = data['properties']['hours'];
        let phone = data['properties']['phone'];
        let lat = data['geometry']['coordinates'][0];
        let lng = data['geometry']['coordinates'][1];
        data.properties.visit = parseInt(data.properties.visit) + 1;
        let visit = data.properties.visit;
        let content = sanitizeHTML `
          <div style="margin-left:20px; margin-bottom:20px;">
            <h2>${name}</h2><p>${description}</p>
            <p>
            <b>Specialty:</b> ${specialty}<br/>
            <b>Open:</b> ${hours}<br/>
            <b>Phone:</b> ${phone}<br/>
            <b>Visit:</b> ${visit}
            </p>
            <button onClick="getDirection(${lat},${lng})">Get Direction</button>
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.setPosition(point);
        infoWindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});
        infoWindow.open(map);
      });

    markers.push(marker);

    });
  });


  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
    let markerCount = 0;
    if (event.type == 'circle') {
      var radius_circle = event.overlay.getRadius();
      var center_lat = event.overlay.center.lat();
      var center_lng = event.overlay.center.lng();
    }

    let address_lat_lng = new google.maps.LatLng(center_lat,center_lng);
    for (let i = 0; i < markers.length; i++){
      let marker = markers[i];
      let marker_lat_lng = new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng());
      let distance_from_location = google.maps.geometry.spherical.computeDistanceBetween(address_lat_lng, marker_lat_lng);
      if (distance_from_location <= radius_circle)
      {
        markerCount++;
      }
    }
    alert("The circle has " + markerCount + " restaurants");
  });

}

function sanitizeHTML(strings) {
  const entities = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'};
  let result = strings[0];
  for (let i = 1; i < arguments.length; i++) {
    result += String(arguments[i]).replace(/[&<>'"]/g, (char) => {
      return entities[char];
    });
    result += strings[i];
  }
  return result;
}


function checkCategory() {
    let eatallyoucan = document.getElementById('eatallyoucan');
    let cake = document.getElementById('cake');
    let seafood = document.getElementById('seafood');

    for (let i = 0; i < markers.length; i++){
      let marker = markers[i];
      switch (marker.properties.category) {
        case 'cake' :
          if (cake.checked)
            marker.setVisible(true);
          else
            marker.setVisible(false);
          break;
        case 'eatallyoucan' :
          if (eatallyoucan.checked)
            marker.setVisible(true);
          else
            marker.setVisible(false);
          break;
        case 'seafood' :
          if (seafood.checked)
            marker.setVisible(true);
          else
            marker.setVisible(false);
          break;
        default:
          marker.setVisible(true);
        }
    }
}

function getDirection(lat,lng) {

  const destination = new google.maps.LatLng(
        parseFloat(lat),
        parseFloat(lng),
      );

  //SUPPOSED CURRENT LOCATION because I am in JAPAN
  const supposedCurrentLocation = new google.maps.LatLng(
        parseFloat(10.2215),
        parseFloat(123.781),
      );

  directionsService.route({
        origin: supposedCurrentLocation,
        destination: destination,
        travelMode: 'DRIVING'
      }, (res,status) => {
        if (status === 'OK')
          directionsRenderer.setDirections(res);
        else
          alert("Directions request failed due to " + status);
      });

  // IMPLEMENTATION IN GETTING DIRECTION FROM CURRENT POSITION
  /*
  navigator.geolocation.getCurrentPosition((position) => {
      const currentLocation = new google.maps.LatLng(
        parseFloat(position.coords.latitude),
        parseFloat(position.coords.longitude),
      );

      const destination = new google.maps.LatLng(
        parseFloat(lat),
        parseFloat(lng),
      );

      directionsService.route({
        origin: currentLocation,
        destination: destination,
        travelMode: 'DRIVING'
      }, (res,status) => {
        if (status === 'OK')
          directionsRenderer.setDirections(res);
        else
          alert("Directions request failed due to " + status);
      });
  });
  */

}
