var _arrMarkers = []; //於地圖上之地標
var _arrCircles = []; //於地圖上之區域
var _uniqueID = 1; //for markerId
var _latitudeLocal = ""; //目前GPS定位之緯度
var _longitudeLocal = ""; //目前GPS定位之經度
var _latitudeClick = "";
var _longitudeClick = "";


//var _icon_police = "M28.581 20.544c0 3.369-2.789 3.369-4.292 3.369h-1.874v-6.369h2.355c1.317 0 3.811 0 3.811 3zm14.396-3.363c.278-3.428 1.271-6.574 3.023-9.458l-6.719-6.723c-2.123 1.828-4.539 2.84-7.279 3.019-2.509.227-4.891-.25-7.127-1.434-2.301 1.146-4.671 1.625-7.142 1.434-2.556-.229-4.862-1.135-6.928-2.741l-6.738 6.72c1.657 2.925 2.58 5.987 2.762 9.183.086 1.472-.334 3.498-1.276 6.117-.493 1.452-.866 2.712-1.12 3.764-.235 1.045-.382 1.895-.431 2.531-.035 2.791.748 5.311 2.353 7.55 1.254 1.635 3.322 3.44 6.194 5.415 3.142 1.6 5.574 2.639 7.277 3.081l1.412.656c.444.214.92.421 1.417.647 1.071.642 1.824 1.339 2.22 2.057.486-.777 1.255-1.456 2.277-2.057.722-.314 1.333-.588 1.823-.828.49-.215.855-.377 1.067-.476.363-.181.84-.387 1.417-.615.583-.229 1.302-.51 2.161-.82 1.66-.589 2.868-1.144 3.636-1.646 2.785-1.975 4.821-3.75 6.117-5.339 1.662-2.249 2.469-4.78 2.432-7.626-.098-1.274-.637-3.313-1.616-6.091-.934-2.704-1.348-4.804-1.212-6.32zm-12.35 9.21c-1.595 1.044-3.788 1.044-4.933 1.044h-3.145v8.606h-4.729v-22.076h6.713c3.12 0 5.729.201 7.541 2.41 1.131 1.406 1.322 3.003 1.322 4.138-.002 2.571-1.061 4.741-2.769 5.878z";
var _icon_url = "http://localhost:50930/Icons";
var _icon_url_self = _icon_url + "/postal-code.svg";
var _icon_url_alert = _icon_url + "/campground.svg";
var _icon_url_pic1 = _icon_url + "/crosshairs.svg";
var _icon_url_pic2 = _icon_url + "/laundry.svg";
var _icon_url_police = _icon_url + "/police.svg";
var _icon_url_police2 = _icon_url + "/parking.svg";

$(function () {
});

function initMap() {
    if (navigator.geolocation) {
        //支援GPS地理位置
        navigator.geolocation.getCurrentPosition(getSucess, getFail);
    } else {
        //不支援GPS地理位置
        alert("目前GPS無法定位！！");
    }
}

//取得GPS成功：可 set marker and delete marker on map
function getSucess(evt) {
    _latitudeLocal = evt.coords.latitude; //目前GPS定位之緯度
    _longitudeLocal = evt.coords.longitude; //目前GPS定位之經度

    var map = new google.maps.Map(document.getElementById('map'), {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoom: 14,
        //center: { lat: 25.0722053, lng: 121.5770333 }
        center: { lat: _latitudeLocal, lng: _longitudeLocal }
    });
    
    //click event on map
    map.addListener('click', function (e) {
        //Determine the location where the user has clicked.
        var location = e.latLng;
        _latitudeClick = location.lat(); //點選地圖之緯度
        _longitudeClick = location.lng(); //點選地圖之經度
        
        $('#SetMarkerTypeModal').modal("show"); //show dialog，選擇通報類別
    });
    
    //取得已通報之經緯度
    getResponseMarkers(map);
    
    //click button(確認) event on dialog
    $('#btnModalSave').click(function () {
        //alert(_latitudeClick + ";" + _longitudeClick);
        saveClickMarker(map, _latitudeClick, _longitudeClick);
    });
}

