import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './StoryList.css';
import { API_URL } from '../../env.js';
import Header from '../../layouts/header/User/header.jsx';
import Footer from '../../layouts/footer/User/footer.jsx';
import Navbar from '../../components/User/navbar.jsx';
import useVoiceControl from '../../utils/voiceControl.js';

const StoryList = () => {
    const [recommendations, setRecommendations] = useState({
        contentBased: [],
        collaborative: [],
        hybrid: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecommendation, setSelectedRecommendation] = useState('all'); // Trạng thái cho combobox
    const userId = localStorage.getItem('userId');
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!userId) {
                setError('Vui lòng đăng nhập để xem gợi ý.');
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching recommendations for user:', userId, 'Refresh:', refresh);
                const [contentBasedResponse, collaborativeResponse, hybridResponse] = await Promise.all([
                    axios.get(`${API_URL}/recommend/content-based/${userId}?refresh=${refresh}`),
                    axios.get(`${API_URL}/recommend/collaborative/${userId}?refresh=${refresh}`),
                    axios.get(`${API_URL}/recommend/hybrid/${userId}?refresh=${refresh}`),
                ]);

                const newRecommendations = {
                    contentBased: contentBasedResponse.data,
                    collaborative: collaborativeResponse.data,
                    hybrid: hybridResponse.data,
                };
                console.log('Recommendations fetched:', {
                    contentBased: newRecommendations.contentBased.map(s => s._id),
                    collaborative: newRecommendations.collaborative.map(s => s._id),
                    hybrid: newRecommendations.hybrid.map(s => s._id),
                });
                setRecommendations(newRecommendations);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching recommendations:', err.response ? err.response.data : err.message);
                setError(
                    err.response?.status === 401
                        ? 'Vui lòng đăng nhập để xem gợi ý.'
                        : err.response?.status === 404
                        ? 'Không tìm thấy người dùng.'
                        : 'Không thể tải danh sách truyện gợi ý. Vui lòng thử lại sau.'
                );
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [userId, refresh]);

    useVoiceControl('', '', '');

    const handleRefresh = () => {
        setRefresh(true);
        setTimeout(() => setRefresh(false), 1000);
    };

    const handleRecommendationChange = (event) => {
        setSelectedRecommendation(event.target.value);
    };

    const renderStorySection = (stories, title) => (
        <div className="story-list">
            <h2 className="section-title">{title}</h2>
            {stories.length === 0 ? (
                <p>Không có truyện phù hợp với độ tuổi của bạn để hiển thị.</p>
            ) : (
                <div className="story-grid">
                    {stories.map(story => (
                        <Link 
                            to={`/storyinfo/${story._id}`} 
                            key={story._id} 
                            className="story-item"
                            state={{ userId }}
                        >
                            <div className="story-image-wrapper">
                                {story.image ? (
                                    <img
                                        src={`data:image/jpeg;base64,${story.image}`}
                                        alt={story.name}
                                        className="story-image"
                                    />
                                ) : (
                                    <div className="no-image">Không có hình ảnh</div>
                                )}
                            </div>
                            <div className="story-info">
                                <h3 className="story-title">{story.name}</h3>
                                <p className="story-description">{story.description || 'Không có mô tả'}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );

    const renderRecommendations = () => {
        if (selectedRecommendation === 'all') {
            return (
                <>
                    {renderStorySection(recommendations.contentBased, 'Gợi ý dựa trên nội dung')}
                    {renderStorySection(recommendations.collaborative, 'Gợi ý dựa trên người dùng tương tự')}
                    {renderStorySection(recommendations.hybrid, 'Gợi ý kết hợp')}
                </>
            );
        } else if (selectedRecommendation === 'contentBased') {
            return renderStorySection(recommendations.contentBased, 'Gợi ý dựa trên nội dung');
        } else if (selectedRecommendation === 'collaborative') {
            return renderStorySection(recommendations.collaborative, 'Gợi ý dựa trên người dùng tương tự');
        } else if (selectedRecommendation === 'hybrid') {
            return renderStorySection(recommendations.hybrid, 'Gợi ý kết hợp');
        }
    };

    return (
        <div className="page-container">
            <Header />
            <Navbar />
            <main className="main-content">
                <div className="controls">
                    <select 
                        value={selectedRecommendation} 
                        onChange={handleRecommendationChange} 
                        className="recommendation-select"
                    >
                        <option value="all">Tất cả gợi ý</option>
                        <option value="contentBased">Gợi ý dựa trên nội dung</option>
                        <option value="collaborative">Gợi ý dựa trên người dùng tương tự</option>
                        <option value="hybrid">Gợi ý kết hợp</option>
                    </select>
                    <button onClick={handleRefresh} className="refresh-button">
                        Làm mới gợi ý
                    </button>
                </div>
                {loading ? (
                    <div className="loading">Đang tải gợi ý...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    renderRecommendations()
                )}
            </main>
            <Footer />
        </div>
    );
};

export default StoryList;