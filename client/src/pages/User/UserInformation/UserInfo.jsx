import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './UserInfo.css';
import { API_URL } from '../../../env.js';
import useVoiceControl from '../../../utils/voiceControl.js';

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
  const [categories, setCategories] = useState([]);
  const [accountStatus, setAccountStatus] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const userInfoRef = useRef(userInfo);
  const isEditingRef = useRef(isEditing);

  const accountId = localStorage.getItem('accountId');

  useEffect(() => {
    userInfoRef.current = userInfo;
    isEditingRef.current = isEditing;
    console.log('Cập nhật userInfoRef:', userInfoRef.current);
    console.log('Cập nhật isEditingRef:', isEditingRef.current);
  }, [userInfo, isEditing]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/userinfo/${accountId}`);
        setUserInfo({
          ...response.data,
          preferred_categories: response.data.preferred_categories || [],
        });
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
      } finally {
        setLoadingUserInfo(false);
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
        const response = await axios.get(`${API_URL}/account-status?accountId=${accountId}`);
        setAccountStatus(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái tài khoản:', error);
      }
    };

    fetchUserInfo();
    fetchCategories();
    fetchAccountStatus();
  }, [accountId]);

  const handleEdit = () => {
    setIsEditing(true);
    console.log('Chuyển sang chế độ chỉnh sửa, isEditing:', true);
  };

  const handleSave = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      console.log('Trạng thái isEditingRef:', isEditingRef.current);
      console.log('Trạng thái userInfoRef trước khi gửi:', userInfoRef.current);

      // Kiểm tra dữ liệu trước khi gửi
      if (
        !userInfoRef.current.fullname &&
        !userInfoRef.current.email &&
        !userInfoRef.current.age &&
        !userInfoRef.current.gender &&
        !userInfoRef.current.preferred_categories.length &&
        !file
      ) {
        console.warn('Không có thông tin nào để lưu.');
        setIsEditing(false);
        return;
      }

      // Đảm bảo preferred_categories là mảng các chuỗi
      const preferredCategories = Array.isArray(userInfoRef.current.preferred_categories)
        ? userInfoRef.current.preferred_categories.filter((id) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
        : [];

      const formData = new FormData();
      formData.append('fullname', userInfoRef.current.fullname || '');
      formData.append('email', userInfoRef.current.email || '');
      formData.append('age', userInfoRef.current.age || '');
      formData.append('gender', userInfoRef.current.gender || 'other');
      formData.append('preferred_categories', JSON.stringify(preferredCategories));
      if (file) {
        formData.append('image', file);
      }

      console.log('Dữ liệu FormData gửi đi:', Object.fromEntries(formData));

      const response = await axios.put(`${API_URL}/userinfo/${accountId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Phản hồi từ server:', response.data);

      setIsEditing(false);
      setFile(null);
      // Chuyển image thành chuỗi base64 nếu là Buffer
      const updatedUserInfo = {
        ...response.data.data,
        preferred_categories: response.data.data.preferred_categories || [],
        image: response.data.data.image
          ? typeof response.data.data.image === 'string'
            ? response.data.data.image
            : `data:image/jpeg;base64,${Buffer.from(response.data.data.image).toString('base64')}`
          : null,
      };
      setUserInfo(updatedUserInfo);
      window.location.reload(); // Tải lại trang thay vì alert
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin người dùng:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prevUserInfo) => {
      const updatedUserInfo = { ...prevUserInfo, [name]: value };
      console.log('Updating:', name, value, 'Updated userInfo:', updatedUserInfo);
      return updatedUserInfo;
    });
  };

  const handleCategoryChange = (e) => {
    let selectedOptions;
    if (e.target.value) {
      selectedOptions = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
    } else {
      selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    }
    setUserInfo((prevUserInfo) => {
      const updatedUserInfo = { ...prevUserInfo, preferred_categories: selectedOptions };
      console.log('Cập nhật preferred_categories:', selectedOptions);
      return updatedUserInfo;
    });
  };

  const voiceControlCallbacks = {
    setIsEditing,
    handleChange,
    handleCategoryChange,
    handleSave,
    userInfo: userInfoRef,
    isEditing: isEditingRef,
  };

  useVoiceControl({
    callbacks: voiceControlCallbacks,
    userId: accountId,
    chapters: [],
    storyId: null,
    chapterData: null,
    currentParagraphIndex: 0,
    nextId: null,
    previousId: null,
    commentText: '',
    chapterId: null,
    setAge: (age) => setUserInfo((prev) => ({ ...prev, age })),
    fetchStories: () => {},
    setStories: () => {},
    loadingUserInfo,
  });

  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return 'Chưa chọn thể loại';
    return categoryIds
      .map((id) => {
        const category = categories.find((cat) => cat._id === id);
        return category ? category.name : 'Unknown';
      })
      .join(', ');
  };

  if (loadingUserInfo) {
    return <div>Đang tải thông tin người dùng...</div>;
  }

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
            {userInfo.image && typeof userInfo.image === 'string' && (
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