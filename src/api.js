// src/api.js
export const mapbox = async ({longitude, latitude, departAt, timeInMinutes, driveMode}) => {
    const modeMap = {
        driving: 'driving-traffic',
        walking: 'walking',
        cycling: 'cycling',
        public_transport: undefined
    }
    driveMode = modeMap[driveMode]
    if (!driveMode) {
        return []
    }
    const response = await fetch(`https://api.mapbox.com/isochrone/v1/mapbox/${driveMode}/${longitude},${latitude}?contours_minutes=${timeInMinutes}&polygons=true&denoise=1&access_token=pk.eyJ1Ijoic2FjaGluYWdyYXdhbDEiLCJhIjoiY2x4YzR5cWh3Mjc2MTJtc2FiMjdzYzM4YyJ9.GuP5j5jXmVf2FG8KyF0XyA`);
    const result = await response.json();
    return result.features.map(({geometry}) => geometry.coordinates.map(x => x.map(([lng, lat]) => ({lng, lat}))))[0];
};
const formatToISO8601 = (date) => {
    return date + ':00Z'; // Ensures the format is YYYY-MM-DDThh:mm:ssZ
}
export const travelTime = async ({longitude, latitude, departAt, timeInMinutes, driveMode}) => {
    departAt = formatToISO8601(departAt)
    const response = await fetch(`https://api.traveltimeapp.com/v4/time-map?lat=${latitude}&lng=${longitude}&travel_time=${timeInMinutes*60}&type=${driveMode}&departure_time=${departAt}&app_id=11c213f9&api_key=03c06670f63546b4fb68de3164a3ee58`);
    const res = await response.json();
    if (res.results.length) {
        return res.results[0].shapes.map(x => x.shell)
    }
    return [];
};


export const osm = async ({longitude, latitude, departAt, timeInMinutes, driveMode}) => {

    const modeMap = {
        driving: 'auto',
        walking: 'pedestrian',
        cycling: 'bicycle',
        public_transport: 'multimodal'
    }
    driveMode = modeMap[driveMode]
    if (!driveMode) {
        return []
    }
    const data = {
        "denoise":1,
        "date_time":{"type":1,"value":departAt},
        "polygons":true,
        "locations":[{"lat":latitude,"lon":longitude, ...(driveMode === 'multimodal' ? {type: 'break'} : {})}],
        "costing": driveMode,
        ...(driveMode === 'multimodal' ? {
            "costing_options":{"transit":{"use_bus":"0.4","use_rail":"0.9","use_transfers":"0.6"}}
        }: {}),
        "contours":[{"time":parseInt(timeInMinutes),"color":"ff0000"}]
    }

    const url = `https://valhalla1.openstreetmap.de/isochrone?json=${JSON.stringify(data)}`

    const response = await fetch(url);
    const result = await response.json();
    return result.features.map(({geometry}) => geometry.coordinates.map(x => x.map(([lng, lat]) => ({lng, lat}))))[0];
}