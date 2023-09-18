import { OPEN_WEATHER_API_KEY, MAPBOX_API_KEY, TICKETMASTER_API_KEY} from './keys.js';

const button = document.querySelector('.button');
const inputValue = document.querySelector('.inputValue');
const cityInfo = document.getElementById('cityInfo');
const cityName = document.querySelector('.cityName');
const cityTemp = document.querySelector('.cityTemp');
const cityDesc = document.querySelector('.cityDesc');
const mapContainer = document.getElementById('mapContainer');

button.addEventListener('click', async function(){
    try{
        // OPEN WEATHER MAP API
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${inputValue.value}&appid=${OPEN_WEATHER_API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        const nameValue = weatherData['name'];
        const tempValue = weatherData['main']['temp'];
        const feelsLikevalue = weatherData['main']['feels_like'];
        const descValue = weatherData['weather'][0]['description'];

        cityName.innerHTML = nameValue;
        cityTemp.innerHTML = `${tempValue}C (feels like ${feelsLikevalue}C)`;
        cityDesc.innerHTML = descValue;

        cityInfo.classList.add('border');

        // MAPBOX API
        const cityCoordinates = await getCityCoordinates(inputValue.value);
        console.log(cityCoordinates)
        if (cityCoordinates) {
            const mapImageElement = await fetchMapboxStaticMap(cityCoordinates);

            mapContainer.innerHTML = '';
            mapContainer.appendChild(mapImageElement);
        } else {
            console.error("Error fetching city coordinates");
        }

        // TICKETMASTER API

    } catch(error){
        console.error("Error fetching City info");
    }

    //Fetch long/lan for mapbox url (why can't you just enter a cityname? :( )
    async function getCityCoordinates(cityName) {
        const geocodingApiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${cityName}.json?access_token=${MAPBOX_API_KEY}`;

        try {
            const response = await fetch(geocodingApiUrl);
            const coordinateData = await response.json();
            console.log(coordinateData);

            //Only fetch if there's actual data
            if (coordinateData.features && coordinateData.features.length > 0) {
                const [longitude, latitude] = coordinateData.features[0].center;
                return { longitude, latitude };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching coordinates:", error);
            return null;
        }
    }

    //Creates the actual map based on search query
    async function fetchMapboxStaticMap(coordinates) {
        const { longitude, latitude } = coordinates;
        const width = 600;
        const height = 300;
        const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},12,0,0/${width}x${height}?access_token=${MAPBOX_API_KEY}`;

        try {
            const mapImageResponse = await fetch(mapUrl);
            if (mapImageResponse.ok) {
                const mapImageData = await mapImageResponse.blob();
                const mapImageUrl = URL.createObjectURL(mapImageData);
               
                const mapImageElement = document.createElement('img');
                mapImageElement.src = mapImageUrl;
                mapImageElement.width = width;
                mapImageElement.height = height;
                mapImageElement.classList.add("centerImage");
                
                return mapImageElement;
            } else {
                throw new Error('Failed to fetch map image');
            }
        } catch (error) {
            console.error("Mapbox Error:", error);
            return ''; //Returns empty space instead of error map
        }
    }
});
