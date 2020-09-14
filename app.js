let directionsService;
let directionsRenderer;
let activeWindow = null; 
let activeCircle = null;
//var circleCountText = document.getElementById("circleCountText");
const markers = [];
let restaurantData = [];
let patronData = [];
let revenueData = [];

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
      fillColor: "#ffffff",
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

      restaurantData.push(data['properties']['name']);
      let patron = parseInt(data.properties.patron);
      let revenue = parseInt(data.properties.revenue);
      patronData.push(patron);
      revenueData.push(revenue);

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
            <h2 style="font-family: courier;padding: 10px">${name}</h2><p style="font-family: courier;">${description}</p>
            <p>
            <b>Specialty:</b> ${specialty}<br/>
            <b>Open:</b> ${hours}<br/>
            <b>Phone:</b> ${phone}<br/>
            <b>Visit:</b> ${visit}
            </p>
            <button onClick="getDirection(${lat},${lng})">Get Direction</button>
          </div>
        `;
        let infoWindow = new google.maps.InfoWindow();
        if(activeWindow != null) {
          activeWindow.close();
        }
        infoWindow.setContent(content);
        infoWindow.setPosition(point);
        infoWindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});
        infoWindow.open(map);
        activeWindow = infoWindow;
      });

    markers.push(marker);

    });
  });


  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
    if(activeCircle != null) {
      activeCircle.setMap(null);
    }
    activeCircle = event.overlay;
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
    document.getElementById("circleCountText").innerHTML = "The circle has " + markerCount + " restaurants.";
    $("#myModal").modal();
  });

  google.charts.load('current', {'packages':['bar']});
  google.charts.setOnLoadCallback(drawChart);
}

function drawChart() {
  var data = google.visualization.arrayToDataTable([
    ['Restaurant', 'Patron', 'Revenue'],
    [restaurantData[0], patronData[0], revenueData[0]],
    [restaurantData[1], patronData[1], revenueData[1]],
    [restaurantData[2], patronData[2], revenueData[2]],
    [restaurantData[3], patronData[3], revenueData[3]],
    [restaurantData[4], patronData[4], revenueData[4]],
    [restaurantData[5], patronData[5], revenueData[5]],
    [restaurantData[6], patronData[6], revenueData[6]],
    [restaurantData[7], patronData[7], revenueData[7]],
    [restaurantData[8], patronData[8], revenueData[8]]
  ]);

  var options = {
    chart: {
      title: 'Restaurant Analytics',
      subtitle: 'Patron & Revenue',
    },
    bars: 'horizontal' // Required for Material Bar Charts.
  };

  var chart = new google.charts.Bar(document.getElementById('barchart_material'));

  chart.draw(data, google.charts.Bar.convertOptions(options));
}

function handleReportingResults(response) {
  if (!response.code) {
    outputToPage('Query Success');
    for( var i = 0, report; report = response.reports[ i ]; ++i )
    {
      output.push('<h3>All Rows Of Data</h3>');
      if (report.data.rows && report.data.rows.length) {
        var table = ['<table>'];

        // Put headers in table.
        table.push('<tr><th>', report.columnHeader.dimensions.join('</th><th>'), '</th>');
        table.push('<th>Date range #</th>');

        for (var i=0, header; header = report.columnHeader.metricHeader.metricHeaderEntries[i]; ++i) {
          table.push('<th>', header.name, '</th>');
        }

        table.push('</tr>');

        // Put cells in table.
        for (var rowIndex=0, row; row = report.data.rows[rowIndex]; ++rowIndex) {
          for(var dateRangeIndex=0, dateRange; dateRange = row.metrics[dateRangeIndex]; ++dateRangeIndex) {
            // Put dimension values
            table.push('<tr><td>', row.dimensions.join('</td><td>'), '</td>');
            // Put metric values for the current date range
            table.push('<td>', dateRangeIndex, '</td><td>', dateRange.values.join('</td><td>'), '</td></tr>');
          }
        }
        table.push('</table>');

        output.push(table.join(''));
      } else {
        output.push('<p>No rows found.</p>');
      }
    }
    outputToPage(output.join(''));

  } else {
    outputToPage('There was an error: ' + response.message);
  }
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
