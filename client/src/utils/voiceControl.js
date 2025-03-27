import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../env";

const useVoiceControl = ({ chapters, storyId, chapterData, isSpeaking, currentParagraphIndex, callbacks }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const isChapterPage = location.pathname.includes('/chapters');

  const speak = (text, callback) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    const voices = synth.getVoices();
    const vietnameseVoice = voices.find(voice => voice.lang === "vi-VN");
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    if (callback) utterance.onend = callback;
    synth.speak(utterance);
  };

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log('Trình duyệt không hỗ trợ SpeechRecognition');
      speak("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    if (!recognitionRef.current) {
      const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recog.lang = 'vi-VN';
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('VoiceControl nghe được:', transcript);

        if (!isChapterPage) {
          if (transcript.includes('truyện hay nhất')) {
            speak("Đang chuyển đến danh sách truyện hot nhất.", () => navigate('/tophot'));
          } else if (transcript.includes('thư viện')) {
            speak("Đang chuyển đến thư viện của bạn.", () => navigate('/library'));
          } else if (transcript.includes('trang chủ')) {
            speak("Đang quay lại trang chủ.", () => navigate('/'));
          } else if (transcript.startsWith('tìm ')) {
            const storyName = transcript.substring(4).trim();
            if (storyName) {
              speak(`Đang tìm truyện ${storyName}`, () => fetchStoryIdByName(storyName));
            } else {
              speak("Vui lòng cung cấp tên truyện sau từ 'tìm'.");
            }
          }
        }

        if (chapters && storyId) {
          if (transcript.includes("đọc từ đầu")) {
            speak("Đang mở chương đầu tiên...", handleReadFromStart);
          } else if (transcript.includes("chương mới nhất")) {
            speak("Đang mở chương mới nhất...", handleReadLatest);
          } else if (transcript.includes("đọc tiếp")) {
            speak("Đang tiếp tục đọc...", handleContinueReading);
          } else {
            chapters.forEach(chap => {
              if (transcript.includes(chap.name.toLowerCase())) {
                speak(`Đang mở chương ${chap.name}`, () => 
                  navigate(`/stories/${storyId}/chapters/${chap._id}`));
              }
            });
          }
        }

        if (chapterData && callbacks) {
          const {
            toggleDropdown,
            navigateToChapter,
            handleReadChapter,
            handleStopReading,
            handleContinueReading,
            scrollToComment,
            setCommentText,
            handleCommentSubmit,
          } = callbacks;

          console.log('Checking nghe truyện:', { transcript, isSpeaking }); // Debug

          if (transcript.includes('chương trước') && chapterData.previousId) {
            speak('Đang chuyển đến chương trước', () => navigateToChapter(chapterData.previousId));
          } else if (transcript.includes('chương tiếp') && chapterData.nextId) {
            speak('Đang chuyển đến chương tiếp', () => navigateToChapter(chapterData.nextId));
          } else if (transcript.includes('danh sách chương')) {
            speak('Đang mở danh sách chương', toggleDropdown);
          } else if (transcript.includes('nghe truyện') && !isSpeaking) {
            console.log('Triggering handleReadChapter'); // Debug
            speak('Đang bắt đầu nghe truyện', handleReadChapter(JSON.parse(localStorage.getItem('chapter_paragraph'))));
          } else if (transcript.includes('dừng nghe') && isSpeaking) {
            speak('Đang dừng nghe truyện', handleStopReading);
          } else if (transcript.includes('tiếp tục nghe') && !isSpeaking && currentParagraphIndex > 0) {
            speak('Đang tiếp tục nghe truyện', handleContinueReading);
          } else if (transcript.includes('bình luận truyện')) {
            speak('Đang mở khung bình luận', scrollToComment);
          } else if (transcript.startsWith('nhập ')) {
            const text = transcript.replace('nhập ', '');
            speak(`Đã nhập: ${text}`, () => setCommentText(text));
          } else if (transcript === 'đăng') {
            speak('Đang đăng bình luận', handleCommentSubmit);
          }
        }

        if (!handleCommand(transcript)) {
          speak("Tôi không hiểu lệnh của bạn. Hãy thử lại.");
        }
      };

      recog.onerror = (event) => console.error('VoiceControl error:', event.error);
      recognitionRef.current = recog;
    }
  }, [navigate, isChapterPage, chapters, storyId, chapterData, isSpeaking, currentParagraphIndex, callbacks]);

  const handleCommand = (transcript) => {
    return transcript.includes('truyện hay nhất') ||
           transcript.includes('thư viện') ||
           transcript.includes('trang chủ') ||
           transcript.startsWith('tìm ') ||
           transcript.includes('đọc từ đầu') ||
           transcript.includes('chương mới nhất') ||
           transcript.includes('đọc tiếp') ||
           transcript.includes('chương trước') ||
           transcript.includes('chương tiếp') ||
           transcript.includes('danh sách chương') ||
           transcript.includes('nghe truyện') ||
           transcript.includes('dừng nghe') ||
           transcript.includes('tiếp tục nghe') ||
           transcript.includes('bình luận truyện') ||
           transcript.startsWith('nhập ') ||
           transcript === 'đăng';
  };

  const fetchStoryIdByName = async (storyName) => {
    try {
      const response = await fetch(`${API_URL}/searchstory?name=${encodeURIComponent(storyName)}`);
      if (!response.ok) {
        speak(`Không tìm thấy truyện ${storyName}`);
        navigate('/searchresult', { state: { searchResults: [] } });
        return;
      }
      const data = await response.json();
      if (data.length === 1) {
        speak(`Đang chuyển đến truyện ${data[0].title}`, () => 
          navigate(`/storyinfo/${data[0]._id}`));
      } else {
        speak(`Có nhiều kết quả, đang hiển thị danh sách tìm kiếm.`, () =>
          navigate('/searchresult', { state: { searchResults: data } }));
      }
    } catch (error) {
      speak("Lỗi khi tìm truyện, vui lòng thử lại sau.");
      navigate('/searchresult', { state: { searchResults: [] } });
    }
  };

  const handleContinueReading = () => {
    const userId = localStorage.getItem("accountId");
    if (userId && storyId) {
      axios.get(`${API_URL}/users/${userId}/stories/${storyId}/reading-chapter`)
        .then(response => {
          const { chapter, count_row } = response.data;
          if (Array.isArray(chapter) && chapter.length > 0) {
            speak(`Đang tiếp tục chương ${chapter[0].title}`, () =>
              navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, { state: { rowCount: count_row } }));
          } else if (chapter && chapter._id) {
            speak(`Đang tiếp tục chương ${chapter.title}`, () =>
              navigate(`/stories/${storyId}/chapters/${chapter._id}`, { state: { rowCount: count_row } }));
          } else {
            speak("Không tìm thấy chương đang đọc dở.");
          }
        })
        .catch(error => {
          speak("Lỗi khi lấy dữ liệu chương đang đọc.");
        });
    }
  };

  const handleReadFromStart = () => {
    const userId = localStorage.getItem("accountId");
    axios.get(`${API_URL}/stories/${storyId}/first?accountId=${userId || ''}`)
      .then(response => {
        const { firstChapter, enableChapter } = response.data;
        console.log('API response for first chapter:', response.data);
        if (enableChapter && firstChapter && firstChapter._id) {
          speak(`Đang mở chương đầu tiên: ${firstChapter.title}`, () =>
            navigate(`/stories/${storyId}/chapters/${firstChapter._id}`));
        } else {
          speak("Bạn cần VIP để đọc chương này hoặc không tìm thấy chương đầu tiên.");
        }
      })
      .catch(error => {
        console.error('Error fetching first chapter:', error);
        speak("Lỗi khi lấy chương đầu tiên.");
      });
  };

  const handleReadLatest = () => {
    const userId = localStorage.getItem("accountId");
    axios.get(`${API_URL}/stories/${storyId}/latest?accountId=${userId || ''}`)
      .then(response => {
        const { latestChapter, enableChapter } = response.data;
        if (enableChapter) {
          speak(`Đang mở chương mới nhất: ${latestChapter.title}`, () =>
            navigate(`/stories/${storyId}/chapters/${latestChapter._id}`));
        } else {
          speak("Bạn cần VIP để đọc chương này.");
        }
      })
      .catch(error => {
        speak("Lỗi khi lấy chương mới nhất.");
      });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          speak('🎤 Đang lắng nghe.');
          console.log('🎤 VoiceControl Mic bật');
        } catch (error) {
          console.error('Error starting recognition:', error);
        }
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        speak('🔇 Đã dừng lắng nghe.');
        console.log('🔇 VoiceControl Mic tắt');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const isAppFirstLaunch = !localStorage.getItem("appLaunched");
    if (isAppFirstLaunch && !isChapterPage) {
      speak(
        "Chào mừng bạn đến với trang web đọc truyện! Bạn có thể nói 'trang chủ', 'thư viện' hoặc 'truyện hay nhất' để điều hướng."
      );
      localStorage.setItem("appLaunched", "true");
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, isChapterPage]);

  return { isListening };
};

export default useVoiceControl;