import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserInfo.css';
import { API_URL } from '../../../env.js';

function UserInfo() {
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    gender: 'other',
    fullname: '',
    age: '',
    image: null,
    preferred_categories: [],
  });
  const [categories, setCategories] = useState([]); // Danh sách tất cả thể loại
  const [accountStatus, setAccountStatus] = useState(null); // Trạng thái tài khoản và đăng ký
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);

  // Lấy thông tin người dùng, thể loại, và trạng thái tài khoản
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const accountId = localStorage.getItem('accountId');
        const response = await axios.get(`${API_URL}/userinfo/${accountId}`);
        setUserInfo({
          ...response.data,
          preferred_categories: response.data.preferred_categories || [],
        });
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
        setLoadingCategories(false);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thể loại:', error);
        setLoadingCategories(false);
      }
    };

    const fetchAccountStatus = async () => {
      try {
        const accountId = localStorage.getItem('accountId');
        const response = await axios.get(`${API_URL}/account-status?accountId=${accountId}`);
        setAccountStatus(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái tài khoản:', error);
      }
    };

    fetchUserInfo();
    fetchCategories();
    fetchAccountStatus();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const accountId = localStorage.getItem('accountId');
      const formData = new FormData();
      formData.append('fullname', userInfo.fullname);
      formData.append('email', userInfo.email);
      formData.append('age', userInfo.age);
      formData.append('gender', userInfo.gender);
      formData.append('preferred_categories', JSON.stringify(userInfo.preferred_categories));
      if (file) {
        formData.append('image', file);
      }

      await axios.put(`${API_URL}/userinfo/${accountId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsEditing(false);
      setFile(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin người dùng:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({ ...userInfo, image: reader.result });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    setUserInfo({ ...userInfo, preferred_categories: selectedOptions });
  };

  // Hàm lấy tên thể loại từ ID
  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return 'Chưa chọn thể loại';
    return categoryIds
      .map((id) => {
        const category = categories.find((cat) => cat._id === id);
        return category ? category.name : 'Unknown';
      })
      .join(', ');
  };

  return (
    <div className="profile-container">
      <div className="row">
        <div className="col-6">
          <div className="profile-img">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={!isEditing}
              style={{ marginTop: '10px' }}
            />
            {userInfo.image && (
              <img
                src={
                  userInfo.image.startsWith('data:image/')
                    ? userInfo.image
                    : `data:image/jpeg;base64,${userInfo.image}`
                }
                alt="profile"
              />
            )}
          </div>
          <p className="profile-username">{userInfo.username}</p>
        </div>
        <div className="col-6">
          <div className="profile-form-group">
            <label>Họ và Tên</label>
            <input
              type="text"
              name="fullname"
              value={userInfo.fullname || ''}
              onChange={handleChange}
              readOnly={!isEditing}
            />
          </div>
          <div className="profile-form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={userInfo.email || ''}
              onChange={handleChange}
              readOnly={!isEditing}
            />
          </div>
          <div className="profile-form-group">
            <label>Tuổi</label>
            <input
              type="number"
              name="age"
              value={userInfo.age || ''}
              onChange={handleChange}
              readOnly={!isEditing}
            />
          </div>
          <div className="profile-form-group">
            <label>Giới tính</label>
            <select
              name="gender"
              value={userInfo.gender || 'other'}
              onChange={handleChange}
              disabled={!isEditing}
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div className="profile-form-group">
            <label>Thể loại yêu thích</label>
            {isEditing ? (
              loadingCategories ? (
                <p>Đang tải thể loại...</p>
              ) : (
                <select
                  multiple
                  name="preferred_categories"
                  value={userInfo.preferred_categories}
                  onChange={handleCategoryChange}
                  className="category-select"
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <p>{getCategoryNames(userInfo.preferred_categories)}</p>
            )}
          </div>
          <div className="profile-form-group">
            <label>Trạng thái tài khoản</label>
            <p>
              {accountStatus
                ? accountStatus.status
                  ? 'Kích hoạt'
                  : 'Chưa kích hoạt'
                : 'Đang tải...'}
            </p>
            {accountStatus?.subscription?.isActive ? (
              <p>
                Đăng ký VIP: Từ{' '}
                {new Date(accountStatus.subscription.startDate).toLocaleDateString()} đến{' '}
                {new Date(accountStatus.subscription.endDate).toLocaleDateString()}
              </p>
            ) : (
              <p>Không có đăng ký VIP hoạt động.</p>
            )}
          </div>
          <div className="profile-button-group">
            {isEditing ? (
              <button className="profile-save-button" onClick={handleSave}>
                Save
              </button>
            ) : (
              <button className="profile-edit-button" onClick={handleEdit}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserInfo;