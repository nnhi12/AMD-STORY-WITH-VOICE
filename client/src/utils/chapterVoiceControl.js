import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VoiceControlChapter = ({ chapters, storyId, onRead, onStop, onContinue, nextId, previousId, isDataReady }) => {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const processingRef = useRef(false);

  const nextIdRef = useRef(nextId);
  const previousIdRef = useRef(previousId);

  useEffect(() => {
    nextIdRef.current = nextId;
    previousIdRef.current = previousId;
    console.log("Props cập nhật - previousId:", previousId, "nextId:", nextId);
  }, [nextId, previousId]);

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log("Trình duyệt không hỗ trợ Web Speech API");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Nghe được:", transcript);
        console.log("previousId hiện tại:", previousIdRef.current);
        console.log("nextId hiện tại:", nextIdRef.current);
        console.log("isDataReady trong VoiceControlChapter:", isDataReady);

        if (processingRef.current) return;
        processingRef.current = true;
        setTimeout(() => (processingRef.current = false), 1000);

        if (transcript.includes("nghe truyện")) {
          if (!isDataReady) {
            console.warn("Dữ liệu chưa sẵn sàng trong VoiceControlChapter");
            return;
          }
          console.log("Bắt đầu nghe truyện...");
          onRead();
        } else if (transcript.includes("dừng nghe")) {
          console.log("Dừng nghe truyện...");
          onStop();
        } else if (transcript.includes("nghe tiếp")) {
          console.log("Tiếp tục nghe truyện...");
          onContinue();
        } else if (transcript.includes("tập") && previousIdRef.current) {
          console.log("Điều hướng đến chương trước:", previousIdRef.current);
          navigate(`/stories/${storyId}/chapters/${previousIdRef.current}`);
          window.scrollTo(0, 0);
        } else if (transcript.includes("tiếp theo") && nextIdRef.current) {
          console.log("Điều hướng đến chương tiếp theo:", nextIdRef.current);
          navigate(`/stories/${storyId}/chapters/${nextIdRef.current}`);
          window.scrollTo(0, 0);
        } else {
          const matchedChapter = chapters.find(chap => transcript.includes(chap.name.toLowerCase()));
          if (matchedChapter) {
            console.log("Điều hướng đến chương:", matchedChapter._id);
            navigate(`/stories/${storyId}/chapters/${matchedChapter._id}`);
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [chapters, storyId, navigate, onRead, onStop, onContinue, isDataReady]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        setIsListening(true);
        console.log("🎤 Mic bật");
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log("🔇 Mic tắt");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isListening]);

  return null;
};

export default VoiceControlChapter;