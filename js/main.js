var map, marker, infoWindow;
var info = {};
var markers = [];
var myLatLng = { lat: 10.0333, lng: 105.7830 };
var mapOption = {
    center: myLatLng,
    zoom: 8,
    mapTypeControl: false
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), mapOption);
    clearTextOnLoad();

    addMarker(myLatLng);

    showInfoWindow();

    mapMouseClick();

    searchBox();

    getLocation();

    showButton(map);

}

function addMarker(place) {
    marker = new google.maps.Marker({
        position: place,
        map: map
    });
    map.panTo(place);
    markers.push(marker);
}

function clearMarker() {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
}

function mapMouseClick() {
    map.addListener("click", function (e) {
        clearMarker();
        addMarker(e.latLng);
        geocodeAddress(e.latLng);
        map.panTo(marker.position);
        markers.push(marker);
    });
}

function showInfoWindow() {
    marker.addListener('click', function (e) {
        geocodeAddress(e.latLng);
    });
}

function searchBox() {
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    map.addListener('bounds_changed', function () {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        clearMarker();

        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place) {
            if (!place.geometry) {
                consolo.log("Returned place contains no geometry");
                return;
            }

            createInfoWindow();
            var service = new google.maps.places.PlacesService(map);
            var latLngMarker = {};
            service.getDetails({
                placeId: place.place_id
            }, function (place, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    addMarker(place.geometry.location);
                    google.maps.event.addListener(marker, 'click', function (e) {
                        createInfoWindow();
                        infoWindow.setContent(
                            "<div>" +
                            "<b>Name: </b>" + place.name + "<br>" +
                            "<b>Address: </b>" + place.formatted_address + "<br>" +
                            "<b>Lat: </b>" + place.geometry.location.lat() + "<br>" +
                            "<b>Lng: </b>" + place.geometry.location.lng() + "<br>" +
                            "<b>Rate: </b>" + place.rating + "<br>" +
                            "</div>"
                        );
                        infoWindow.open(map, this);

                        var latLngLocation = {};
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(function (place) {
                                latLngLocation = {
                                    lat: place.coords.latitude,
                                    lng: place.coords.longitude
                                };
                                var buttonDirection = document.getElementById('sub-direction');
                                buttonDirection.onclick = function () {
                                    var directionService = new google.maps.DirectionsService();
                                    var directionDisplay = new google.maps.DirectionsRenderer();
                                    directionDisplay.setMap(map);
                                    clearMarker();
                                    var resquest = {
                                        origin: latLngLocation,
                                        destination: e.latLng,
                                        travelMode: 'DRIVING'
                                    };
                                    directionService.route(resquest, function (response, status) {
                                        if (status === 'OK')
                                            directionDisplay.setDirections(response);
                                        else
                                            window.alert('Directions request failed due to ' + status);
                                    });
                                }
                            }, function () {
                                handleLocationError(true, infoWindow, map.getCenter());
                            });
                        } else {
                            handleLocationError(false, infoWindow, map.getCenter());
                        }   
                    });

                }
            });
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}

function geocodeAddress(latLng) {
    var geocoder = new google.maps.Geocoder();
    createInfoWindow();

    geocoder.geocode(
        { "location": latLng },
        function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    create_address_infos(results[0]);
                    infoWindow.setContent(
                        "<div>" +
                        "<b>PlaceID :</b> " + address_infos["place_id"] + "<br>" +
                        "<b>Address :</b> " + address_infos["address"] + "<br>" +
                        "<b>Latitude :</b> " + address_infos["latitude"] + "<br>" +
                        "<b>Longitude :</b> " + address_infos["longitude"] + "<br>" +
                        "</div>"
                    );
                    infoWindow.open(map, marker);
                } else {
                    console.log("No results found");
                }
            } else {
                console.log("Geocoder failed due to: " + status);
            }
        }
    );
}

function create_address_infos(address) {
    address_infos = {
        name: address.name,
        address: address.formatted_address,
        latitude: address.geometry.location.lat(),
        longitude: address.geometry.location.lng(),
        place_id: address.place_id
    }
}

function createInfoWindow() {
    if (infoWindow)
        infoWindow.close();
    infoWindow = new google.maps.InfoWindow();
}

function getLocation() {
    var latLngLocation = {};
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (place) {
            latLngLocation = {
                lat: place.coords.latitude,
                lng: place.coords.longitude
            };
            // console.log(latLngLocation);
            clearMarker();
            addMarker(latLngLocation);
            marker.addListener('click', function (e) {
                geocodeAddress(e.latLng);
            });
            infoWindow = new google.maps.InfoWindow();
            infoWindow.setContent("You are here!");
            infoWindow.open(map, marker);
            map.setCenter(latLngLocation);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, latLng) {
    infoWindow.setPosition(latLng);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function showButton(map) {
    var buttonDirection = document.getElementById('sub-direction');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(buttonDirection);
}

function clearTextOnLoad() {
    document.getElementById('pac-input').value = "";
}
