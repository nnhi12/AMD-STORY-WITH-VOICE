import React from 'react';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import UserInfo from './UserInfo';
import '../../../components/User/Page.css';


const UserInformationPage = () => {
  return (
    <div className="all-page">
      <Header />
      <Navbar />
      <div className="all-content">
        <UserInfo />
      </div>
      <Footer />
    </div>
  );
};

export default UserInformationPage;
