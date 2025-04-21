import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Book from './Book';
import { API_URL } from "../../env.js";

const ListReading = ({ showChapters }) => {
  const { categoryId } = useParams();
  const [stories, setStories] = useState([]);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    console.log('ListReading (Category) - userID:', storedUserId);
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) {
      console.log('No userID, skipping API call');
      setError('Vui lòng đăng nhập để xem danh sách truyện.');
      setStories([]);
      return;
    }

    // Xây dựng URL API với userID
    const apiUrl = `${API_URL}/categories/${categoryId}/stories?userID=${userId}`;
    console.log('Calling API:', apiUrl);

    axios.get(apiUrl)
      .then(response => {
        console.log('Fetched stories for category:', response.data);
        setStories(response.data);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching stories for category:', error);
        setError(
          error.response?.status === 401
            ? 'Vui lòng đăng nhập để xem truyện.'
            : error.response?.status === 404
            ? 'Không tìm thấy người dùng hoặc thể loại.'
            : 'Không thể tải danh sách truyện. Vui lòng thử lại sau.'
        );
        setStories([]);
      });
  }, [categoryId, userId]);

  return (
    <div className="container my-5">
      {error && <div className="alert alert-danger">{error}</div>}
      {stories.length === 0 && !error && (
        <div className="alert alert-info">
          Không có truyện phù hợp với thể loại và độ tuổi của bạn.
        </div>
      )}
      <div className="row row-cols-4">
        {stories.map((story, index) => (
          <Book 
            key={index} 
            data={story} 
            userId={userId} 
            showChapters={showChapters} 
            disabled={story.disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default ListReading;