import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from "../env";

function VoiceControl() {
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // 🗣️ Hàm đọc phản hồi bằng giọng nói và thực hiện callback sau khi nói xong
  const speak = (text, callback) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";

    // Khi hệ thống nói xong, thực hiện callback (nếu có)
    utterance.onend = () => {
      if (callback) callback();
    };

    synth.speak(utterance);
  };

  useEffect(() => {
    // Kiểm tra nếu ứng dụng vừa khởi động (reload)
    const isAppFirstLaunch = !localStorage.getItem("appLaunched");

    if (isAppFirstLaunch) {
      speak(
        "Chào mừng bạn đến với trang web đọc truyện! Bạn có thể nói 'trang chủ', 'thư viện' hoặc 'truyện hay nhất' để điều hướng."
      );
      localStorage.setItem("appLaunched", "true");
    }

    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return;

    if (!recognitionRef.current) {
      const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recog.lang = 'vi-VN';
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        console.log('Nghe được:', transcript);

        if (transcript.includes('truyện hay nhất')) {
          speak("Đang chuyển đến danh sách truyện hot nhất.", () => navigate('/tophot'));
        } else if (transcript.includes('thư viện')) {
          speak("Đang chuyển đến thư viện của bạn.", () => navigate('/library'));
        } else if (transcript.includes('trang chủ')) {
          speak("Đang quay lại trang chủ.", () => navigate('/'));
        } else if (transcript.toLowerCase().startsWith('tìm ')) {
          const storyName = transcript.substring(4).trim();
          if (storyName) {
            speak(`Đang tìm truyện ${storyName}`, () => fetchStoryIdByName(storyName));
          } else {
            speak("Vui lòng cung cấp tên truyện sau từ 'tìm'.");
          }
        } else {
          speak("Tôi không hiểu lệnh của bạn. Hãy thử nói 'tìm' theo sau là tên truyện.");
        }
      };

      recognitionRef.current = recog;
    }
  }, [navigate]);

  const fetchStoryIdByName = async (storyName) => {
    try {
      const response = await fetch(`${API_URL}/searchstory?name=${encodeURIComponent(storyName)}`);
      if (!response.ok) {
        speak(`Không tìm thấy truyện ${storyName}`);
        navigate('/searchresult', { state: { searchResults: [] } });
        return;
      }

      const data = await response.json();
      console.log("Kết quả tìm kiếm:", data);

      if (data.length === 1) {
        speak(`Đang chuyển đến truyện ${data[0].title}`, () => navigate(`/storyinfo/${data[0]._id}`));
      } else {
        speak(`Có nhiều kết quả, đang hiển thị danh sách tìm kiếm.`, () =>
          navigate('/searchresult', { state: { searchResults: data } })
        );
      }
    } catch (error) {
      speak("Lỗi khi tìm truyện, vui lòng thử lại sau.");
      console.error("Lỗi khi tìm truyện:", error);
      navigate('/searchresult', { state: { searchResults: [] } });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        setIsListening(true); // Đánh dấu trạng thái đang chuẩn bị nghe
        speak('🎤 Đang lắng nghe, bạn có thể nói lệnh của mình.', () => {
          recognitionRef.current.start();
          console.log('🎤 Mic bật');
        });
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        speak('🔇 Đã dừng lắng nghe.');
        console.log('🔇 Mic tắt');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening]);

  return null;
}

export default VoiceControl;
