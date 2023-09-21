import { OPEN_WEATHER_API_KEY, MAPBOX_API_KEY, TICKETMASTER_API_KEY} from './keys.js';

const inputValue = document.querySelector('.inputValue');
const button = document.querySelector('.button');
const errorMsg = document.querySelector('.errorMsg');

const cityInfo = document.querySelector('#cityInfo');
const cityName = document.querySelector('.cityName');
const cityTemp = document.querySelector('.cityTemp');
const cityDesc = document.querySelector('.cityDesc');

const mapContainer = document.querySelector('#mapContainer');

const eventInfo = document.querySelector('#eventInfo');
const eventHeader = document.querySelector('.eventHeader');
const eventHeaderBorder = document.querySelector('.eventHeaderBorder');
const eventList = document.querySelector('.eventList');
const eventMsg = document.querySelector('.eventMsg');

button.addEventListener('click', async function(){
    try{
        //ADDITIONAL INFO
        errorMsg.classList.remove('show');
        errorMsg.classList.add('hide');
        
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

        if (cityCoordinates) {
            const mapImageElement = await fetchMapboxStaticMap(cityCoordinates);

            mapContainer.innerHTML = '';
            mapContainer.appendChild(mapImageElement);
        } else {
            console.error("Error fetching city coordinates");
        }

        // TICKETMASTER API
        await fetchEvents();
    } catch(error){
        errorMsg.classList.remove('hide');
        errorMsg.classList.add('show');
        errorMsg.innerText = 'Error fetching City info - Perhaps you mispelled?';
        console.error("Error fetching City info - Perhaps you mispelled?");
    }

    //Fetch long/lan for mapbox url (why can't you just enter a cityname? :( )
    async function getCityCoordinates(cityName) {
        const geocodingApiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${cityName}.json?access_token=${MAPBOX_API_KEY}`;

        try {
            const response = await fetch(geocodingApiUrl);
            const coordinateData = await response.json();

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

    async function fetchEvents() {
        try {
            const eventUrl = `https://app.ticketmaster.com/discovery/v2/events.json?city=${inputValue.value}&apikey=${TICKETMASTER_API_KEY}`
            const response = await fetch(eventUrl);

            if(response.ok){
                eventHeader.classList.remove('hide');
                eventHeader.classList.add('show');
                eventHeaderBorder.classList.remove('hide');
                eventHeaderBorder.classList.add('show');
                const eventData = await response.json();

                if(eventData.page.totalElements === 0){
                    eventList.innerHTML = '';
                    eventMsg.innerText = 'There were no events found for this City';
                    eventMsg.classList.remove('hide');
                    eventMsg.classList.remove('show');
                } else if(eventData.page.totalElements > 0){
                    //Clears details in case of multiple searches
                    eventMsg.innerText = '';
                    eventList.innerHTML = '';
                    eventInfo.classList.add('border');

                    //Was gonna use tables but this is cleaner for a task of this size.
                    eventData._embedded.events.forEach(event => {
                        const venues = event._embedded.venues;
                        let eventText = event.name + '<br>';
                        eventText += event.dates.start.localDate + ', ' + event.dates.start.localTime;
                        for(const venue of venues) {
                            eventText += ', ' + venue.name;
                        }

                        //Insert new data
                        const eventRes = document.createElement('p');
                        eventRes.classList.add('event');
                        eventRes.innerHTML = eventText;

                        eventList.appendChild(eventRes);
                    });
                    //Not sure how to do this with my eventList variable, didn't have time to look into it.
                    document.querySelectorAll('.eventList > p:nth-child(odd)').forEach((eventRes) => eventRes.classList.add('oddEvent'));
                };
            } else {
                throw new Error(`Error fetching events (${response.status} - ${response.statusText})`)
            }
        } catch(error) {
            console.error("Error fetching event data", error);
        };
    };
});
