import React, { useEffect, useState } from 'react';
import './ListGenre.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../../env.js";

const ListGenre = () => {
    const [genres, setGenres] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch categories from the API
        axios.get(`${API_URL}/categories`)
            .then(response => {
                setGenres(response.data); // Set categories from API response
            })
            .catch(error => {
                console.error("Error fetching genres:", error);
            });
    }, []);

    const handleGenreClick = (categoryId) => {
        navigate(`/classifiedbygenre/${categoryId}`); // Điều hướng đến trang ClassifiedByGenre
    };

    return (
        <div className="list-genre-section">
            <h2 className="list-genre-title">GENRE</h2>
            {genres.map((genre, index) => (
                <div
                    className="list-genre-book-item"
                    key={index}
                    onClick={() => handleGenreClick(genre._id)} // Truyền categoryId khi nhấn vào
                >
                    <div className="list-genre-book-info">
                        <div className="list-genre-book-title">{genre.name}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ListGenre;
