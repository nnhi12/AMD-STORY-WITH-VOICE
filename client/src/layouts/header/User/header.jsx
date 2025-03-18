import React, { useState, useEffect } from 'react';
import './header.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';

import { API_URL } from "../../../env.js";

const Header = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [username, setUsername] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleSearch = async () => {
    if (typeof onSearch === 'function') {
      onSearch(searchTerm);
    }
    try {
      const response = await axios.get(`${API_URL}/searchstory?name=${searchTerm}`);
      const results = response.data;
      console.log('Search Results:', results);

      // Chỉ chuyển hướng khi đã có kết quả tìm kiếm
      navigate("/searchresult", { state: { searchResults: results } });
    } catch (error) {
      console.error('Error searching stories:', error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("accountId");
    localStorage.removeItem("vipExpiredNotificationShown");
    setUsername("");
    setDropdownOpen(false);
    navigate("/login");
  };

  const handleLibraryClick = () => {
    const username = localStorage.getItem('username');
    if (!username) {
      // User is not logged in, show SweetAlert2 notification
      Swal.fire({
        title: 'Please log in',
        text: 'You need to be logged in to access the Library.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
      // User is logged in, navigate to the Library page
      navigate('/library');
    }
  };

  const handleVIPClick = () => {
    const username = localStorage.getItem('username');
    if (!username) {
      // User is not logged in, show SweetAlert2 notification
      Swal.fire({
        title: 'Please log in',
        text: 'You need to be logged in to be a VIP Member.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
      // User is logged in, navigate to the Library page
      navigate('/payment');
    }
  };

  return (
    <div className="u-header">
      <div className="u-top-bar">
        <Link to="/" className="u-logo">
          <img src="https://genk.mediacdn.vn/thumb_w/640/2014/amdlogo-1407485590324.jpg" alt="AMD Logo" />
        </Link>
        <div className="u-search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch} className="search-button">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS32N6i_mjMes8qXIXw7iKeqhvUN3G7YFHwHff07CgXDEcSA5y9a6evlCfP21SvdLM310o&usqp=CAU"
              alt="Search"
            />
          </button>
        </div>
        <div className="u-nav-links">
          <a href="#" onClick={handleLibraryClick}>Library</a>
          <a href="#"onClick={handleVIPClick}>VIP Member👑</a>
          {username ? (
            <div className="abc-button" onClick={toggleDropdown}>
              {username}
              {dropdownOpen && (
                <div className="a-dropdown-menu">
                  <Link to="/userinfo" onClick={() => setDropdownOpen(false)}>Profile</Link>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/register" className="abc-button">Sign Up</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
