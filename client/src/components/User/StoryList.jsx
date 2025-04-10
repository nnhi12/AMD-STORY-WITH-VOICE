import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from "../../env";

const StoryList = () => {
  const [stories, setStories] = useState([]);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchStories = async () => {
      if (!userId) {
        console.error('No userId found. Please log in.');
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/recommend/${userId}`);
        console.log('API response:', response.data); // Debug dữ liệu trả về
        setStories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching stories:', error);
        setStories([]); // Đặt lại thành mảng rỗng nếu lỗi
      }
    };

    fetchStories();
  }, [userId]);

  return (
    <div>
      <h1>Danh sách truyện gợi ý</h1>
      {Array.isArray(stories) && stories.length > 0 ? (
        stories.map((story) => (
          <div key={story._id}>{story.name}</div> // Thay title bằng name theo schema
        ))
      ) : (
        <p>Không có truyện nào để hiển thị.</p>
      )}
    </div>
  );
};

export default StoryList;