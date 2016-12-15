"use strict";
var map;
var mapOptions;
var latitude = 43.0839;
var longitude = -77.680224;
	
var spheres = [];
var canvas;
var ctx;
var arb =0;	
var infowindow;
var markers = [];
		
//////////////////////////////////////////////////////////MAP SET UP
    function initMap() {
		mapOptions = {
		center: {lat: latitude, lng: longitude},
		zoom: 13
		};
		
		map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
	}
	  
	function createContent(){ //creating Map Content
		  
		var request = {
			location: {lat: latitude, lng: longitude},
			radius: '5000',
			types:['grocery_or_supermarket']
		};
		var service = new google.maps.places.PlacesService(map);
		service.nearbySearch(request, callback);
		
		
		function callback(results, status){
			if(status == google.maps.places.PlacesServiceStatus.OK) {
			for(var i=0; i<results.length; i++){
				var place = results[i];
				createMarker(results[i]);
				}
			};
			
			function createMarker(place){
				var marker = new google.maps.Marker({
					map: map,
					position: place.geometry.location
					
				});
				
				google.maps.event.addListener(marker, 'click', function(e){
					var pos = this.position;
					service.getDetails(place, function(result, status){
						
					makeInforWindow(pos, result.name);
					////console.log(result.name);
					});
				});
				
				markers.push(marker);
				
			};
		
			function makeInforWindow(position, msg){
				if(infowindow) infowindow.close();
				
				infowindow = new google.maps.InfoWindow({
					map: map,
					position: position,
					content: "<b>" + msg + "</b>"
				});
			};
		}
	}
	 //////////////////////////////////////////////
	 //GEOLOCATION
	function findLoc() {
		var output = document.getElementById("out");
		
		if (!navigator.geolocation){
			output.innerHTML = "<p>Browser can't use GeoLocations</p>";
			return;
		}
		
		function success(position) {
			latitude  = position.coords.latitude;
			longitude = position.coords.longitude;
				
			createContent();
		}
		
		function error() {
			output.innerHTML = "Unable to retrieve your location";
		}
		navigator.geolocation.getCurrentPosition(success, error);
}
	 
	 
	 ////////////////////////////////////////////////
	 
	 //RECIPE SECTION
	 var APP_ID = "6dbe49df";
	 var APP_KEY = "4b8738ca70e4c40aac963cd44e3cdae5";
	 var Q;
	 
	 var calMin =0;
	 var calMax =500;
	 
	 window.onload = init;
	 function init(){
		///////////////////////////////////BG SET UP
		canvas = document.querySelector('canvas');
		ctx = canvas.getContext('2d');
	
		ctx.fillStyle = "#ffd480";
		ctx.globalAlpha = 0.5;
		
		makeSpheres(25);
		for(var i=0; i<spheres.length;i++){
			spheres[i].startX = spheres[i].x;
		}
		update();
		 
		 ////////////////////////////////////////////// END OF BG 
		document.querySelector("#search").onclick = getData;
	 }
	 ///////////////////////////////////////BG ANIMATION
	 
	function update(){
		ctx.clearRect(0,0, canvas.width, canvas.height);
		
		for(var i=0; i<spheres.length; i++){
		
			if(spheres[i].y<-spheres[i].size+1){
				spheres[i].y += 900;
				spheres[i].startX = Math.floor((Math.random() * 1000) + 1);
				spheres[i].x = spheres[i].startX;
				spheres[i].speed = (Math.random() * 2) + 0.5;
			}
			spheres[i].y -=spheres[i].speed;
			spheres[i].x = Math.sin(arb) * 120 + spheres[i].startX;
			arb += (1+ spheres[i].offset/20)/360*Math.PI / (9+spheres[i].offset);
			
			ctx.beginPath();
			ctx.arc(spheres[i].x, spheres[i].y,spheres[i].size,0,2*Math.PI);
			ctx.fill();
		}
		window.requestAnimationFrame(update);
	}

	function makeSpheres(num){
		for(var i=0; i<num; i++){
			var ball ={
				size: Math.random()*20+10,
				speed: (Math.random() * 2) + 0.25,
				x: Math.floor((Math.random() * 1000) + 1),
				y:  Math.floor((Math.random() * 500) + 400),
				offset: Math.random()*30+1,
				startX: 0
			};
			spheres[i] = ball;
		}
	}
	 
	 /////////////////////////////////////////// RECIPE API	 
	 
	function setCal(amount){ //set the calorie range
		 if(amount == "low"){
			 calMin = 0;
			 calMax = 500;
		 }
		 else if(amount == "mid"){
			 calMin = 600;
			 calMax = 1000;
		 }
		 else{
			 calMin = 1000;
			 calMax = 5000;
		 }
	}
	
	function getData(){
		 //console.log("clicked");
		Q = document.querySelector("#searchFood").value;
		Q = Q.trim();
		if(Q.length < 1) return;
		
		document.querySelector("#dynamicContent").innerHTML = "<b>Searching for " + Q + "</b>";
		Q = encodeURI(Q);
		
		var url = "https://api.edamam.com/search?";
		url += "q=" + Q + "&app_id=" + APP_ID+ "&app_key=" +APP_KEY;
		
		//SETTING CALORIE COUNT
		url+="&calories=gte%20" + calMin + ",%20lte%20"+ calMax;
		
		//CHANGING DIET CATEGORY
		var category = document.getElementById("category").value;
		//console.log(category);
		category = encodeURI(category);
		url+= "&diet="+ category;
		
		url+="&callback=jsonLoaded";
		
		$.ajax({
		  dataType: "jsonp",
		  url: url,
		  data: null
		});
	}
	
	function jsonLoaded(obj){
		//console.dir(obj);
		
		// if there's an error, print a message and return
		if(obj.error){
			var status = obj.status;
			var description = obj.description;
			document.querySelector("#dynamicContent").innerHTML = "<h3><b>Error!</b></h3>" + "<p><i>" + status + "</i><p>" + "<p><i>" + description + "</i><p>";
			$("#dynamicContent").fadeIn(500);
			return;
		}
		
		
		var allRecipes = obj.hits;
		var bigString = "";
		
		for (var i=0;i<allRecipes.length;i++){ //sets up the variables used to create recipe sections + makes the sections
			var recipe = allRecipes[i].recipe;
			
			var title = recipe.label;
							if (!title) title = "No description found";
			var linkToPage = recipe.url;
							if (!linkToPage) linkToPage = "No link found";
			var calories = recipe.calories;
							if (!linkToPage) linkToPage = "No calorie data found";
			var image = recipe.image;
							if (!image) image = "null";
			var ingredients = recipe.ingredientLines;
							if(!ingredients) ingredients = null;
			var dietLabels = recipe.dietLabels;
							if(dietLabels.length==0) dietLabels = ["no labels available"];
			
			///////////////////////////////////////////////creating html for recipe sections
			var line = "<div class='recipe'>";
			line += "<img src="+ image + " class=\"recipeImage\"/> <br>";
			line += "<h3>" + title + "</h3> <i>";
			for(var k=0;k<dietLabels.length-1; k++){
				line+= dietLabels[k] + ", ";
			}
			line += dietLabels[dietLabels.length-1] + "</i><br>";
			line += "<i>" + Math.round(calories * 100) / 100 + " cal.</i><br>";
			line+="<br><b>Ingredients: </b><ul>";
			for(var j=0;j<ingredients.length;j++){
				line+= "<li>"+ ingredients[j]+ "</li>";
			}
			line +="</ul>";
			line += "<a href=" + linkToPage + ">Link to Page </a>";
			line += "</div>";
			
			bigString += line;
		}
		
		if(allRecipes.length ==0) //if there are no results found
			bigString = "No Results Found! Sorry!"
		
		document.querySelector("#dynamicContent").innerHTML = bigString;
		$("#dynamicContent").fadeIn(500);
			
	}	