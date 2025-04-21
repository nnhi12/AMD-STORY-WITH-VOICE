import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './viewchapter.css';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import Comment from './CommentSection.jsx';
import { API_URL } from "../../../env.js";
import useVoiceControl from '../../../utils/voiceControl.js';

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
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const paragraphRefs = useRef([]);
  const commentSectionRef = useRef(null);
  const location = useLocation();
  const rowCount = location.state?.rowCount || 0;

  const synth = window.speechSynthesis;
  let utteranceQueue = [];

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    utterance.lang = "vi-VN";
    const vietnameseVoice = voices.find(voice => voice.lang === "vi-VN");
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    synth.speak(utterance);
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem("accountId");
    setUserId(storedUserId);

    axios.put(`${API_URL}/chapters/${chapterId}/increment-view`)
      .then(response => console.log('View count updated:', response.data))
      .catch(error => console.error('Error incrementing view count:', error));
  }, [chapterId]);

  useEffect(() => {
    localStorage.setItem('is_Speaking', JSON.stringify(isSpeaking));
    localStorage.setItem('currentParagraphIndex', currentParagraphIndex);
  }, [isSpeaking, currentParagraphIndex]);

  useEffect(() => {
    axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterId}`)
      .then(response => {
        setChapterData(response.data);
        const content = response.data.chapter?.content || '';
        setParagraphs(content.split('\n').filter(p => p.trim()));
        localStorage.setItem('chapter_paragraph', JSON.stringify(content.split('\n').filter(p => p.trim())));
      })
      .catch(error => console.error('Error fetching chapter:', error));

    axios.get(`${API_URL}/stories/${storyId}`)
      .then(response => setStory(response.data))
      .catch(error => console.error('Error fetching story:', error));

    axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterId}/comments`)
      .then(response => setComments(response.data.comments || []))
      .catch(error => console.error('Error fetching comments:', error));
  }, [chapterId, storyId]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) console.log('Voices loaded:', voices);
    };
    synth.addEventListener('voiceschanged', loadVoices);
    loadVoices();
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    if (rowCount && paragraphRefs.current[rowCount]) {
      paragraphRefs.current[rowCount].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [rowCount, paragraphs]);

  const updateReadingProgress = async (chapterId, countRow) => {
    if (!localStorage.getItem('accountId')) {
      console.log('Người dùng chưa đăng nhập, bỏ qua cập nhật tiến trình');
      return;
    }
    try {
      await axios.put(`${API_URL}/users/${localStorage.getItem('accountId')}/stories/${storyId}/reading-chapter`, {
        chapterId,
        countRow,
        last_interaction: new Date(), // Cập nhật thời gian đọc gần nhất
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
        .catch(error => console.error('Error fetching chapters:', error));
    } else {
      setIsDropdownOpen(false);
    }
  };

  const navigateToChapter = (chapterId) => {
    setCurrentParagraphIndex(0);
    navigate(`/stories/${storyId}/chapters/${chapterId}`);
    window.scrollTo(0, 0);
    updateReadingProgress(chapterId, 0);
  };

  const getButtonClass = (isDisabled) => {
    return isDisabled ? 'chapter-btn-disabled' : 'chapter-btn-primary';
  };

  const handleReadChapter = (chapter_paragraph) => {
    console.log('handleReadChapter called');
    if (!chapter_paragraph.length) {
      console.log('No paragraphs to read');
      speak('Không có đoạn văn để đọc');
      return;
    }
    let pIndex = parseInt(localStorage.getItem("currentParagraphIndex"));
    setIsSpeaking(true);
    localStorage.setItem('is_Speaking', JSON.stringify(true));
    console.log('Paragraphs:', chapter_paragraph, 'Current index:', typeof (pIndex));
    utteranceQueue = chapter_paragraph.slice(pIndex).map((text, index) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      utterance.lang = "vi-VN";
      const vietnameseVoice = voices.find(voice => voice.lang === "vi-VN");
      if (vietnameseVoice) utterance.voice = vietnameseVoice;
      utterance.onboundary = (event) => {
        if (event.charIndex === 0) {
          const element = paragraphRefs.current[pIndex + index];
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setCurrentParagraphIndex(pIndex + index);
          updateReadingProgress(chapterId, pIndex + index + 1);
        }
      };
      utterance.onend = () => {
        if (index === chapter_paragraph.length - pIndex - 1) {
          setIsSpeaking(false);
          localStorage.setItem('isSpeaking', JSON.stringify(false));
          // Gọi callback để thông báo chapter hoàn tất
          if (callbacks.onChapterFinished) {
            callbacks.onChapterFinished();
          }
        }
      };
      return utterance;
    });
    utteranceQueue.forEach((utterance, idx) => {
      console.log(`Speaking paragraph ${pIndex + idx}:`, utterance.text);
      synth.speak(utterance);
    });
  };

  const handleStopReading = () => {
    console.log('Before cancel: ', window.speechSynthesis.speaking);
    window.speechSynthesis.cancel();
    console.log('After cancel: ', window.speechSynthesis.speaking);
    setIsSpeaking(false);
    localStorage.setItem('is_Speaking', JSON.stringify(false));
  };

  const handleContinueReading = () => {
    if (localStorage.getItem('currentParagraphIndex') > 0) {
      handleReadChapter(JSON.parse(localStorage.getItem('chapter_paragraph')));
    } else {
      speak('Bạn đang ở đầu chương. Hãy nói "nghe truyện" để bắt đầu.');
    }
  };

  const handleReadFromBeginning = () => {
    console.log('handleReadFromBeginning called');
    setCurrentParagraphIndex(0);
    localStorage.setItem('currentParagraphIndex', 0);
    handleReadChapter(JSON.parse(localStorage.getItem('chapter_paragraph')));
  };

  const handleCommentSubmit = () => {
    if (!commentText || commentText.trim() === '') {
      console.log('Bình luận rỗng, không thể đăng');
      speak('Bình luận rỗng, không thể đăng');
      return;
    }
    console.log('Đang gửi bình luận:', commentText);
    axios.post(`${API_URL}/stories/${storyId}/chapters/${chapterId}/comments`, {
      content: commentText,
      accountId: userId,
    })
      .then(() => {
        console.log('Bình luận đã được gửi thành công');
        setCommentText('');
        axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterId}/comments`)
          .then(response => setComments(response.data.comments || []))
          .catch(error => console.error('Error fetching comments:', error));
      })
      .catch(error => console.error('Lỗi khi đăng bình luận:', error));
  };

  const handleRatingDecision = (decision) => {
    if (decision.toLowerCase() === 'có') {
      navigate(`/storyinfo/${storyId}`);
      speak('Đã chuyển đến trang đánh giá truyện. Hãy nói số sao bạn muốn đánh giá, từ 1 đến 5.');
    } else {
      speak('Bạn đã từ chối đánh giá. Cảm ơn bạn đã đọc truyện!');
    }
  };

  const callbacks = {
    toggleDropdown,
    navigateToChapter,
    handleReadChapter,
    handleStopReading,
    handleContinueReading,
    handleReadFromBeginning,
    speak,
    scrollToComment: () => commentSectionRef.current?.scrollToInput(),
    setCommentText,
    handleCommentSubmit,
    updateReadingProgress,
    setComments,
    onChapterFinished: () => {}, // Sẽ được useVoiceControl sử dụng để phát hiện chapter hoàn tất
    onRatingDecision: handleRatingDecision, // Callback xử lý quyết định đánh giá
  };

  const { isListening = false } = useVoiceControl({
    chapters,
    storyId,
    chapterData,
    currentParagraphIndex,
    callbacks,
    nextId: chapterData.nextId,
    previousId: chapterData.previousId,
    chapterId: chapterData?.chapter?._id || null,
    userId: localStorage.getItem('accountId'),
    commentText: commentText,
  }) || {};

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const centerY = windowHeight / 2;

      const visibleParagraphIndex = paragraphRefs.current.reduce((closestIndex, ref, index) => {
        if (!ref) return closestIndex;
        const rect = ref.getBoundingClientRect();
        const distanceFromCenter = Math.abs(rect.top + rect.height / 2 - centerY);

        if (closestIndex === -1) return index;
        const currentClosestDistance = Math.abs(
          paragraphRefs.current[closestIndex].getBoundingClientRect().top +
          paragraphRefs.current[closestIndex].getBoundingClientRect().height / 2 - centerY
        );
        return distanceFromCenter < currentClosestDistance ? index : closestIndex;
      }, -1);

      if (visibleParagraphIndex !== -1 && visibleParagraphIndex !== currentParagraphIndex) {
        console.log('Highlighting paragraph at index:', visibleParagraphIndex);
        setCurrentParagraphIndex(visibleParagraphIndex);
        updateReadingProgress(chapterId, visibleParagraphIndex + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentParagraphIndex, chapterId]);

  if (!chapterData.chapter) {
    return <div>Loading...</div>;
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
            onClick={isSpeaking ? handleStopReading : () => handleReadChapter(paragraphs)}
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
          <button className="chapter-btn chapter-btn-secondary" onClick={toggleDropdown}>
            Danh sách chương
          </button>
          {isDropdownOpen && (
            <div className="u-view-dropdown-menu">
              <ul>
                {chapters.map(chap => (
                  <li key={chap._id}>
                    <button
                      onClick={() => {
                        navigateToChapter(chap._id);
                        setIsDropdownOpen(false);
                      }}
                    >
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
          <p
            key={index}
            ref={el => paragraphRefs.current[index] = el}
            className={`chapter-paragraph ${index === currentParagraphIndex ? 'highlight' : ''}`}
          >
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
          <button className="chapter-btn chapter-btn-secondary" onClick={toggleDropdown}>
            Danh sách chương
          </button>
          {isDropdownOpen && (
            <div className="u-view-dropdown-menu">
              <ul>
                {chapters.map(chap => (
                  <li key={chap._id}>
                    <button
                      onClick={() => {
                        navigateToChapter(chap._id);
                        setIsDropdownOpen(false);
                      }}
                    >
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
      <Comment
        ref={commentSectionRef}
        comments={comments}
        commentText={commentText}
        setCommentText={setCommentText}
        handleCommentSubmit={handleCommentSubmit}
      />
      <Footer />
    </div>
  );
}

export default ViewChapter;