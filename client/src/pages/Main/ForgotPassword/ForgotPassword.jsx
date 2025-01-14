import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Khai báo useNavigate để điều hướng

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3001/reset-password", { email, newPassword });
      setMessage(response.data.message || "Mật khẩu của bạn đã được thay đổi thành công!");

      // Chờ 3 giây trước khi chuyển hướng
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setMessage("Lỗi trong việc thay đổi mật khẩu. Vui lòng thử lại.");
    }
    setLoading(false);
  };

  return (
    <div className="forgot-password-body">
      <div className="forgot-password-overlay"></div>
      <div className="forgot-password-container">
        <h2>Quên Mật Khẩu</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;
