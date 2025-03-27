import { useEffect, useRef, useState } from 'react';

const useVoiceControl = (chapterData, isSpeaking, currentParagraphIndex, callbacks) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const {
    toggleDropdown,
    navigateToChapter,
    handleReadChapter,
    handleStopReading,
    handleContinueReading,
    speak,
    scrollToComment,
    setCommentText,
    handleCommentSubmit,
  } = callbacks;

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log('Trình duyệt không hỗ trợ SpeechRecognition');
      return;
    }

    if (!recognitionRef.current) {
      const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recog.lang = 'vi-VN';
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('ChapterView nghe được:', transcript);

        if (transcript.includes('chương trước')) {
          console.log('Previous ID:', chapterData.previousId);
          if (chapterData.previousId) {
            speak('Đang chuyển đến chương trước');
            navigateToChapter(chapterData.previousId);
          } else {
            speak('Không có chương trước');
          }
        } else if (transcript.includes('chương tiếp')) {
          console.log('Next ID:', chapterData.nextId);
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
        } else if (transcript.includes('bình luận truyện')) {
          speak('Đang mở khung bình luận');
          scrollToComment();
        } else if (transcript.startsWith('nhập ')) {
          const text = transcript.replace('nhập ', '');
          speak(`Đã nhập: ${text}`);
          setCommentText(text);
        } else if (transcript === 'đăng') {
          console.log('Lệnh đăng được nhận diện');
          speak('Đang đăng bình luận');
          handleCommentSubmit();
        } else {
          speak('Tôi không hiểu lệnh của bạn. Hãy thử lại.');
        }
      };

      recog.onerror = (event) => console.error('ChapterView error:', event.error);
      recognitionRef.current = recog;
    }
  }, [chapterData, isSpeaking, currentParagraphIndex, toggleDropdown, navigateToChapter, handleReadChapter, handleStopReading, handleContinueReading, speak, scrollToComment, setCommentText, handleCommentSubmit]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          speak('🎤 Đang lắng nghe.');
          console.log('🎤 ChapterView Mic bật');
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
        console.log('🔇 ChapterView Mic tắt');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, speak]);

  return { isListening };
};

export default useVoiceControl;