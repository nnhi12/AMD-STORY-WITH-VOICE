import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import VoiceControlChapter from '../../../utils/chapterVoiceControl.js';
import axios from 'axios';
import './viewchapter.css';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import Comment from './CommentSection.jsx';

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
  const paragraphRefs = useRef([]);
  const location = useLocation();
  const [isDataReady, setIsDataReady] = useState(false);
  const rowCount = location.state?.rowCount || 0;

  const synth = window.speechSynthesis;
  let utteranceQueue = [];

  useEffect(() => {
    const storedUserId = localStorage.getItem("accountId");
    setUserId(storedUserId);

    axios.put(`http://localhost:3001/chapters/${chapterId}/increment-view`)
      .then(response => { console.log('View count updated:', response.data); })
      .catch(error => { console.error('Error incrementing view count:', error); });
  }, [chapterId]);

  useEffect(() => {
    setIsDataReady(false);
    axios.get(`http://localhost:3001/stories/${storyId}/chapters/${chapterId}`)
      .then(response => {
        setChapterData(response.data);
        const content = response.data.chapter?.content || '';
        setParagraphs(content.split('\n').filter(p => p.trim()));
        setIsDataReady(true);
      })
      .catch(error => {
        console.error('Error fetching chapter:', error);
      });

    axios.get(`http://localhost:3001/stories/${storyId}`)
      .then(response => {
        setStory(response.data);
      })
      .catch(error => {
        console.error('Error fetching story:', error);
      });
  }, [chapterId, storyId]);

  
  useEffect(() => {
    console.log("chapterData đã cập nhật:", chapterData);
  }, [chapterData]);


  useEffect(() => {
    if (rowCount && paragraphRefs.current[rowCount]) {
      paragraphRefs.current[rowCount].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [rowCount, paragraphs]);

  const updateReadingProgress = async (chapterId, countRow) => {
    try {
      await axios.put(`http://localhost:3001/users/${userId}/stories/${storyId}/reading-chapter`, {
        chapterId,
        countRow
      });
      //console.log('Tiến trình đọc đã được cập nhật');
    } catch (error) {
      console.warn('Chưa cập nhật được tiến trình:', error);
    }
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      axios.get(`http://localhost:3001/stories/${storyId}/chapters`)
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

  const navigateToChapter = (chapterId) => {
    setCurrentParagraphIndex(0); // Đặt lại chỉ số đoạn văn
    setIsSpeaking(false); // Dừng phát giọng nói hiện tại
    navigate(`/stories/${storyId}/chapters/${chapterId}`);
    window.scrollTo(0, 0);
    updateReadingProgress(chapterId, 0); // Bắt đầu từ đầu (0 hàng đã đọc)
  };

  const getButtonClass = (isDisabled) => {
    return isDisabled ? 'chapter-btn-disabled' : 'chapter-btn-primary';
  };

  const handleReadChapter = () => {
    console.log("chapterId hiện tại:", chapterId);
  console.log("paragraphs trước khi đọc:", paragraphs);
  console.log("currentParagraphIndex:", currentParagraphIndex);
    if (!paragraphs.length) return;
    utteranceQueue = paragraphs.slice(currentParagraphIndex).map((text, index) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.onboundary = (event) => {
        if (event.charIndex === 0) {
          const element = paragraphRefs.current[currentParagraphIndex + index];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setCurrentParagraphIndex(currentParagraphIndex + index);

          // Cập nhật tiến trình đọc khi người dùng đọc
          updateReadingProgress(chapterId, currentParagraphIndex + index + 1); // Cập nhật countRow
        }
      };
      return utterance;
    });

    utteranceQueue.forEach(utterance => synth.speak(utterance));
    setIsSpeaking(true);
  };

  const handleStopReading = () => {
    synth.cancel();
    setIsSpeaking(false);
  };

  const handleContinueReading = () => {
    handleReadChapter();
  };

  const { chapter, previousId, nextId } = chapterData;

  // Theo dõi sự kiện cuộn để cập nhật tiến trình đọc
  useEffect(() => {
    const handleScroll = () => {
      const visibleParagraphIndex = paragraphRefs.current.findIndex((ref, index) => {
        if (!ref) return false;
        const rect = ref.getBoundingClientRect();
        // Kiểm tra nếu đoạn văn đang nằm trong vùng nhìn thấy (từ trên xuống dưới)
        return rect.top >= 0 && rect.top <= window.innerHeight;
      });

      if (visibleParagraphIndex !== -1 && visibleParagraphIndex !== currentParagraphIndex) {
        setCurrentParagraphIndex(visibleParagraphIndex);
        updateReadingProgress(chapterId, visibleParagraphIndex + 1); // Cập nhật tiến trình đọc
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentParagraphIndex, chapterId]);

  if (!chapter) {
    return <div>Loading...</div>;
  }

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
          >
            {isSpeaking ? "Dừng nghe" : "Nghe truyện"}
          </button>
          {!isSpeaking && currentParagraphIndex > 0 && (
            <button
              className="chapter-btn chapter-btn-secondary fixed-audio-btn"
              onClick={handleContinueReading}
            >
              Nghe tiếp
            </button>
          )}
        </div>
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
      <VoiceControlChapter
        chapters={chapters}
        chapter = {chapterData.chapter}
        nextId={chapterData.nextId}
        previousId={chapterData.previousId}
        storyId={storyId}
        paragraphs = {paragraphs}
        onRead={handleReadChapter}
        onStop={handleStopReading}
        onContinue={handleContinueReading}
      />

    </div>
  );
}

export default ViewChapter;
