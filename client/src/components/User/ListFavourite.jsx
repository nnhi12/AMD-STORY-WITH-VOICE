import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Book from './bookfav';

const ListFavourite = ({ userId, showChapters }) => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    if (userId) {
      axios.get(`http://localhost:3001/users/${userId}/followingstories`)
        .then(response => {
          setBooks(response.data);
        })
        .catch(error => {
          console.error('Error fetching books:', error);
        });
    }
  }, [userId]);

  // Hàm callback để cập nhật lại danh sách khi xóa truyện
  const handleBookRemoved = (removedBookId) => {
    setBooks(books.filter(book => book._id !== removedBookId));
  };

  return (
    <div className="container my-5">
      <h2>Followed Stories</h2>
      <div className="row row-cols-4">
        {books.length > 0 ? books.map((book, index) => (
          <Book 
            key={index} 
            data={book} 
            userId={userId} 
            showChapters={showChapters} 
            onBookRemoved={handleBookRemoved} // Truyền hàm callback vào component Book
          />
        )) : (
          <p>No followed stories found.</p>
        )}
      </div>
    </div>
  );
};


export default ListFavourite;
