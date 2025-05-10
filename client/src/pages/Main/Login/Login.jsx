import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { API_URL } from '../../../env.js';
import useVoiceControl from '../../../utils/voiceControl.js';

function Login() {
  const navigate = useNavigate();
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e, voiceData = null) => {
    if (e) e.preventDefault();
    const formData = voiceData || createForm;
    console.log('Submitting formData:', formData);
    if (!formData.username || !formData.password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/login`, formData);
      const { account, user } = response.data;

      if (account && user) {
        localStorage.setItem('accountId', account._id);
        localStorage.setItem('username', account.username);
        localStorage.setItem('userId', user._id);
        setErrorMessage('Đăng nhập thành công!');
        navigate('/');
      } else {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data);
      setErrorMessage(
        error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng'
      );
    }
  };

  // Callbacks cho useVoiceControl
  const callbacks = {
    setUsername: (username) => {
      setCreateForm((prev) => {
        const newForm = { ...prev, username };
        console.log('Updated createForm (username):', newForm);
        return newForm;
      });
    },
    setPassword: (password) => {
      setCreateForm((prev) => {
        const newForm = { ...prev, password };
        console.log('Updated createForm (password):', newForm);
        return newForm;
      });
    },
    submitLogin: (voiceData) => handleSubmit(null, voiceData),
    navigateToForgotPassword: () => {
      speak('Đang chuyển đến trang thay đổi mật khẩu.');
      navigate('/forgot-password');
    },
  };

  // Sử dụng useVoiceControl
  const { speak } = useVoiceControl({
    callbacks,
  });

  // Phản hồi giọng nói khi có thông báo
  useEffect(() => {
    if (errorMessage) {
      speak(errorMessage);
    }
  }, [errorMessage, speak]);

  return (
    <div className="login-body">
      <div className="body-overlay"></div>
      <Link to="/" className="back-button">
        Quay lại trang chủ
      </Link>
      <div className="login-container">
        <h2>Đăng Nhập</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            name="username"
            value={createForm.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            name="password"
            value={createForm.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Đăng Nhập</button>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <p className="sign-up-text">
          Chưa có tài khoản? <a href="/register">Đăng ký ngay!</a>
        </p>
        <p className="forgot-password-text">
          <a href="/forgot-password">Quên mật khẩu?</a>
        </p>
      </div>
    </div>
  );
}

export default Login;