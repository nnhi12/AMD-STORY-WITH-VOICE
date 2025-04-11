import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './StoryList.css';
import { API_URL } from '../../env';

import Header from '../../layouts/header/User/header.jsx';
import Footer from '../../layouts/footer/User/footer.jsx';
import Navbar from '../../components/User/navbar.jsx';

const StoryByAge = () => {
    const [stories, setStories] = useState([]);
    const userId = localStorage.getItem('userId'); // Lấy userId từ localStorage

    useEffect(() => {
        const fetchStories = async () => {
            if (!userId) {
                console.error('No userId found. Please log in.');
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/recommend/by-age/${userId}`);
                setStories(response.data);
            } catch (error) {
                console.error('Error fetching stories by age:', error);
            }
        };

        fetchStories();
    }, [userId]);

    return (
        <div className="page-container">
            <Header />
            <Navbar />
            <main className="main-content">
                <div className="story-list">
                    <h2>Truyện phù hợp với độ tuổi</h2>
                    {stories.length === 0 ? (
                        <p>Không có truyện nào phù hợp.</p>
                    ) : (
                        <div className="story-grid">
                            {stories.map(story => (
                                <Link to={`/storyinfo/${story._id}`} key={story._id} className="story-item">
                                    <div className="story-image-wrapper">
                                        {story.image ? (
                                            <img
                                                src={`data:image/jpeg;base64,${story.image}`}
                                                alt={story.name}
                                            />
                                        ) : (
                                            <div className="no-image">Không có hình ảnh</div>
                                        )}
                                    </div>
                                    <div className="story-info">
                                        <h3>{story.name}</h3>
                                        <p>{story.description || 'Không có mô tả'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default StoryByAge;