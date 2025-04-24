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
      const userID = localStorage.getItem("userId");
      console.log('Search - userID:', userID);
      
      // Xây dựng URL với userID và searchTerm
      let apiUrl = `${API_URL}/searchstory?name=${encodeURIComponent(searchTerm)}`;
      if (userID) {
        apiUrl += `&userID=${userID}`;
      } else {
        throw new Error('UserID is required for search');
      }

      console.log('Calling search API:', apiUrl);
      const response = await axios.get(apiUrl);
      const results = response.data;
      console.log('Search Results:', results);

      // Chuyển hướng đến trang kết quả tìm kiếm
      navigate("/searchresult", { state: { searchResults: results } });
    } catch (error) {
      console.error('Error searching stories:', error);
      Swal.fire({
        title: 'Lỗi tìm kiếm',
        text: error.message === 'UserID is required for search' 
          ? 'Vui lòng đăng nhập để tìm kiếm truyện.' 
          : 'Không thể tìm kiếm truyện. Vui lòng thử lại sau.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userID"); // Sửa từ accountId thành userID
    localStorage.removeItem("vipExpiredNotificationShown");
    setUsername("");
    setDropdownOpen(false);
    navigate("/login");
  };

  const handleLibraryClick = () => {
    const username = localStorage.getItem('username');
    if (!username) {
      Swal.fire({
        title: 'Vui lòng đăng nhập',
        text: 'Bạn cần đăng nhập để truy cập Thư viện.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
      navigate('/library');
    }
  };

  const handleVIPClick = () => {
    const username = localStorage.getItem('username');
    if (!username) {
      Swal.fire({
        title: 'Vui lòng đăng nhập',
        text: 'Bạn cần đăng nhập để trở thành Thành viên VIP.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
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
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch} className="search-button">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS32N6i_mjMes8qXIXw7iKeqhvUN3G7YFHwHff07CgXDEcSA5y9a6evlCfP21SvdLM310o&usqp=CAU"
              alt="Tìm kiếm"
            />
          </button>
        </div>
        <div className="u-nav-links">
          <a href="#" onClick={handleLibraryClick}>Thư viện</a>
          <a href="#" onClick={handleVIPClick}>Thành viên VIP 👑</a>
          {username ? (
            <div className="abc-button" onClick={toggleDropdown}>
              {username}
              {dropdownOpen && (
                <div className="a-dropdown-menu">
                  <Link to="/userinfo" onClick={() => setDropdownOpen(false)}>Hồ sơ</Link>
                  <button onClick={handleLogout}>Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/register" className="abc-button">Đăng ký</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;