import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VoiceControlChapter = ({ chapters, storyId }) => {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log("Trình duyệt không hỗ trợ Web Speech API");
      return;
    }

    // Chỉ khởi tạo Recognition MỘT LẦN
    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        let transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Nghe được:", transcript);

        if (transcript.includes("đọc từ đầu")) {
            handleReadFromStart();
        } else if (transcript.includes("chương mới nhất")) {
          handleReadLatest();
        } else if (transcript.includes("đọc tiếp")) {
          handleContinueReading();
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
  }, []); // ✅ Không có dependencies để tránh render lại

  const handleContinueReading = () => {
    const userId = localStorage.getItem("accountId");
    if (userId && storyId) {
        axios.get(`http://localhost:3001/users/${userId}/stories/${storyId}/reading-chapter`)
          .then(response => {
            const {chapter} = response.data;
            const count_row = response.data.count_row;
            console.log(count_row); 
  
            // Kiểm tra xem chapter có phải là mảng hay đối tượng
            if (Array.isArray(chapter) && chapter.length > 0) {
              navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, {
                state: { rowCount: count_row },
              }); // Lấy chapter đầu tiên nếu là mảng
            } else if (chapter && chapter._id) {
              navigate(`/stories/${storyId}/chapters/${chapter._id}`, {
                state: { rowCount: count_row },
              });
            } else {
              console.error('No chapter found to continue reading.');
            }
          })
          .catch(error => console.error('Error fetching reading chapter:', error));
      }
  };

  const handleReadFromStart = () => {
    const userId = localStorage.getItem("accountId");
    axios.get(`http://localhost:3001/stories/${storyId}/first?accountId=${userId || ''}`)
      .then(response => {
        if (response.data) {
          const { firstChapter, enableChapter } = response.data;
          if (enableChapter) {
            navigate(`/stories/${storyId}/chapters/${firstChapter._id}`);
          } else {
            alert('Bạn cần VIP để đọc chương này.');
          }
        }
      })
      .catch(error => console.error('Lỗi lấy chương đầu:', error));
  };

  const handleReadLatest = () => {
    const userId = localStorage.getItem("accountId");
    axios.get(`http://localhost:3001/stories/${storyId}/latest?accountId=${userId || ''}`)
      .then(response => {
        if (response.data) {
          const { latestChapter, enableChapter } = response.data;
          if (enableChapter) {
            navigate(`/stories/${storyId}/chapters/${latestChapter._id}`);
          } else {
            alert('Bạn cần VIP để đọc chương này.');
          }
        }
      })
      .catch(error => console.error('Lỗi lấy chương mới nhất:', error));
  };

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
  }, [isListening]); // ✅ Chỉ phụ thuộc vào `isListening`

  return null;
};

export default VoiceControlChapter;