//取得已通報地標
function getResponseMarkers(_map) {
    delAllMarkersOnMap(); //清空地圖上之所有地標

    //於地圖上顯示自身地標
    var markerLocation = new google.maps.Marker({
        position: { lat: _latitudeLocal, lng: _longitudeLocal },
        map: _map,
        icon: {
            url: _icon_url_self
        }
    });
    //click marker(自身) event
    google.maps.event.addListener(markerLocation, "click", function (e) {
        _latitudeClick = _latitudeLocal; //點選地圖之緯度
        _longitudeClick = _longitudeLocal; //點選地圖之經度

        $('#SetMarkerTypeModal').modal("show"); //show dialog，選擇通報類別
    });

    //由後端取得json格式之已通報地標
    $.post(_getUrl, null, function (result) {
        var _data = result.data;
        //alert("cnt:" + _data.length.toString() + ";" + _data[0]["Latitude"]);
        for (var i = 0; i < _data.length; i++) {
            //於地圖上顯示已通報地標
            addMarkerOnMap(_map, _data[i]["PlaceType"], parseFloat(_data[i]["Latitude"]), parseFloat(_data[i]["Longitude"]));
        }
    });

    //輪詢取得最新之已通報地標
    var t = setTimeout(function () {
        getResponseMarkers(_map);
    }, 10000);
}

//於地圖上增加地標
function addMarkerOnMap(_map, _type, _latitude, _longitude) {
    var _url = ""; //依照通報類別，取得該通報圖片連結
    if (_type == "1") {
        _url = _icon_url_alert;
    } else if (_type == "2") {
        _url = _icon_url_police;
    } else if (_type == "3") {
        _url = _icon_url_pic1;
    } else if (_type == "4") {
        _url = _icon_url_pic2;
    } else if (_type == "5") {
        _url = _icon_url_police2;
    }

    //Create a marker and placed it on the map.
    var marker = new google.maps.Marker({
        position: { lat: _latitude, lng: _longitude },
        map: _map,
        icon: {
            url: _url
            //path: "M28.581 20.544c0 3.369-2.789 3.369-4.292 3.369h-1.874v-6.369h2.355c1.317 0 3.811 0 3.811 3zm14.396-3.363c.278-3.428 1.271-6.574 3.023-9.458l-6.719-6.723c-2.123 1.828-4.539 2.84-7.279 3.019-2.509.227-4.891-.25-7.127-1.434-2.301 1.146-4.671 1.625-7.142 1.434-2.556-.229-4.862-1.135-6.928-2.741l-6.738 6.72c1.657 2.925 2.58 5.987 2.762 9.183.086 1.472-.334 3.498-1.276 6.117-.493 1.452-.866 2.712-1.12 3.764-.235 1.045-.382 1.895-.431 2.531-.035 2.791.748 5.311 2.353 7.55 1.254 1.635 3.322 3.44 6.194 5.415 3.142 1.6 5.574 2.639 7.277 3.081l1.412.656c.444.214.92.421 1.417.647 1.071.642 1.824 1.339 2.22 2.057.486-.777 1.255-1.456 2.277-2.057.722-.314 1.333-.588 1.823-.828.49-.215.855-.377 1.067-.476.363-.181.84-.387 1.417-.615.583-.229 1.302-.51 2.161-.82 1.66-.589 2.868-1.144 3.636-1.646 2.785-1.975 4.821-3.75 6.117-5.339 1.662-2.249 2.469-4.78 2.432-7.626-.098-1.274-.637-3.313-1.616-6.091-.934-2.704-1.348-4.804-1.212-6.32zm-12.35 9.21c-1.595 1.044-3.788 1.044-4.933 1.044h-3.145v8.606h-4.729v-22.076h6.713c3.12 0 5.729.201 7.541 2.41 1.131 1.406 1.322 3.003 1.322 4.138-.002 2.571-1.061 4.741-2.769 5.878z",
            //fillColor: '#FF0000',
            //fillOpacity: .6,
            //anchor: new google.maps.Point(22.5, 50),
            //strokeWeight: 0,
            //scale: 1
        }
    });
    //Create a circle and placed it on the map.
    //確認是否在marker方圓300公尺範圍內
    var circle = new google.maps.Circle({
        center: { lat: _latitude, lng: _longitude },
        radius: 300, //半徑
        strokeOpacity: 0, //圓圈外框
        fillColor: '#f00', //圓圈填滿之顏色
        fillOpacity: 0.2, //圓圈填滿之透明度
        map: _map
    });

    //Set unique id
    marker.id = _uniqueID; //通報地標之id，單一刪除地標用
    _uniqueID++;

    //Attach click event handler to the marker.
    google.maps.event.addListener(marker, "click", function (e) {
        var content = "";
        content += 'Latitude: ' + _latitude + '<br />Longitude: ' + _longitude;
        content += "<br /><input type = 'button' value = 'Delete' onclick = 'delMarkerOnFile(" + _type + ", " + _latitude + ", " + _longitude + "); delMarkerOnMap(" + marker.id + ");' />";
        var infoWindow = new google.maps.InfoWindow({
            content: content
        });
        infoWindow.open(_map, marker);
    });

    //Add marker to the array.
    _arrMarkers.push(marker);
    _arrCircles.push(circle);

    //Check GPS of slef already has into area of circle
    if (circle.getBounds().contains({ lat: _latitudeLocal, lng: _longitudeLocal })) {
        //alert("police");

        //$('#myAudio').play();
        var x;

        if (_type != null && _type != "") {
            if (_type == "1") {
                x = document.getElementById("BbAudio");
            } else if (_type == "2") {
                x = document.getElementById("BalarmAudio");
            } else if (_type == "3") {
                x = document.getElementById("CameraAudio");
            } else if (_type == "4") {
                x = document.getElementById("CameraAudio");
            } else if (_type == "5") {
                x = document.getElementById("BalarmAudio");
            }

            x.play();
        }
    }
}

