import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserInfo.css';
import { API_URL } from "../../../env.js";

function UserInfo() {
    const [userInfo, setUserInfo] = useState({
        username: "",
        password: "",
        email: "",
        gender: "other", // Mặc định là 'other'
        fullname: "",
        age: "",
        image: null,
    });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const accountId = localStorage.getItem("accountId");
                const response = await axios.get(`${API_URL}/userinfo/${accountId}`);
                setUserInfo(response.data);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin người dùng:", error);
            }
        };

        fetchUserInfo();
    }, []);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const accountId = localStorage.getItem("accountId");
            const formData = new FormData();
            formData.append("fullname", userInfo.fullname);
            formData.append("email", userInfo.email);
            formData.append("password", userInfo.password);
            formData.append("age", userInfo.age);
            formData.append("gender", userInfo.gender); // Gửi gender
            if (file) {
                formData.append("image", file);
            }

            await axios.put(`${API_URL}/userinfo/${accountId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin người dùng:", error);
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
                                src={userInfo.image.startsWith("data:image/") ? userInfo.image : `data:image/jpeg;base64,${userInfo.image}`}
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
                            value={userInfo.fullname}
                            onChange={handleChange}
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="profile-form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={userInfo.email}
                            onChange={handleChange}
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="profile-form-group">
                        <label>Mật khẩu</label>
                        <div className="profile-password-wrapper">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                name="password"
                                value={userInfo.password}
                                onChange={handleChange}
                                readOnly={!isEditing}
                            />
                            <button
                                type="button"
                                className="profile-toggle-password"
                                onClick={togglePasswordVisibility}
                            >
                                👁️
                            </button>
                        </div>
                    </div>
                    <div className="profile-form-group">
                        <label>Tuổi</label>
                        <input
                            type="number"
                            name="age"
                            value={userInfo.age || ""}
                            onChange={handleChange}
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="profile-form-group">
                        <label>Giới tính</label>
                        <select
                            name="gender"
                            value={userInfo.gender || "other"}
                            onChange={handleChange}
                            disabled={!isEditing}
                        >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>
                    <div className="profile-button-group">
                        {isEditing ? (
                            <button className="profile-save-button" onClick={handleSave}>Save</button>
                        ) : (
                            <button className="profile-edit-button" onClick={handleEdit}>Edit</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserInfo;