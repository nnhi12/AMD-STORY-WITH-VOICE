import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../env";

function VoiceControl() {
  const navigate = useNavigate();
  const recognitionRef = useRef(null); // Dùng useRef để tránh re-render liên tục
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
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
          navigate('/tophot');
        } else if (transcript.includes('thư viện')) {
          navigate('/library');
        } else if (transcript.includes('trang chủ')) {
          navigate('/');
        } else if (transcript.toLowerCase().startsWith('tìm ')) {
          const storyName = transcript.substring(4).trim(); // Cắt bỏ "tìm " (4 ký tự)
          if (storyName) { // Kiểm tra xem còn nội dung sau "tìm " không
            fetchStoryIdByName(storyName);
          } else {
            console.log("Vui lòng cung cấp tên truyện sau từ 'tìm'");
          }
        } else {
          console.log("Vui lòng nói 'tìm' theo sau là tên truyện để tìm kiếm.");
        }
      };

      recognitionRef.current = recog; // Lưu recognition vào useRef
    }
  }, [navigate]);

  const fetchStoryIdByName = async (storyName) => {
    try {
      const response = await fetch(`${API_URL}/searchstory?name=${encodeURIComponent(storyName)}`);
      if (!response.ok) {
        console.log("Không tìm thấy truyện:", storyName);
        navigate('/searchresult', { state: { searchResults: [] } });
        return;
      }

      const data = await response.json();
      console.log("Kết quả tìm kiếm:", data);

      if (data.length === 1) {
        navigate(`/storyinfo/${data[0]._id}`);
      } else {
        navigate('/searchresult', { state: { searchResults: data } });
      }
    } catch (error) {
      console.error("Lỗi khi tìm truyện:", error);
      navigate('/searchresult', { state: { searchResults: [] } });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('🎤 Mic bật');
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
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
