import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VoiceControlChapter = ({ chapters, storyId, nextId, previousId }) => {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

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

      const handleAddToFavorites = () => {
        const userId = localStorage.getItem("accountId");
        if (userId && storyId) {
          axios.post("http://localhost:3001/add-to-favorites", { accountId: userId, storyId })
            .then(response => alert(response.data.message))
            .catch(error => alert(error.response?.data?.message || "Lỗi khi thêm vào danh sách yêu thích"));
        }
      };

      const handleAddToReadingList = () => {
        const userId = localStorage.getItem("accountId");
        if (userId && storyId) {
          axios.post("http://localhost:3001/add-to-reading-list", { accountId: userId, storyId })
            .then(response => alert(response.data.message))
            .catch(error => alert(error.response?.data?.message || "Lỗi khi thêm vào danh sách đọc"));
        }
      };

      recognition.onresult = (event) => {
        let transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Nghe được:", transcript);

        if (transcript.includes("thêm vào danh sách yêu thích")) {
          handleAddToFavorites();
        } else if (transcript.includes("thêm vào danh sách đọc")) {
          handleAddToReadingList();
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
  }, [chapters, storyId, navigate]);
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
