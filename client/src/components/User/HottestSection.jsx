import React, { useEffect, useState } from 'react';
import './HottestSection.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../env.js";

const HottestSection = () => {
  const [hottestBooks, setHottestBooks] = useState([]);

  useEffect(() => {
    // Fetch data from the API
    axios.get(`${API_URL}/stories`)
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
      })
      .catch(error => {
        console.error('Error fetching books:', error);
      });
  }, []);

  return (
    <div className="hottest-section">
      <h2 className="hottest-title">HOTTEST!!!</h2>
      {hottestBooks.map((book, index) => (
        <div className="hottest-book-item" key={index}>
          {/* Kiểm tra ngày đóng và vô hiệu hóa truyện đã hết hạn */}
          <Link 
            to={`/storyinfo/${book._id}`} 
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
              className={`hot-book-title ${book.date_closed && new Date(book.date_closed) < new Date() ? 'disabled' : ''}`}
              style={{ pointerEvents: book.date_closed && new Date(book.date_closed) < new Date() ? 'none' : 'auto' }}
            >
              {book.name} {/* Show the title of the book */}
            </Link>
            <div className="hottest-book-views">{book.view} views</div> {/* Display the number of views */}
          </div>
          {book.date_closed && new Date(book.date_closed) < new Date() && (
            <div className="expired-message">This story is expired</div> // Hiển thị thông báo hết hạn
          )}
        </div>
      ))}
      <Link to="/tophot" className="see-more-btn">See more</Link>
    </div>
  );
};

export default HottestSection;
