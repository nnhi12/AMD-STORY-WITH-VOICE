import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../../../env.js";
import useVoiceControl from '../../../utils/voiceControl.js';

function Register() {
  const navigate = useNavigate();
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    email: "",
    confirmPassword: "",
    age: "", // Thêm age
    gender: "other" // Mặc định là 'other'
  });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra nếu có trường nào bỏ trống
    if (!createForm.username || !createForm.email || !createForm.password || !createForm.confirmPassword || !createForm.age) {
      setMessage("Please fill in all fields.");
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (createForm.password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    // Kiểm tra confirm password
    if (createForm.password !== createForm.confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    // Kiểm tra age là số hợp lệ
    if (isNaN(createForm.age) || createForm.age < 0) {
      setMessage("Please enter a valid age.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/register`, {
        username: createForm.username,
        password: createForm.password,
        email: createForm.email,
        age: parseInt(createForm.age), // Chuyển age thành số nguyên
        gender: createForm.gender,
      });

      console.log("Account created:", response.data);
      setMessage("Registration successful! Redirecting to login page...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error registering account:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Registration failed. Please try again.");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prevState => !prevState);
  };

  useVoiceControl("", "", "");

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
                <label>PASSWORD</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
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
                    {showPassword ? "Hide" : "Show"}
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
                    type={showConfirmPassword ? "text" : "password"}
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
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {createForm.password === createForm.confirmPassword && createForm.confirmPassword !== "" && (
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