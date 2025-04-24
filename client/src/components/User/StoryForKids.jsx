import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './StoryList.css';
import { API_URL } from '../../env';
import Header from '../../layouts/header/User/header.jsx';
import Footer from '../../layouts/footer/User/footer.jsx';
import Navbar from '../../components/User/navbar.jsx';

import useVoiceControl from '../../utils/voiceControl.js';
const StoryForKids = () => {
  const [stories, setStories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await axios.get(`${API_URL}/statistical/for-kids`);
        setStories(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy truyện cho trẻ em:', error);
        if (error.response?.status === 404) {
          setError('Không tìm thấy truyện phù hợp.');
        } else {
          setError('Đã xảy ra lỗi khi lấy truyện.');
        }
      }
    };

    fetchStories();
  }, []);

  useVoiceControl("", "", "");
  
  return (
    <div className="page-container">
      <Header />
      <Navbar />
      <main className="main-content">
        <div className="story-list">
          <h2>5 truyện top hay nhất cho thiếu nhi</h2>
          {error ? (
            <p className="error">{error}</p>
          ) : stories.length === 0 ? (
            <p>Không có truyện nào phù hợp.</p>
          ) : (
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StoryForKids;