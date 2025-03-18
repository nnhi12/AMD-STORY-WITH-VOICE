import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {useNavigate } from 'react-router-dom';
import './navbar.css';
import { API_URL } from "../../env.js";

const Navbar = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleFavouritedClick = () => {
    const accountID = localStorage.getItem('accountId');
    if (!accountID) {
      // User is not logged in, show SweetAlert2 notification
      Swal.fire({
        title: 'Please log in',
        text: 'You need to be logged in to access your Favourited stories.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
      // User is logged in, navigate to the Favourited page
      navigate('/favpage');
    }
  };

  return (
    <div className="u-nav-bar">
      <a href="/">Home</a>
      <div className="u-genre-dropdown">
        <button className="u-genre-dropbtn">Genre</button>
        <div className="u-genre-dropdown-content">
          {categories.map(category => (
            <a key={category._id} href={`/classifiedbygenre/${category._id}`}>
              {category.name}
            </a>
          ))}
        </div>
      </div>
      <div className="u-genre-dropdown">
        <button className="u-genre-dropbtn">Classified by Chapter</button>
        <div className="u-genre-dropdown-content">
          <a href="/classifiedbychapter?minChapters=100">More than 100</a>
          <a href="/classifiedbychapter?minChapters=3&maxChapters=100">Between 3 and 100</a>
          <a href="/classifiedbychapter?maxChapters=2">Less than 3</a>
        </div>
      </div>
      <a href="/tophot">Novel HOT</a>
      <a href="#" onClick={handleFavouritedClick}>Favourited</a>
      <a href="/aboutus">About Us</a>
    </div>
  );
};

export default Navbar;
