import React, { useEffect, useState } from 'react';
import './HottestSection.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../env.js";

const HottestSection = () => {
  const [hottestBooks, setHottestBooks] = useState([]);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    console.log('HottestSection - userID:', storedUserId);
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) {
      console.log('No userID, skipping API call');
      setError('Vui lòng đăng nhập để xem danh sách truyện nổi bật.');
      setHottestBooks([]);
      return;
    }

    // Xây dựng URL API với userID
    const apiUrl = `${API_URL}/stories?userID=${userId}`;
    console.log('Calling API:', apiUrl);

    // Fetch data from the API
    axios.get(apiUrl)
      .then(response => {
        console.log('Fetched books:', response.data);

        // Lọc những truyện còn mở (ngày đóng chưa đến)
        const currentDate = new Date();
        const filteredBooks = response.data.filter(book => {
          if (!book.date_closed) return true; // Truyện không có ngày đóng
          const endDate = new Date(book.date_closed);
          return endDate >= currentDate; // Nếu ngày đóng >= ngày hiện tại, truyện còn mở
        });

        // Sort by views in descending order and take only the top 5
        const sortedBooks = filteredBooks
          .sort((a, b) => b.view - a.view)
          .slice(0, 5); // Limit to top 5 books

        setHottestBooks(sortedBooks);
        setError(null);
      })
      .catch(error => {
        console.error('Error fetching books:', error);
        setError('Không thể tải danh sách truyện nổi bật. Vui lòng thử lại sau.');
        setHottestBooks([]);
      });
  }, [userId]);

  return (
    <div className="hottest-section">
      <h2 className="hottest-title">HOTTEST!!!</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {hottestBooks.length === 0 && !error && (
        <div className="alert alert-info">Không có truyện nổi bật phù hợp để hiển thị.</div>
      )}
      {hottestBooks.map((book, index) => (
        <div className="hottest-book-item" key={index}>
          {/* Kiểm tra ngày đóng và vô hiệu hóa truyện đã hết hạn */}
          <Link 
            to={`/storyinfo/${book._id}`} 
            state={{ userId }} // Truyền userId vào state
            className={`hot-book-title ${book.date_closed && new Date(book.date_closed) < new Date() ? 'disabled' : ''}`}
            style={{ pointerEvents: book.date_closed && new Date(book.date_closed) < new Date() ? 'none' : 'auto' }}
          >
            <img 
              src={book.image ? `data:image/jpeg;base64,${book.image}` : 'default-image.jpg'} 
              alt={book.name} 
              className="hot-book-image" 
            />
          </Link>
          <div className="hottest-book-info">
            <Link 
              to={`/storyinfo/${book._id}`} 
              state={{ userId }} // Truyền userId vào state
              className={`hot-book-title ${book.date_closed && new Date(book.date_closed) < new Date() ? 'disabled' : ''}`}
              style={{ pointerEvents: book.date_closed && new Date(book.date_closed) < new Date() ? 'none' : 'auto' }}
            >
              {book.name}
            </Link>
            <div className="hottest-book-views">{book.view} lượt xem</div>
          </div>
          {book.date_closed && new Date(book.date_closed) < new Date() && (
            <div className="expired-message">Truyện này đã hết hạn</div>
          )}
        </div>
      ))}
      <Link to="/tophot" state={{ userId }} className="see-more-btn">Xem thêm</Link>
    </div>
  );
};

export default HottestSection;