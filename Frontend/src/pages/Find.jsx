import React, { useState, CSSProperties, useEffect } from "react";
import Itemcard from "../components/ItemCard";
import Navbar from "../components/Navbar";
import axios from "axios";
import { api } from "../config";
import HashLoader from "react-spinners/HashLoader";
import AOS from "aos";
import "aos/dist/aos.css";
import { useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

function Find() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [geoLoading, setGeoLoading] = useState(false); // NEW

  const location = useLocation();

  const override: CSSProperties = {
    display: "block",
    borderColor: "#fdf004",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)"
  };

  // Init animations
  useEffect(() => {
    AOS.init({ duration: 750 });
  }, []);

  // Load items based on forwarded search OR load all
  useEffect(() => {
    if (location.state?.searchQuery) {
      const q = location.state.searchQuery;
      setSearchQuery(q);
      searchItems(q);
    } else {
      fetchAllItems();
    }
  }, [location.state]);

  // -------------------------------
  // SEARCH ITEMS
  // -------------------------------
  const searchItems = async (query) => {
    setLoading(true);
    setSearchLoading(true);
    try {
      const res = await axios.get(`${api}/search?q=${encodeURIComponent(query)}`);
      setFilteredItems(res.data.data || []);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // -------------------------------
  // FETCH ALL ITEMS
  // -------------------------------
  const fetchAllItems = () => {
    setLoading(true);
    axios
      .get(`${api}/item`)
      .then((res) => {
        const itemsData = res.data.data || [];
        setItems(itemsData);
        setFilteredItems([...itemsData].reverse());
        setLoading(false);
        setHasSearched(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  };

  // -------------------------------
  // HANDLE SEARCH
  // -------------------------------
  const handleSearch = async (e) => {
    if ((e.key === "Enter" || e.type === "click") && searchQuery.trim()) {
      setSearchLoading(true);
      try {
        const response = await axios.get(
          `${api}/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const searchResults = response.data.data || [];
        setFilteredItems(searchResults);
        setHasSearched(true);
      } catch (error) {
        console.error("Search error:", error);

        // Local fallback filter
        const filtered = items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description &&
              item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredItems(filtered);
        setHasSearched(true);
      } finally {
        setSearchLoading(false);
      }
    } else if (!searchQuery.trim()) {
      setFilteredItems([...items].reverse());
      setHasSearched(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredItems([...items].reverse());
    setHasSearched(false);
  };

  // -------------------------------
  // 🔥 NEW: Fetch items near user
  // -------------------------------
  const fetchNearbyItems = async (lat, lng, radius = 5) => {
    try {
      setGeoLoading(true);
      const res = await axios.get(
        `${api}/items/near?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      setFilteredItems(res.data.data || []);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setGeoLoading(false);
    }
  };

  // -------------------------------
  // 🔥 NEW: Handle "Find Near Me" button
  // -------------------------------
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchNearbyItems(latitude, longitude, 5);
      },
      (err) => {
        console.error(err);
        alert("Unable to get your location.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <main id="findpage">
      <Navbar />

      <section>
        <h1 className="lfh1">
          {hasSearched
            ? `Search Results for "${searchQuery}"`
            : "Lost and Found Items"}
        </h1>

        {/* Search Bar */}
        <div className="search-container-find">
          <div className="search-input-wrapper">
            <SearchIcon className="search-icon" />

            <input
              type="text"
              placeholder="Search for items by title or description..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
              disabled={searchLoading}
            />

            {searchQuery && (
              <button className="clear-search" onClick={clearSearch}>
                <ClearIcon />
              </button>
            )}

            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? "..." : "Search"}
            </button>
          </div>
        </div>

        {/* 🔥 NEW: Near Me Button */}
        <div className="nearby-container" style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            className="nearby-btn"
            onClick={handleFindNearby}
            disabled={geoLoading}
            style={{
              padding: "20px 30px",
              background: "#fdf004",
              borderRadius: "6px",
              border: "none", 
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            {geoLoading ? "Finding Nearby..." : "Find Items Near Me"}
          </button>
        </div>

        {/* Results Info */}
        {hasSearched && (
          <div className="search-results-info" style={{ textAlign: "center", marginTop: "20px" }}>
            <p>
              Found {filteredItems.length} item
              {filteredItems.length !== 1 ? "s" : ""}
            </p>
            <button className="clear-results-btn" onClick={clearSearch}>
              Show all items
            </button>
          </div>
        )}

        <div className="item-container" style={{ textAlign: "center", marginTop: "20px" }}>
          <HashLoader
            color="#fdf004"
            loading={loading}
            cssOverride={override}
            size={50}
            aria-label="Loading Spinner"
          />

          {!loading && filteredItems.length === 0 && hasSearched && (
            <div className="no-results">
              <h3>No items found for "{searchQuery}"</h3>
              <p>Try different keywords or browse all items</p>
              <button onClick={clearSearch} className="browse-all-btn">
                Browse All Items
              </button>
            </div>
          )}

          {!loading && filteredItems.length === 0 && !hasSearched && (
            <div className="no-results">
              <h3>No items available</h3>
              <p>Be the first to post a found item!</p>
            </div>
          )}

          {filteredItems.map((findItem) => (
            <Itemcard
              key={findItem._id}
              id={findItem._id}
              title={findItem.title}
              description={findItem.description}
              image={findItem.image}
            />
          ))}

          <div className="extraItem"></div>
          <div className="extraItem"></div>
          <div className="extraItem"></div>
        </div>
      </section>
    </main>
  );
}

export default Find;
