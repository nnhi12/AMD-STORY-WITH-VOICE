import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './StoryList.css';
import { API_URL } from '../../env';
import Header from '../../layouts/header/User/header.jsx';
import Footer from '../../layouts/footer/User/footer.jsx';
import Navbar from '../../components/User/navbar.jsx';

const StoryByAgeInput = () => {
  const [age, setAge] = useState(''); // Lưu tuổi người dùng nhập
  const [stories, setStories] = useState([]);
  const [error, setError] = useState('');

  const fetchStories = async () => {
    if (!age || isNaN(age) || age < 0) {
      setError('Vui lòng nhập tuổi hợp lệ (số không âm).');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/statistical/by-age`, {
        params: { age }
      });
      setStories(response.data);
      setError('');
    } catch (error) {
      console.error('Lỗi khi lấy truyện theo độ tuổi:', error);
      if (error.response?.status === 400) {
        setError('Tuổi không hợp lệ.');
      } else {
        setError('Đã xảy ra lỗi khi lấy truyện.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStories();
  };

  return (
    <div className="page-container">
      <Header />
      <Navbar />
      <main className="main-content">
        <div className="story-list">
          <h2>Gợi ý truyện theo độ tuổi</h2>
          <form onSubmit={handleSubmit} className="age-input-form">
            <label htmlFor="age">Nhập tuổi của bạn: </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="0"
              placeholder="Ví dụ: 10"
            />
            <button type="submit">Tìm truyện</button>
          </form>

          {error ? (
            <p className="error">{error}</p>
          ) : stories.length === 0 ? (
            age ? <p>Không có truyện nào phù hợp.</p> : null
          ) : (
            <>
              <h3>Gợi ý truyện cho người {age} tuổi</h3>
              <div className="story-grid">
                {stories.map(story => (
                  <Link to={`/storyinfo/${story._id}`} key={story._id} className="story-item">
                    <div className="story-image-wrapper">
                      {story.image ? (
                        <img
                          src={`data:image/jpeg;base64,${story.image}`}
                          alt={story.name}
                        />
                      ) : (
                        <div className="no-image">Không có hình ảnh</div>
                      )}
                    </div>
                    <div className="story-info">
                      <h3>{story.name}</h3>
                      <p>{story.description || 'Không có mô tả'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StoryByAgeInput;