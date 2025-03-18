import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Book from './book';
import { API_URL } from "../../env.js";

const ListHost = ({ showChapters }) => {
    const [books, setBooks] = useState([]);
    const [userId, setUserId] = useState(null);
    useEffect(() => {
        const storedUserId = localStorage.getItem("accountId");
        setUserId(storedUserId);
    }, []);

    useEffect(() => {
        // Fetch data from the API
        axios.get(`{API_URL}/stories`)
            .then(response => {
                console.log('Fetched books:', response.data);
                // Sort by views in descending order and take only the top 6
                const sortedBooks = response.data
                    .sort((a, b) => b.view - a.view)
                    .slice(0, 15);
                setBooks(sortedBooks);
            })
            .catch(error => {
                console.error('Error fetching books:', error);
            });
    }, []);

    return (
        <div className="container my-5">
            <div className="row row-cols-4">
                {books.map((book, index) => (
                    <Book key={index} data={book} userId = {userId} showChapters={showChapters}  disabled = {book.disabled}/>
                ))}
            </div>
        </div>
    );
};

export default ListHost;
