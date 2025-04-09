import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StoryList.css';
const StoryList = ({ userId }) => {
    const [stories, setStories] = useState([]);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await axios.get(`/recommend/${userId}`);
                setStories(response.data);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu truyện:', error);
            }
        };

        fetchStories();
    }, [userId]);

    return (
        <div>
            <h2>Các bộ truyện được gợi ý</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <div className="story-list">
                    {stories.map(story => (
                        <div className="story-item" key={story._id}>
                            <img src={`data:image/jpeg;base64,${Buffer.from(story.image).toString('base64')}`} alt={story.name} />
                            <h3>{story.name}</h3>
                            <p>{story.description}</p>
                        </div>
                    ))}
                </div>
            </ul>
        </div>
    );
};

export default StoryList;