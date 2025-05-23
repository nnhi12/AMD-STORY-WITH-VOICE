import React from 'react';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import ListStory from '../../../components/User/ListHostStory.jsx';
import ListGenre from '../../../components/User/ListGenre.jsx';
import '../../../components/User/homepage.css';
import useVoiceControl from '../../../utils/voiceControl.js';


const TopHotStory = () => {
  useVoiceControl("", "", "");
  return (
  <div className="u-main-page">
    <Header />
    <Navbar />
    <div className="main-page-content">
        <div className="second-section-container">
          <div className="first-section-container">
            <ListStory />
          </div>
          <div className="second-section-container" style={{ marginBottom: "10px" }}>
            <ListGenre />
          </div>
        </div>
      </div>
    <Footer />
  </div>)
};

export default TopHotStory;
