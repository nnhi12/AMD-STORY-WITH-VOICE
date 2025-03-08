import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VoiceControlChapter from '../../../utils/storyChapterSpeech.js'; 
import axios from 'axios';
import './StoryInfo.css';

const StoryInfo = () => {
  const { storyId } = useParams();
  const [story, setStory] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  const [canContinueReading, setCanContinueReading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate(); // Hook điều hướng trong React Router

  useEffect(() => {
    // Lấy userId từ localStorage
    const storedUserId = localStorage.getItem("accountId");
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    // Lấy thông tin câu chuyện
    axios.get(`http://localhost:3001/stories/${storyId}`)
      .then(response => {
        setStory(response.data);
        console.log(response.data);
      })
      .catch(error => {
        console.error('Error fetching story:', error);
      });

    axios.get(`http://localhost:3001/stories/${storyId}/chapters`)
      .then(response => setChapterList(response.data)) // Lưu danh sách chương
      .catch(error => console.error("Error fetching chapters:", error));

    // Kiểm tra xem người dùng có thể tiếp tục đọc chương nào không
    if (userId) {
      axios.get(`http://localhost:3001/users/${userId}/stories/${storyId}/reading-chapter`)
        .then(response => {
          setCanContinueReading(!!response.data.chapter); // Kiểm tra xem có chapter nào hay không
          console.log(response.data.chapter);
          console.log(response.data.count_row);
        })
        .catch(error => console.error('Error checking continue reading availability:', error));
    }
  }, [userId, storyId]);

  if (!story) {
    return <div>Loading...</div>;
  }

  const handleReadFromStart = () => {
    axios.get(`http://localhost:3001/stories/${storyId}/first?accountId=${userId || ''}`)
    .then(response => {
      if (response.data) {
        const { firstChapter, enableChapter } = response.data;

        // Only navigate if the chapter is enabled
        if (enableChapter) {
          navigate(`/stories/${storyId}/chapters/${firstChapter._id}`);
        } else {
          alert('You cannot read this chapter if you are not VIP.'); // Optional: show a message when disabled
        }
      }
      })
      .catch(error => console.error('Error fetching first chapter:', error));
  };

  const handleReadLatest = () => {
    axios.get(`http://localhost:3001/stories/${storyId}/latest?accountId=${userId || ''}`)
    .then(response => {
      if (response.data) {
        const { latestChapter, enableChapter } = response.data;

        // Only navigate if the chapter is enabled
        if (enableChapter) {
          navigate(`/stories/${storyId}/chapters/${latestChapter._id}`);
        } else {
          alert('You cannot read this chapter if you are not VIP.'); // Optional: show a message when disabled
        }
      }
      })
      .catch(error => console.error('Error fetching latest chapter:', error));
  };

  const handleContinueReading = () => {
    if (userId && storyId) {
      axios.get(`http://localhost:3001/users/${userId}/stories/${storyId}/reading-chapter`)
        .then(response => {
          const {chapter} = response.data;
          const count_row = response.data.count_row;
          console.log(count_row); 

          // Kiểm tra xem chapter có phải là mảng hay đối tượng
          if (Array.isArray(chapter) && chapter.length > 0) {
            navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, {
              state: { rowCount: count_row },
            }); // Lấy chapter đầu tiên nếu là mảng
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
            disabled={!canContinueReading} // Vô hiệu hóa nếu không có dữ liệu
            style={{ display: canContinueReading ? 'inline-block' : 'none' }} // Ẩn nút nếu không có dữ liệu
          >
            Đọc tiếp
          </button>
        </div>
      </div>
      <VoiceControlChapter chapters={chapterList} storyId={storyId} />
    </section>
    
  );
};

export default StoryInfo;
