import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { API_URL } from '../../../env.js';
import useVoiceControl from '../../../utils/voiceControl.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  console.log('API_URL:', API_URL);

  const handleSubmit = async (e, voiceData = null) => {
    if (e) e.preventDefault();
    const data = voiceData || { email, newPassword };
    console.log('Submitting reset password request:', data);
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/reset-password`, data);
      console.log('Reset password response:', response.data);
      setMessage(response.data.message || 'Mật khẩu của bạn đã được thay đổi thành công!');
      speak(response.data.message || 'Mật khẩu của bạn đã được thay đổi thành công!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Lỗi trong việc thay đổi mật khẩu. Vui lòng kiểm tra kết nối hoặc thử lại.';
      setMessage(errorMsg);
      speak(errorMsg);
    }
    setLoading(false);
  };

  const callbacks = {
    setEmail: (emailValue) => {
      console.log('Setting email:', emailValue);
      setEmail(emailValue);
      speak(`Đã nhập email: ${emailValue}`);
    },
    setNewPassword: (passwordValue) => {
      console.log('Setting new password:', passwordValue);
      setNewPassword(passwordValue);
      speak('Đã nhập mật khẩu mới.');
    },
    submitResetPassword: (voiceData) => {
      console.log('submitResetPassword called with:', voiceData);
      handleSubmit(null, voiceData);
    },
  };

  const { speak } = useVoiceControl({
    callbacks,
  });

  useEffect(() => {
    if (message && !message.includes('thành công')) {
      speak(message);
    }
  }, [message, speak]);

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
            {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;