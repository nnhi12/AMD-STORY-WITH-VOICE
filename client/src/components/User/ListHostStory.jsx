import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Book from './Book';
import { API_URL } from "../../env.js";

const ListHost = ({ showChapters }) => {
    const [books, setBooks] = useState([]);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        console.log('ListHost - userID:', storedUserId);
        setUserId(storedUserId);
    }, []);

    useEffect(() => {
        if (!userId) {
            console.log('No userID, skipping API call');
            setError('Vui lòng đăng nhập để xem danh sách truyện nổi bật.');
            setBooks([]);
            return;
        }

        // Xây dựng URL API với userID
        const apiUrl = `${API_URL}/stories?userID=${userId}`;
        console.log('Calling API:', apiUrl);

        // Fetch data from the API
        axios.get(apiUrl)
            .then(response => {
                console.log('Fetched books:', response.data);
                // Sort by views in descending order and take only the top 15
                const sortedBooks = response.data
                    .sort((a, b) => b.view - a.view)
                    .slice(0, 15);
                setBooks(sortedBooks);
                setError(null);
            })
            .catch(error => {
                console.error('Error fetching books:', error);
                setError(
                    error.response?.status === 401
                        ? 'Vui lòng đăng nhập để xem truyện.'
                        : error.response?.status === 404
                        ? 'Không tìm thấy người dùng.'
                        : 'Không thể tải danh sách truyện. Vui lòng thử lại sau.'
                );
                setBooks([]);
            });
    }, [userId]);

    return (
        <div className="container my-5">
            {error && <div className="alert alert-danger">{error}</div>}
            {books.length === 0 && !error && (
                <div className="alert alert-info">
                    Không có truyện nổi bật phù hợp với độ tuổi của bạn.
                </div>
            )}
            <div className="row row-cols-4">
                {books.map((book, index) => (
                    <Book 
                        key={index} 
                        data={book} 
                        userId={userId} 
                        showChapters={showChapters} 
                        disabled={book.disabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default ListHost;