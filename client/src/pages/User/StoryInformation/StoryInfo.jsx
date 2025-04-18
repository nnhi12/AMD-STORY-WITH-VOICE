import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StoryInfo.css';
import { API_URL } from "../../../env.js";
import useVoiceControl from '../../../utils/voiceControl.js';

const StoryInfo = () => {
  const { storyId } = useParams();
  const [story, setStory] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  const [canContinueReading, setCanContinueReading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [ratingData, setRatingData] = useState({ averageRating: 0, totalRatings: 0 });
  const [userRating, setUserRating] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserId = localStorage.getItem("accountId");
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/stories/${storyId}`)
      .then(response => {
        setStory(response.data);
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error fetching story:', error);
      });

    axios.get(`${API_URL}/stories/${storyId}/chapters`)
      .then(response => setChapterList(response.data))
      .catch(error => console.error("Error fetching chapters:", error));

    if (userId) {
      axios.get(`${API_URL}/users/${userId}/stories/${storyId}/reading-chapter`)
        .then(response => {
          setCanContinueReading(!!response.data.chapter);
          console.log(response.data.chapter);
          console.log(response.data.count_row);
        })
        .catch(error => console.error('Error checking continue reading availability:', error));
    }

    // Lấy thông tin rating của truyện
    axios.get(`${API_URL}/stories/${storyId}/rating`)
      .then(response => {
        setRatingData(response.data);
      })
      .catch(error => {
        console.error('Error fetching rating:', error);
      });
  }, [userId, storyId]);

  const handleReadFromStart = () => {
    axios.get(`${API_URL}/stories/${storyId}/first?accountId=${userId || ''}`)
      .then(response => {
        if (response.data) {
          const { firstChapter, enableChapter } = response.data;
          if (enableChapter) {
            navigate(`/stories/${storyId}/chapters/${firstChapter._id}`);
          } else {
            alert('You cannot read this chapter if you are not VIP.');
          }
        }
      })
      .catch(error => console.error('Error fetching first chapter:', error));
  };

  const handleReadLatest = () => {
    axios.get(`${API_URL}/stories/${storyId}/latest?accountId=${userId || ''}`)
      .then(response => {
        if (response.data) {
          const { latestChapter, enableChapter } = response.data;
          if (enableChapter) {
            navigate(`/stories/${storyId}/chapters/${latestChapter._id}`);
          } else {
            alert('You cannot read this chapter if you are not VIP.');
          }
        }
      })
      .catch(error => console.error('Error fetching latest chapter:', error));
  };

  const handleContinueReading = () => {
    if (userId && storyId) {
      axios.get(`${API_URL}/users/${userId}/stories/${storyId}/reading-chapter`)
        .then(response => {
          const { chapter } = response.data;
          const count_row = response.data.count_row;
          if (Array.isArray(chapter) && chapter.length > 0) {
            navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, {
              state: { rowCount: count_row },
            });
          } else if (chapter && chapter._id) {
            navigate(`/stories/${storyId}/chapters/${chapter._id}`, {
              state: { rowCount: count_row },
            });
          } else {
            console.error('No chapter found to continue reading.');
          }
        })
        .catch(error => console.error('Error fetching reading chapter:', error));
    }
  };

  const handleRating = async (rating) => {
    if (!userId) {
      alert('Vui lòng đăng nhập để đánh giá truyện.');
      return;
    }
    const user = localStorage.getItem('userId');
    try {
      await axios.post(`${API_URL}/stories/${storyId}/rating`, { user, rating });
      setUserRating(rating);
      const response = await axios.get(`${API_URL}/stories/${storyId}/rating`);
      setRatingData(response.data);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Không thể gửi đánh giá. Vui lòng thử lại sau.');
    }
  };

  const callbacks = {
    handleReadFromStart,
    handleReadLatest,
    handleContinueReading,
  };

  useVoiceControl({ chapters: chapterList, storyId, callbacks, story });

  if (!story) {
    return <div>Loading...</div>;
  }

  return (
    <section className="u-story-info">
      <img src={story.image ? `data:image/jpeg;base64,${story.image}` : ''} alt={story.name} className="u-story-cover" />
      <div className="u-summary">
        <div className="u-story-name">
          <h1 className="u-page-title">{story.name}</h1>
          <h4 className="u-author">
            {story.author ? (
              <>
                <p>{story.author}</p>
              </>
            ) : (
              'Unknown Author'
            )}
          </h4>
        </div>
        <div className="u-date-info">
          <p>Created at: {new Date(story.created_at).toLocaleString()}</p>
          <p>Updated at: {new Date(story.updated_at).toLocaleString()}</p>
          <p>Trạng thái: {story.status ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</p>
        </div>
        <h3>Summary</h3>
        <p>{story.description}</p>
        <div>
          <button className="u-read-option-button" onClick={handleReadFromStart}>Đọc từ đầu</button>
          <button className="u-read-option-button" onClick={handleReadLatest}>Chương mới nhất</button>
          <button
            className="u-read-option-button"
            onClick={handleContinueReading}
            disabled={!canContinueReading}
            style={{ display: canContinueReading ? 'inline-block' : 'none' }}
          >
            Đọc tiếp
          </button>
        </div>
        <div className="rating-section">
          <h3>Đánh giá truyện</h3>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`star ${star <= userRating ? 'filled' : ''}`}
                onClick={() => handleRating(star)}
              >
                ★
              </span>
            ))}
          </div>
          <p>
            {ratingData.totalRatings > 0 ? (
              `Điểm trung bình: ${ratingData.averageRating} (${ratingData.totalRatings} đánh giá)`
            ) : (
              <i>(chưa có đánh giá)</i>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default StoryInfo;