// src/utils.js
export const autoComplete2 = async (searchString) => {
    const apiKey = 'AIzaSyBIGSfeoDDeRWSo6Rnfw-hQLYWT2KYMqTA';
    const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchString)}&key=${apiKey}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const placeIds = data.predictions.map(prediction => prediction.place_id);
    return getPlaceDetails(placeIds, apiKey);
};

const getPlaceDetails = async (placeIds, apiKey) => {
    const placeDetailsPromises = placeIds.map(async placeId => {
        const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,geometry`;
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const place = data.result;
        return {
            name: place.name,
            coordinates: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            }
        };
    });

    return Promise.all(placeDetailsPromises);
};

export const autoComplete = async (searchString) => {
    const endpoint = 'https://api.traveltimeapp.com/v4/geocoding/search';
    const params = new URLSearchParams({
        query: searchString,
        'within.country': 'IN'
    });

    return fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-US',
            'X-Application-Id': '11c213f9',
            'X-Api-Key': '03c06670f63546b4fb68de3164a3ee58'
        }
    }).then((res) => res.json()).then(res => {
        return res.features.filter(x => x.geometry.type === 'Point').map(x => ({
            name: x.properties.name,
            coordinates: {
                lat: x.geometry.coordinates[1],
                lng:x.geometry.coordinates[0]
            }
        }))
    })
}