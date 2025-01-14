import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Book from './book';
import { useLocation } from 'react-router-dom';

const ListReading = ({ showChapters }) => {
    const [books, setBooks] = useState([]);
    const location = useLocation();
    const [userId, setUserId] = useState(null);
    useEffect(() => {
        const storedUserId = localStorage.getItem("accountId");
        setUserId(storedUserId);
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const minChapters = queryParams.get('minChapters');
        const maxChapters = queryParams.get('maxChapters');
        // Sử dụng axios để fetch dữ liệu từ API
        let apiUrl = "http://localhost:3001/stories";
        if (minChapters || maxChapters) {
            apiUrl += `?minChapters=${minChapters || ''}&maxChapters=${maxChapters || ''}`;
        }

        // Gửi yêu cầu tới API
        axios.get(apiUrl)
            .then(response => {
                console.log('Fetched books:', response.data);
                setBooks(response.data);
            })
            .catch(error => {
                console.error('Error fetching books:', error);
            });
    }, [location]);

    return (
        <div className="container my-5">
            <div className="row row-cols-4">
                {books.map((book, index) => (
                    <Book key={index} data={book} userId = {userId} showChapters={showChapters} disabled = {book.disabled}/>
                ))}
            </div>
        </div>
    );
};

export default ListReading;
