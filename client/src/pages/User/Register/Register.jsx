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
    preferredCategories: [],
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Lấy danh sách thể loại và lưu vào localStorage
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        const categoriesData = response.data;
        setCategories(categoriesData);
        // Lưu categories vào localStorage
        localStorage.setItem('categories', JSON.stringify(categoriesData));
        console.log('Đã lưu categories vào localStorage:', categoriesData);
        setLoadingCategories(false);
      } catch (error) {
        console.error('Lỗi khi lấy categories:', error);
        setMessage('Không thể tải danh sách thể loại.');
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
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    setCreateForm((prevForm) => {
      const newForm = { ...prevForm, preferredCategories: selectedOptions };
      console.log('Updated createForm (category change):', newForm);
      return newForm;
    });
  };

  const handleSubmit = async (e, voiceData = null) => {
    if (e) e.preventDefault();
    const formData = voiceData || createForm;
    console.log('Submitting formData:', formData);

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.age) {
      setMessage('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    if (isNaN(formData.age) || formData.age < 0) {
      setMessage('Vui lòng nhập tuổi hợp lệ.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/register`, {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        age: parseInt(formData.age),
        gender: formData.gender,
        preferred_categories: formData.preferredCategories,
      });

      console.log('Account created:', response.data);
      setMessage('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      setMessage(
        error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState);
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
        const newForm = { ...prev, password, confirmPassword: password };
        console.log('Updated createForm (password):', newForm);
        return newForm;
      });
    },
    setEmail: (email) => {
      setCreateForm((prev) => {
        const newForm = { ...prev, email };
        console.log('Updated createForm (email):', newForm);
        return newForm;
      });
    },
    setAge: (age) => {
      setCreateForm((prev) => {
        const newForm = { ...prev, age };
        console.log('Updated createForm (age):', newForm);
        return newForm;
      });
    },
    setGender: (gender) => {
      setCreateForm((prev) => {
        const newForm = { ...prev, gender };
        console.log('Updated createForm (gender):', newForm);
        return newForm;
      });
    },
    addCategory: (categoryId) => {
      setCreateForm((prev) => {
        const newCategories = prev.preferredCategories.includes(categoryId)
          ? prev.preferredCategories
          : [...prev.preferredCategories, categoryId];
        const newForm = { ...prev, preferredCategories: newCategories };
        console.log('Updated createForm (addCategory):', newForm);
        return newForm;
      });
    },
    removeCategory: (categoryId) => {
      setCreateForm((prev) => {
        const newCategories = prev.preferredCategories.filter((id) => id !== categoryId);
        const newForm = { ...prev, preferredCategories: newCategories };
        console.log('Updated createForm (removeCategory):', newForm);
        return newForm;
      });
    },
    submitRegister: (voiceData) => handleSubmit(null, voiceData),
  };

  // Gọi useVoiceControl (không cần truyền categories)
  const { speak } = useVoiceControl({
    callbacks,
  });

  // Phản hồi giọng nói khi có thông báo
  useEffect(() => {
    if (message && speak) {
      speak(message);
    }
  }, [message, speak]);

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
                {createForm.password === createForm.confirmPassword &&
                  createForm.confirmPassword !== '' && (
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