//於地圖上刪除全部之marker、circle
function delAllMarkersOnMap() {
    //Find and remove the marker from the Array
    for (var i = 0; i < _arrMarkers.length; i++) {
        //Remove the marker from Map
        _arrMarkers[i].setMap(null);
        _arrCircles[i].setMap(null);
    }
    _arrMarkers = [];
    _arrCircles = [];
}
//於地圖上刪除所點選之marker、circle
function delMarkerOnMap(id) {
    //Find and remove the marker from the Array
    for (var i = 0; i < _arrMarkers.length; i++) {
        if (_arrMarkers[i].id == id) {
            //Remove the marker from Map
            _arrMarkers[i].setMap(null);
            _arrCircles[i].setMap(null);
            //Remove the marker from array
            _arrMarkers.splice(i, 1);
            _arrCircles.splice(i, 1);
        }
    }
}

//於後端增加通報地標
function addMarkerOnFile(_type, _latitude, _longitude) {
    var _data = { "PlaceType": _type, "Latitude": _latitude, "Longitude": _longitude };
    $.post(_addUrl, _data, function (result) {
        //var _data = result.data;
        ////alert("cnt:" + _data.length.toString() + ";" + _data[0]["Latitude"]);
    });
}
//於後端刪除通報地標
function delMarkerOnFile(_type, _latitude, _longitude) {
    var _data = { "PlaceType": _type, "Latitude": _latitude, "Longitude": _longitude };
    $.post(_delUrl, _data, function (result) { 
    });
}

//取得GPS失敗
function getFail(evt) {
    alert("GPS取得失敗");
}

//click radio button(通報類別) on dialog
function SetTypeOptions(_type) {
    $('#HidPlaceType').val(_type);
}

//click button(確認) on dialog
function saveClickMarker(_map, _latitude, _longitude) {
    var _type = $('#HidPlaceType').val();

    if (_type != "" && _type != null && _latitude != null && _latitude != "" && _longitude != null && _longitude != "") {
        addMarkerOnMap(_map, $('#HidPlaceType').val(), _latitude, _longitude); //於地圖上增加該地標
        addMarkerOnFile($('#HidPlaceType').val(), _latitude, _longitude); //於後端增加該地標
    }

    //clear
    $('#HidPlaceType').val('');
    $('input[name=MarkerType]').prop('checked', false);

    $('#SetMarkerTypeModal').modal("hide"); //close dialog
}


