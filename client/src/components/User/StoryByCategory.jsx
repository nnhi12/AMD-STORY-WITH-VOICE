import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './StoryList.css';
import { API_URL } from '../../env';
import Header from '../../layouts/header/User/header.jsx';
import Footer from '../../layouts/footer/User/footer.jsx';
import Navbar from '../../components/User/navbar.jsx';

const StoryByCategory = () => {
  const [stories, setStories] = useState([]);
  const [categoryName, setCategoryName] = useState(''); // Thêm trạng thái để lưu tên danh mục
  const [error, setError] = useState(''); // Thêm trạng thái để hiển thị lỗi
  const { category } = useParams(); // Lấy categoryId từ URL

  useEffect(() => {
    const fetchCategoryAndStories = async () => {
      try {
        // Lấy thông tin danh mục
        const categoryResponse = await axios.get(`${API_URL}/recommend/category/${category}`);
        setCategoryName(categoryResponse.data.name);

        // Lấy truyện theo danh mục
        const storiesResponse = await axios.get(`${API_URL}/recommend/by-category/${category}`);
        setStories(storiesResponse.data);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        if (error.response?.status === 404) {
          setError('Không tìm thấy danh mục hoặc không có truyện phù hợp.');
        } else {
          setError('Đã xảy ra lỗi khi lấy dữ liệu.');
        }
      }
    };

    fetchCategoryAndStories();
  }, [category]);

  return (
    <div className="page-container">
      <Header />
      <Navbar />
      <main className="main-content">
        <div className="story-list">
          <h2>Top 5 truyện hay nhất thể loại: {categoryName || 'Đang tải...'}</h2>
          {error ? (
            <p className="error">{error}</p>
          ) : stories.length === 0 ? (
            <p>Không có truyện nào trong danh mục này.</p>
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

export default StoryByCategory;