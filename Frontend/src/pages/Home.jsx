import Navbar from "../components/Navbar";
import About from "../components/About";
import ParticlesBackground from "../components/Particle";
import { useState, useEffect } from "react";
import axios from "axios";
import { api } from "../config";

function Home() {
  const [stats, setStats] = useState({
    activeItems: 0,
    itemsReturned: 0,
    totalRewards: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [user, setUser] = useState({
    name: "Alger",
    email: "algerim66975@gmail.com"
  });

  useEffect(() => {
    // Fetch stats and recent items
    axios
      .get(`${api}/item`)
      .then((res) => {
        const items = res.data.data || [];
        setStats({
          activeItems: items.length,
          itemsReturned: 0, // You might want to track this in your backend
          totalRewards: 100 // You might want to calculate this
        });
        
        // Get recent items (last 2 items)
        setRecentItems(items.reverse().slice(0, 2));
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleLogout = () => {
    // Add your logout logic here
    console.log("Logout clicked");
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      window.location.href = `/find?search=${e.target.value}`;
    }
  };

  return (
    <main>
      <Navbar />
      <div className="particle-container">
        <ParticlesBackground />
      </div>
      
      <div className="home-container">
        <div className="hero-section">
          <h1 className="hero-title">Find What Matters</h1>
          <p className="hero-subtitle">Connect lost items with their owners</p>
          
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search items..." 
              className="search-input"
              onKeyPress={handleSearch}
            />
          </div>
          
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-number">{stats.activeItems}</div>
              <div className="stat-label">Active Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.itemsReturned}</div>
              <div className="stat-label">Items Returned</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.totalRewards}</div>
              <div className="stat-label">Total Rewards</div>
            </div>
          </div>
        </div>
        
        <div className="content-section">
          <div className="user-info">
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
          
          <div className="recent-items">
            <h2 className="section-title">Recent Items</h2>
            <div className="items-list">
              {recentItems.length > 0 ? (
                recentItems.map((item, index) => (
                  <div className="item-card" key={index}>
                    <div className="item-name">{item.title}</div>
                    <div className="item-time">Recently added</div>
                  </div>
                ))
              ) : (
                <div className="item-card">
                  <div className="item-name">No recent items</div>
                  <div className="item-time">-</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <About />
    </main>
  );
}

export default Home;