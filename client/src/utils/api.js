import axios from 'axios';

// Định nghĩa base URL của API
const BASE_URL = 'http://localhost:5005';

// Hàm gọi API để lấy danh sách truyện gợi ý
export const getRecommendedStories = async (storyId) => {
  try {
    // Gọi API với storyId (nếu có), nếu không thì gọi API mặc định
    const response = await axios.get(`${BASE_URL}/api`, {
      params: storyId ? { story_id: storyId } : {},
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    return response.data; // Trả về dữ liệu từ API
  } catch (error) {
    console.error('Error calling recommendation API:', error);
    throw error;
  }
};