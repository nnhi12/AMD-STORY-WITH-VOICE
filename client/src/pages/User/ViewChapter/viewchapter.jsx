import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './viewchapter.css';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import Comment from './CommentSection.jsx';
import { API_URL } from "../../../env.js";

function ViewChapter() {
  const { chapterId, storyId } = useParams();
  const navigate = useNavigate();
  const [chapterData, setChapterData] = useState({ chapter: null, previousId: null, nextId: null });
  const [chapters, setChapters] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [story, setStory] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paragraphs, setParagraphs] = useState([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const paragraphRefs = useRef([]);
  const location = useLocation();
  const rowCount = location.state?.rowCount || 0;

  const synth = window.speechSynthesis;
  let utteranceQueue = useRef([]); // Dùng useRef để lưu trữ hàng đợi phát âm

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'vi-VN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  useEffect(() => {
    const storedUserId = localStorage.getItem("accountId");
    setUserId(storedUserId);

    axios.put(`${API_URL}/chapters/${chapterId}/increment-view`)
      .then(response => { console.log('View count updated:', response.data); })
      .catch(error => { console.error('Error incrementing view count:', error); });
  }, [chapterId]);

  useEffect(() => {
    setIsLoading(true);
    setCurrentParagraphIndex(0); // Reset index khi chuyển chapter
    Promise.all([
      axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterId}`),
      axios.get(`${API_URL}/stories/${storyId}`)
    ])
      .then(([chapterResponse, storyResponse]) => {
        setChapterData(chapterResponse.data);
        const content = chapterResponse.data.chapter?.content || '';
        setParagraphs(content.split('\n').filter(p => p.trim()));
        setStory(storyResponse.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Lỗi khi tải dữ liệu:', error);
        setIsLoading(false);
      });
  }, [chapterId, storyId]);

  useEffect(() => {
    if (!isLoading && rowCount && paragraphRefs.current[rowCount]) {
      paragraphRefs.current[rowCount].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [rowCount, paragraphs, isLoading]);

  const updateReadingProgress = async (chapterId, countRow) => {
    try {
      await axios.put(`${API_URL}/users/${userId}/stories/${storyId}/reading-chapter`, {
        chapterId,
        countRow
      });
    } catch (error) {
      console.warn('Chưa cập nhật được tiến trình:', error);
    }
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      axios.get(`${API_URL}/stories/${storyId}/chapters`)
        .then(response => {
          setChapters(response.data);
          setIsDropdownOpen(true);
        })
        .catch(error => {
          console.error('Error fetching chapters:', error);
        });
    } else {
      setIsDropdownOpen(false);
    }
  };

  const navigateToChapter = (newChapterId) => {
    handleStopReading(); // Dừng đọc trước khi chuyển
    setCurrentParagraphIndex(0); // Reset index
    navigate(`/stories/${storyId}/chapters/${newChapterId}`);
    window.scrollTo(0, 0);
    updateReadingProgress(newChapterId, 0);
  };

  const getButtonClass = (isDisabled) => {
    return isDisabled ? 'chapter-btn-disabled' : 'chapter-btn-primary';
  };

  const handleReadChapter = () => {
    if (isLoading) {
      console.log("Đang tải nội dung, vui lòng chờ...");
      return;
    }
    if (!paragraphs.length) {
      console.log("Không có nội dung để đọc.");
      return;
    }

    console.log("Bắt đầu đọc truyện...");
    utteranceQueue.current = paragraphs.slice(currentParagraphIndex).map((text, index) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';

      utterance.onboundary = (event) => {
        if (event.charIndex === 0) {
          const element = paragraphRefs.current[currentParagraphIndex + index];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setCurrentParagraphIndex(currentParagraphIndex + index);
          updateReadingProgress(chapterId, currentParagraphIndex + index + 1);
        }
      };

      utterance.onend = () => {
        if (index === paragraphs.length - 1 - currentParagraphIndex) {
          setIsSpeaking(false); // Dừng khi đọc hết
        }
      };

      return utterance;
    });

    utteranceQueue.current.forEach(utterance => synth.speak(utterance));
    setIsSpeaking(true);
  };

  const handleStopReading = () => {
    synth.cancel();
    utteranceQueue.current = []; // Xóa hàng đợi khi dừng
    setIsSpeaking(false);
  };

  const handleContinueReading = () => {
    if (isLoading) {
      console.log("Đang tải nội dung, vui lòng chờ...");
      return;
    }
    if (!paragraphs.length) {
      console.log("Không có nội dung để đọc.");
      return;
    }

    console.log("Tiếp tục đọc truyện từ đoạn:", currentParagraphIndex);
    utteranceQueue.current = paragraphs.slice(currentParagraphIndex).map((text, index) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';

      utterance.onboundary = (event) => {
        if (event.charIndex === 0) {
          const element = paragraphRefs.current[currentParagraphIndex + index];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setCurrentParagraphIndex(currentParagraphIndex + index);
          updateReadingProgress(chapterId, currentParagraphIndex + index + 1);
        }
      };

      utterance.onend = () => {
        if (index === paragraphs.length - 1 - currentParagraphIndex) {
          setIsSpeaking(false); // Dừng khi đọc hết
        }
      };

      return utterance;
    });

    utteranceQueue.current.forEach(utterance => synth.speak(utterance));
    setIsSpeaking(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isLoading) return;
      const visibleParagraphIndex = paragraphRefs.current.findIndex((ref, index) => {
        if (!ref) return false;
        const rect = ref.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight;
      });

      if (visibleParagraphIndex !== -1 && visibleParagraphIndex !== currentParagraphIndex) {
        setCurrentParagraphIndex(visibleParagraphIndex);
        updateReadingProgress(chapterId, visibleParagraphIndex + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentParagraphIndex, chapterId, isLoading]);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    console.log('Nghe được:', transcript);

    if (transcript.includes('nghe truyện')) {
      handleReadChapter();
    } else if (transcript.includes('dừng nghe')) {
      handleStopReading();
    } else if (transcript.includes('tiếp tục đọc')) {
      handleContinueReading();
    } else if (transcript.includes('chương trước')) {
      if (chapterData.previousId) navigateToChapter(chapterData.previousId);
    } else if (transcript.includes('chương tiếp')) {
      if (chapterData.nextId) navigateToChapter(chapterData.nextId);
    }
  };

  recognition.onstart = () => {
    setIsRecognizing(true);
  };

  recognition.onend = () => {
    setIsRecognizing(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        if (recognition.running) {
          recognition.stop();
        } else {
          recognition.start();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải nội dung, vui lòng chờ...</p>
      </div>
    );
  }

  if (!chapterData.chapter) {
    return <div>Không tìm thấy chương...</div>;
  }

  const { chapter, previousId, nextId } = chapterData;

  return (
    <div className="main-chapter-page">
      <Header />
      <Navbar />
      <div className="chapter-content">
        <p className="chapter-post-date">
          {chapter.posted_at ? `Posted at: ${new Date(chapter.posted_at).toLocaleString()}` : "Date not available"}
        </p>
        {story && <h1 className="chapter-title">{story.name}</h1>}
        {chapter && <h2 className="chapter-now">{chapter.name}</h2>}

        <div className="audio-buttons">
          <button
            className={`chapter-btn chapter-btn-secondary ${isSpeaking ? 'fixed-audio-btn' : ''}`}
            onClick={isSpeaking ? handleStopReading : handleReadChapter}
            disabled={isLoading}
          >
            {isSpeaking ? "Dừng nghe" : "Nghe truyện"}
          </button>
          {!isSpeaking && currentParagraphIndex > 0 && (
            <button
              className="chapter-btn chapter-btn-secondary fixed-audio-btn"
              onClick={handleContinueReading}
              disabled={isLoading}
            >
              Nghe tiếp
            </button>
          )}
        </div>
        {isRecognizing && <div className="voice-control-status">Đang lắng nghe...</div>}
      </div>
      <div className="chapter-select-buttons">
        <button
          className={`chapter-btn ${getButtonClass(!previousId)}`}
          onClick={() => previousId && navigateToChapter(previousId)}
          disabled={!previousId}
        >
          Chương trước
        </button>

        <div className="u-view-dropdown">
          <button
            className="chapter-btn chapter-btn-secondary"
            onClick={toggleDropdown}
          >
            Danh sách chương
          </button>
          {isDropdownOpen && (
            <div className="u-view-dropdown-menu">
              <ul>
                {chapters.map(chap => (
                  <li key={chap._id}>
                    <button onClick={() => {
                      navigateToChapter(chap._id);
                      setIsDropdownOpen(false);
                    }}>
                      {chap.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          className={`chapter-btn ${getButtonClass(!nextId)}`}
          onClick={() => nextId && navigateToChapter(nextId)}
          disabled={!nextId}
        >
          Chương tiếp
        </button>
      </div>
      <div className="chapter-content-text">
        {paragraphs.map((para, index) => (
          <p key={index} ref={el => paragraphRefs.current[index] = el} className="chapter-paragraph">
            {para}
          </p>
        ))}
      </div>
      <div className="chapter-select-buttons">
        <button
          className={`chapter-btn ${getButtonClass(!previousId)}`}
          onClick={() => previousId && navigateToChapter(previousId)}
          disabled={!previousId}
        >
          Chương trước
        </button>

        <div className="u-view-dropdown">
          <button
            className="chapter-btn chapter-btn-secondary"
            onClick={toggleDropdown}
          >
            Danh sách chương
          </button>
          {isDropdownOpen && (
            <div className="u-view-dropdown-menu">
              <ul>
                {chapters.map(chap => (
                  <li key={chap._id}>
                    <button onClick={() => {
                      navigateToChapter(chap._id);
                      setIsDropdownOpen(false);
                    }}>
                      {chap.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          className={`chapter-btn ${getButtonClass(!nextId)}`}
          onClick={() => nextId && navigateToChapter(nextId)}
          disabled={!nextId}
        >
          Chương tiếp
        </button>
      </div>
      <Comment />
      <Footer />
    </div>
  );
}

export default ViewChapter;