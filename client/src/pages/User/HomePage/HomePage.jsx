import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import Banner from './Banner';
import DailyUpdates from '../../../components/User/ListReading.jsx';
import HottestSection from '../../../components/User/HottestSection.jsx';
import '../../../components/User/homepage.css';


const HomePage = () => {
  const [accountStatus, setAccountStatus] = useState(null);
  const [endDate, setEndDate] = useState(null);


  useEffect(() => {
    const checkUserStatus = async () => {
      const storedUserId = localStorage.getItem("accountId");
      if (!storedUserId) {
        console.log("Người dùng chưa đăng nhập.");
        setAccountStatus(null);
        return;
      }

      try {
        const response = await axios.post('http://localhost:3001/check-status', {
          accountId: storedUserId,
        });

        const { status, endDate, end_date } = response.data;
        setAccountStatus(status);
        setEndDate(endDate);

        if (!status && end_date && !localStorage.getItem("vipExpiredNotificationShown")) {
          Swal.fire({
            icon: 'info',
            title: 'Hết hạn VIP',
            text: 'Gói VIP của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
            confirmButtonText: 'OK',
          });

          // Lưu trạng thái đã hiển thị thông báo vào localStorage
          localStorage.setItem("vipExpiredNotificationShown", "true");
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái tài khoản:", error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Có lỗi xảy ra khi kiểm tra trạng thái tài khoản.',
          confirmButtonText: 'OK',
        });
      }
    };

    checkUserStatus();
  }, []);

  return (
    <div className="u-main-page">
      <Header />
      <Navbar />
      <div className="main-page-content">
        <div className="banner-container">
          <Banner />
        </div>
        <div className="second-section-container">
          <div className="first-section-container">
            <DailyUpdates />
          </div>
          <div className="second-section-container">
            <HottestSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;