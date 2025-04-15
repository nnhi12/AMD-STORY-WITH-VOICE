import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendedStories } from '../../utils/api';
import './RecommendStories.css';
import useVoiceControl from '../../utils/voiceControl.js';

const RecommendedStories = ({ storyId }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const data = await getRecommendedStories(storyId);
        setStories(data.recommended_stories || []); // Sửa từ truyen_goi_y thành recommended_stories
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách truyện gợi ý');
        setLoading(false);
      }
    };

    fetchStories();
  }, [storyId]);

  
  useVoiceControl("", "", "");

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  
  return (
    <div className="recommended-stories">
      <h2>Bạn cũng nên thử đọc</h2>
      <ul>
        {stories.map((story, index) => (
          <li key={index}>
            <Link to={`/storyinfo/${story.id}`}>{story.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendedStories;