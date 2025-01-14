import React, { useEffect, useState } from 'react';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import ListReading from '../../../components/User/Library.jsx';
import '../../../components/User/Page.css';


const LibPage = () => {
  const [userId, setUserId] = useState(null); 
  useEffect(() => { 
    const storedUserId = localStorage.getItem("accountId"); 
    setUserId(storedUserId); 
  }, []);

  return (
      <div className="all-page">
        <Header />
        <Navbar />
        <div className="all-content">
          {userId && <ListReading userId={userId} showChapters={true} />}
        </div>
        <Footer />
      </div>
  )
}; 

export default LibPage;
