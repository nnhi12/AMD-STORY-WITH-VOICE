import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Book from './bookinlib';

const ListReading = ({ userId, showChapters }) => {
  const [books, setBooks] = useState([]);
  const [progressList, setProgressList] = useState([]); // Thêm state cho progressList

  useEffect(() => {
    if (userId) {
      // Lấy danh sách truyện
      axios.get(`http://localhost:3001/users/${userId}/readingstories`)
        .then(response => {
          setBooks(response.data);
        })
        .catch(error => {
          console.error('Error fetching books:', error);
        });

      // Lấy danh sách progress
      axios.get(`http://localhost:3001/users/${userId}/get-reading-progress`)
        .then(response => {
          setProgressList(response.data); // Lưu danh sách progress vào state
        })
        .catch(error => {
          console.error('Error fetching progress:', error);
        });
    }
  }, [userId]);

  const handleBookRemoved = (removedBookId) => {
    setBooks(books.filter(book => book._id !== removedBookId));
  };

  return (
    <div className="container my-5">
      <div className="row row-cols-4">
        {books.length > 0 ? books.map((book, index) => (
          <Book 
            key={index} 
            data={book}
            userId={userId} 
            showChapters={showChapters} 
            onBookRemoved={handleBookRemoved} 
            progressList={progressList} // Truyền progressList xuống component Book
          />
        )) : (
          <p>No reading stories found.</p>
        )}
      </div>
    </div>
  );
};

export default ListReading;
