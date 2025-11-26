import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import Navbar from "../components/Navbar";
import { api } from "../config";
import "leaflet/dist/leaflet.css";


// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Smooth recentering component
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng]);
  return null;
};

function MapPage() {
  const [items, setItems] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(true);

  // Fetch ALL items for map
  const fetchAllItems = async () => {
    try {
      const res = await axios.get(`${api}/item`);
      setItems(res.data.data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items near user using your 2dsphere endpoint
  const fetchNearbyItems = async (lat, lng) => {
    try {
      const res = await axios.get(
        `${api}/items/near?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      setItems(res.data.data || []);
    } catch (error) {
      console.error("Error fetching nearby items:", error);
    }
  };

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbyItems(latitude, longitude);
      },
      (err) => {
        console.error(err);
        alert("Could not get your location.");
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  return (
    <main>
      <Navbar />

      <div className="map-header">
        <h1>Lost & Found Map</h1>

        {/* Radius Filter */}
        <div className="radius-control">
          <label>Radius: {radius} km</label>
          <input
            type="range"
            min="1"
            max="20"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />

          <button className="geo-btn" onClick={getUserLocation}>
            Find Nearby Items
          </button>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={[51.128, 71.4304]}
          zoom={12}
          style={{ height: "80vh", width: "100%" }}
        >
          {/* Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Recenter on user */}
          {userLocation && (
            <>
              <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>You are here</Popup>
              </Marker>
            </>
          )}

          {/* Item markers */}
          {!loading &&
            items.map((item) =>
              item.location?.coordinates ? (
                <Marker
                  key={item._id}
                  position={[
                    item.location.coordinates[1],
                    item.location.coordinates[0],
                  ]}
                >
                  <Popup>
                    <div className="popup-card">
                      <h3>{item.title}</h3>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="popup-image"
                        />
                      )}
                      <button
                        className="popup-btn"
                        onClick={() =>
                          (window.location.href = `/details/${item._id}`)
                        }
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
        </MapContainer>
      </div>
    </main>
  );
}

export default MapPage;
