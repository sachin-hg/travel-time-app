// src/App.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet'
import debounce from 'debounce'
import { autoComplete } from './utils';
import { mapbox, travelTime, osm } from './api';
import classNames from "classnames";


const App = () => {
  const [departAt, setDepartAt] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [startingCoordinates, setStartingCoordinates] = useState(null);
  const [endPoint, setEndPoint] = useState('');
  const [endCoordinates, setEndCoordinates] = useState(null);
  const [drivingMode, setDrivingMode] = useState('driving');
  const [timeInMinutes, setTimeInMinutes] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isEndInputFocused, setIsEndInputFocused] = useState(false);
  const [show, setShow] = useState({
    osm: true,
    travelTime: true,
    mapbox: true
  })

  const [mapboxPolygons, setMapboxPolygons] = useState([]);
  const [travelTimePolygons, setTravelTimePolygons] = useState([]);
  const [osmPolygons, setOsmPolygons] = useState([]);

  const inputRef = useRef();
  const inputEndRef = useRef();

  const mapRef = useRef();

  useEffect(() => {
    // Ensure mapRef is initialized and mapCenter is defined
    if (mapRef.current && startingCoordinates) {
      mapRef.current.setView([startingCoordinates.lat, startingCoordinates.lng], 13); // Set map center and zoom level
    }
  }, [startingCoordinates]);

  const handleAutocomplete = useCallback(debounce(async (searchString) => {
    const suggestions = await autoComplete(searchString);
    setSuggestions(suggestions);
  }, 500), [])

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!startingCoordinates) return;


    const params = {
      longitude: startingCoordinates.lng,
      latitude: startingCoordinates.lat,
      departAt,
      timeInMinutes,
      driveMode: drivingMode
    };

    const mapboxData = await mapbox(params);
    const travelTimeData = await travelTime(params);
    const osmData = await osm(params);

    setMapboxPolygons(mapboxData);
    setTravelTimePolygons(travelTimeData);
    setOsmPolygons(travelTimeData);
    setOsmPolygons(osmData);
    console.log(mapboxData, travelTimeData, osmData)
  };

  const handleSuggestionClick = (suggestion, isEnd) => {

    if (isEnd) {
      setEndPoint(suggestion.name);
      setEndCoordinates(suggestion.coordinates);
      setSuggestions([]);
      setIsEndInputFocused(false);
      return
    }
    setStartingPoint(suggestion.name);
    setStartingCoordinates(suggestion.coordinates);
    setSuggestions([]);
    setIsInputFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
      <div className="app">
        <div className="sidebar">
          <form onSubmit={handleSubmit}>
            <div>
              <label>Depart At:</label>
              <input
                  type="datetime-local"
                  value={departAt}
                  onChange={(e) => setDepartAt(e.target.value)}
              />
            </div>
            <div ref={inputRef} className="autocomplete-container">
              <label>Starting Point:</label>
              <input
                  type="text"
                  value={startingPoint}
                  onFocus={() => setIsInputFocused(true)}
                  onChange={(e) => {
                    setStartingPoint(e.target.value);
                    handleAutocomplete(e.target.value);
                  }}
              />
              {isInputFocused && suggestions.length > 0 && (
                  <div className="suggestions">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="suggestion"
                        >
                          {suggestion.name}
                        </div>
                    ))}
                  </div>
              )}
            </div>
            <div ref={inputEndRef} className="autocomplete-container">
              <label>End Point:</label>
              <input
                  type="text"
                  value={endPoint}
                  onFocus={() => setIsEndInputFocused(true)}
                  onChange={(e) => {
                    setEndPoint(e.target.value);
                    handleAutocomplete(e.target.value);
                  }}
              />
              {isEndInputFocused && suggestions.length > 0 && (
                  <div className="suggestions">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion, true)}
                            className="suggestion"
                        >
                          {suggestion.name}
                        </div>
                    ))}
                  </div>
              )}
            </div>
            <div>
              <label>Driving Mode:</label>
              <select
                  value={drivingMode}
                  onChange={(e) => setDrivingMode(e.target.value)}
              >
                <option value="driving">Driving</option>
                <option value="walking">Walking</option>
                <option value="cycling">Cycling</option>
                <option value="public_transport">Public Transport</option>

              </select>
            </div>
            <div>
              <label>Time in Minutes:</label>
              <input
                  type="number"
                  value={timeInMinutes}
                  onChange={(e) => setTimeInMinutes(e.target.value)}
              />
            </div>
            <div>
              <label>Toggle Polygons</label>
              <div className='btn-container'>
                <button type='button' className={classNames(!show.travelTime && 'disabled')} onClick={() => setShow({
                  ...show,
                  travelTime: !show.travelTime
                })}>TravelTime</button>
                <button type='button' className={classNames(!show.mapbox && 'disabled')} onClick={() => setShow({
                  ...show,
                  mapbox: !show.mapbox
                })}>Mapbox</button>
                <button type='button' className={classNames(!show.osm && 'disabled')} onClick={() => setShow({
                  ...show,
                  osm: !show.osm
                })}>OSM</button>
              </div>
            </div>
            <button type="submit">Submit</button>
          </form>
        </div>
        <div className="map">
          <MapContainer center={startingCoordinates ? [startingCoordinates.lat, startingCoordinates.lng] : [51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }} ref={mapRef} whenCreated={(map) => mapRef.current = map}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
            />
            {startingCoordinates && (
                <Marker position={[startingCoordinates.lat, startingCoordinates.lng]}>
                  <Popup>{startingPoint}</Popup>
                </Marker>
            )}
            {endCoordinates && (
                <Marker position={[endCoordinates.lat, endCoordinates.lng]}>
                  <Popup>{endPoint}</Popup>
                </Marker>
            )}
            {show.mapbox && mapboxPolygons.map((polygon, index) => (
                <Polygon key={index} positions={polygon} fill="#fff"  pathOptions={{color: 'blue'}} fillOpacity={0.7} />
            ))}
            {show.travelTime && travelTimePolygons.map((polygon, index) => (
                <Polygon key={index} positions={polygon} fill="#ff0000" pathOptions={{color: 'green'}} fillOpacity={0.4} />
            ))}
            {show.osm && osmPolygons.map((polygon, index) => (
                <Polygon key={index} positions={polygon} fill="#ff0000" pathOptions={{color: 'yellow'}} fillOpacity={0.4} />
            ))}
          </MapContainer>
        </div>
      </div>
  );
};

export default App;
