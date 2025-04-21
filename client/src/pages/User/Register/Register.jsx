import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Register.css';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../env.js';
import useVoiceControl from '../../../utils/voiceControl.js';

function Register() {
  const navigate = useNavigate();
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
    age: '',
    gender: 'other',
    preferredCategories: [], // Thêm preferredCategories
  });
  const [categories, setCategories] = useState([]); // Danh sách thể loại
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Lấy danh sách thể loại khi component được mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
        setLoadingCategories(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setMessage('Failed to load categories. Please try again.');
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setCreateForm((prevForm) => ({
      ...prevForm,
      preferredCategories: selectedOptions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra nếu có trường nào bỏ trống
    if (!createForm.username || !createForm.email || !createForm.password || !createForm.confirmPassword || !createForm.age) {
      setMessage('Please fill in all required fields.');
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (createForm.password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    // Kiểm tra confirm password
    if (createForm.password !== createForm.confirmPassword) {
      setMessage('Passwords do not match. Please try again.');
      return;
    }

    // Kiểm tra age là số hợp lệ
    if (isNaN(createForm.age) || createForm.age < 0) {
      setMessage('Please enter a valid age.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/register`, {
        username: createForm.username,
        password: createForm.password,
        email: createForm.email,
        age: parseInt(createForm.age),
        gender: createForm.gender,
        preferred_categories: createForm.preferredCategories, // Gửi danh sách thể loại
      });

      console.log('Account created:', response.data);
      setMessage('Registration successful! Redirecting to login page...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error registering account:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Registration failed. Please try again.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState);
  };

  useVoiceControl('', '', '');

  return (
    <div className="body-regis">
      <div className="signup-container">
        <h1 className="regis-title">SIGN UP</h1>
        <div className="regis-content-wrapper">
          <div className="regis-image-section">
            <img
              src="https://i.pinimg.com/564x/60/ef/37/60ef37f755820ed91b2f57e26e148c05.jpg"
              alt="Sign Up Illustration"
            />
          </div>
          <div className="regis-form-section">
            <form onSubmit={handleSubmit}>
              <div className="regis-form-group">
                <label>USER NAME</label>
                <input
                  type="text"
                  name="username"
                  value={createForm.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="regis-form-group">
                <label>EMAIL</label>
                <input
                  type="email"
                  name="email"
                  value={createForm.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="regis-form-group">
                <label>AGE</label>
                <input
                  type="number"
                  name="age"
                  value={createForm.age}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
              <div className="regis-form-group">
                <label>GENDER</label>
                <select
                  name="gender"
                  value={createForm.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="regis-form-group">
                <label>PREFERRED CATEGORIES</label>
                {loadingCategories ? (
                  <p>Loading categories...</p>
                ) : (
                  <select
                    name="preferredCategories"
                    multiple
                    value={createForm.preferredCategories}
                    onChange={handleCategoryChange}
                    className="category-select"
                  >
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="regis-form-group">
                <label>PASSWORD</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={createForm.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-btn"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {createForm.password.length > 0 && createForm.password.length < 8 && (
                  <div className="password-length-warning">
                    Password must be at least 8 characters.
                  </div>
                )}
              </div>
              <div className="regis-form-group">
                <label>CONFIRM PASSWORD</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={createForm.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="password-toggle-btn"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {createForm.password === createForm.confirmPassword && createForm.confirmPassword !== '' && (
                  <div className="password-match-check">
                    <span className="checkmark">✔</span> Passwords match!
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="register-button"
                disabled={createForm.password.length < 8}
              >
                REGISTER
              </button>
            </form>
            {message && <p className="register-message">{message}</p>}
            <p className="login-text">
              Already have an account? <a href="/login">Login now!</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;