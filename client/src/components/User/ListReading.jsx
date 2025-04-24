import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Book from './Book';
import { useLocation } from 'react-router-dom';
import { API_URL } from "../../env.js";

const ListReading = ({ showChapters }) => {
    const [books, setBooks] = useState([]);
    const [error, setError] = useState(null);
    const location = useLocation();
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        console.log('Stored userID:', storedUserId);
        setUserId(storedUserId);
    }, []);

    const apiUrl = useMemo(() => {
        const queryParams = new URLSearchParams(location.search);
        const minChapters = queryParams.get('minChapters');
        const maxChapters = queryParams.get('maxChapters');

        let url = `${API_URL}/stories`;
        const queryParts = [];
        if (minChapters) queryParts.push(`minChapters=${minChapters}`);
        if (maxChapters) queryParts.push(`maxChapters=${maxChapters}`);
        if (userId) queryParts.push(`userID=${userId}`);
        if (queryParts.length > 0) {
            url += `?${queryParts.join('&')}`;
        }
        return url;
    }, [location, userId]);

    useEffect(() => {
        if (!userId) {
            console.log('No userID, skipping API call');
            setError('Vui lòng đăng nhập để xem danh sách truyện phù hợp.');
            setBooks([]);
            return;
        }

        console.log('Calling API:', apiUrl);
        axios.get(apiUrl)
            .then(response => {
                console.log('Fetched books:', response.data);
                setBooks(response.data);
                setError(null);
            })
            .catch(error => {
                console.error('Error fetching books:', error);
                setError('Không thể tải danh sách truyện. Vui lòng thử lại sau.');
                setBooks([]);
            });
    }, [apiUrl, userId]);

    return (
        <div className="container my-5">
            {error && <div className="alert alert-danger">{error}</div>}
            {books.length === 0 && !error && (
                <div className="alert alert-info">Không có truyện phù hợp để hiển thị.</div>
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

export default ListReading;