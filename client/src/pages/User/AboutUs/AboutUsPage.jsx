import React from 'react';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import AboutUs from './AboutUs.jsx';
import '../../../components/User/Page.css';

const AboutPage = () => (
  <div className="all-page">
    <Header />
    <Navbar />
    <div className="all-content">
      <AboutUs />
    </div>
    <Footer />
  </div>
);

export default AboutPage;
