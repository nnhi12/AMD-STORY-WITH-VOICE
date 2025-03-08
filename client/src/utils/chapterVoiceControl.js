import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VoiceControlChapter = ({ chapters, storyId, onRead, onStop, onContinue, nextId, previousId , navigateToChapter}) => {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const processingRef = useRef(false);

  // Lưu trữ giá trị mới nhất của nextId và previousId bằng useRef
  const nextIdRef = useRef(nextId);
  const previousIdRef = useRef(previousId);
  const onContinueRef = useRef(onContinue);
  const onReadRef = useRef(onRead);
  const onStopRef = useRef(onStop);

  // Cập nhật ref mỗi khi props thay đổi
  useEffect(() => {
    nextIdRef.current = nextId;
    previousIdRef.current = previousId;
    onContinueRef.current = onContinue;
    onReadRef.current = onRead;
    onStopRef.current = onStop;
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

        if (processingRef.current) return;
        processingRef.current = true;
        setTimeout(() => (processingRef.current = false), 1000);

        if (transcript.includes("tập") && previousIdRef.current) {
          console.log("Điều hướng đến chương trước:", previousIdRef.current);
          navigateToChapter(previousIdRef.current);
        } else if (transcript.includes("tiếp theo") && nextIdRef.current) {
          console.log("Điều hướng đến chương tiếp theo:", nextIdRef.current);
          navigateToChapter(nextIdRef.current);
        } else if (transcript.includes("nghe truyện")) {
          onReadRef.current();
        } else if (transcript.includes("dừng nghe")) {
          onStopRef.current();
        } else if (transcript.includes("nghe tiếp")) {
          console.log("Gọi onContinue với lastReadingIndex:");
          onContinueRef.current();
        } else {
          chapters.forEach(chap => {
            if (transcript.includes(chap.name.toLowerCase())) {
              navigate(`/stories/${storyId}/chapters/${chap.id}`);
            }
          });
        }
      };

      recognitionRef.current = recognition;
    }
  }, [chapters, storyId, navigate, onRead, onStop, onContinue]);

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