// src/hooks/useVoiceControl.js
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const useVoiceControl = (chapterData, isSpeaking, currentParagraphIndex, callbacks) => {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const {
    toggleDropdown,
    navigateToChapter,
    handleReadChapter,
    handleStopReading,
    handleContinueReading,
    speak
  } = callbacks;

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log('Trình duyệt không hỗ trợ SpeechRecognition');
      return;
    }

    if (!recognitionRef.current) {
      const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recog.lang = 'vi-VN'; // Ngôn ngữ tiếng Việt
      recog.continuous = true; // Lắng nghe liên tục
      recog.interimResults = false; // Chỉ lấy kết quả cuối cùng

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('Nghe được:', transcript);

        // Xử lý các lệnh giọng nói
        if (transcript.includes('chương trước')) {
          if (chapterData.previousId) {
            speak('Đang chuyển đến chương trước');
            navigateToChapter(chapterData.previousId);
          } else {
            speak('Không có chương trước');
          }
        } else if (transcript.includes('chương tiếp')) {
          if (chapterData.nextId) {
            speak('Đang chuyển đến chương tiếp');
            navigateToChapter(chapterData.nextId);
          } else {
            speak('Không có chương tiếp');
          }
        } else if (transcript.includes('danh sách chương')) {
          speak('Đang mở danh sách chương');
          toggleDropdown();
        } else if (transcript.includes('nghe truyện')) {
          if (!isSpeaking) {
            speak('Đang bắt đầu nghe truyện');
            handleReadChapter();
          } else {
            speak('Đang nghe truyện rồi');
          }
        } else if (transcript.includes('dừng nghe')) {
          if (isSpeaking) {
            speak('Đang dừng nghe truyện');
            handleStopReading();
          } else {
            speak('Không đang nghe truyện');
          }
        } else if (transcript.includes('tiếp tục nghe')) {
          if (!isSpeaking && currentParagraphIndex > 0) {
            speak('Đang tiếp tục nghe truyện');
            handleContinueReading();
          } else {
            speak('Không thể tiếp tục nghe');
          }
        } else {
          speak('Tôi không hiểu lệnh của bạn. Hãy thử lại.');
        }
      };

      recognitionRef.current = recog;
    }
  }, [chapterData, isSpeaking, currentParagraphIndex, toggleDropdown, navigateToChapter, handleReadChapter, handleStopReading, handleContinueReading, speak]);

  // Bật/tắt micro bằng phím Ctrl
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        setIsListening(true);
        speak('🎤 Đang lắng nghe, bạn có thể nói lệnh của mình.');
        console.log('🎤 Mic bật');
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
  }, [isListening, speak]);

  return { isListening };
};

export default useVoiceControl;