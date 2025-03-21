import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VoiceControlChapter = ({ chapters, storyId }) => {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // 🗣️ Hàm đọc phản hồi
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log("Trình duyệt không hỗ trợ Web Speech API");
      speak("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        let transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log("Nghe được:", transcript);
        speak(`Bạn vừa nói: ${transcript}`);

        let found = false;

        if (transcript.includes("đọc từ")) {
          speak("Đang mở chương đầu tiên...");
          handleReadFromStart();
          found = true;
        } else if (transcript.includes("chương mới nhất")) {
          speak("Đang mở chương mới nhất...");
          handleReadLatest();
          found = true;
        } else if (transcript.includes("đọc tiếp")) {
          speak("Đang tiếp tục đọc...");
          handleContinueReading();
          found = true;
        } else {
          chapters.forEach(chap => {
            if (transcript.includes(chap.name.toLowerCase())) {
              speak(`Đang mở chương ${chap.name}`);
              navigate(`/stories/${storyId}/chapters/${chap.id}`);
              found = true;
            }
          });
        }

        // ❗ Nếu không nhận diện được lệnh
        if (!found) {
          speak("Tôi không hiểu. Bạn có thể nói lại không?");
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleContinueReading = () => {
    const userId = localStorage.getItem("accountId");
    if (userId && storyId) {
      axios.get(`http://localhost:3001/users/${userId}/stories/${storyId}/reading-chapter`)
        .then(response => {
          const { chapter } = response.data;
          const count_row = response.data.count_row;
          if (Array.isArray(chapter) && chapter.length > 0) {
            speak(`Đang tiếp tục chương ${chapter[0].title}`);
            navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, {
              state: { rowCount: count_row },
            });
          } else if (chapter && chapter._id) {
            speak(`Đang tiếp tục chương ${chapter.title}`);
            navigate(`/stories/${storyId}/chapters/${chapter._id}`, {
              state: { rowCount: count_row },
            });
          } else {
            speak("Không tìm thấy chương đang đọc dở.");
          }
        })
        .catch(error => {
          console.error('Error fetching reading chapter:', error);
          speak("Lỗi khi lấy dữ liệu chương đang đọc.");
        });
    }
  };

  const handleReadFromStart = () => {
    const userId = localStorage.getItem("accountId");
    axios.get(`http://localhost:3001/stories/${storyId}/first?accountId=${userId || ''}`)
      .then(response => {
        if (response.data) {
          const { firstChapter, enableChapter } = response.data;
          if (enableChapter) {
            speak(`Đang mở chương đầu tiên: ${firstChapter.title}`);
            navigate(`/stories/${storyId}/chapters/${firstChapter._id}`);
          } else {
            speak("Bạn cần VIP để đọc chương này.");
          }
        }
      })
      .catch(error => {
        console.error('Lỗi lấy chương đầu:', error);
        speak("Lỗi khi lấy chương đầu tiên.");
      });
  };

  const handleReadLatest = () => {
    const userId = localStorage.getItem("accountId");
    axios.get(`http://localhost:3001/stories/${storyId}/latest?accountId=${userId || ''}`)
      .then(response => {
        if (response.data) {
          const { latestChapter, enableChapter } = response.data;
          if (enableChapter) {
            speak(`Đang mở chương mới nhất: ${latestChapter.title}`);
            navigate(`/stories/${storyId}/chapters/${latestChapter._id}`);
          } else {
            speak("Bạn cần VIP để đọc chương này.");
          }
        }
      })
      .catch(error => {
        console.error('Lỗi lấy chương mới nhất:', error);
        speak("Lỗi khi lấy chương mới nhất.");
      });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        recognitionRef.current.start();
        setIsListening(true);
        console.log("🎤 Mic bật");
        speak("Micro đã bật, hãy nói lệnh của bạn.");
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log("🔇 Mic tắt");
        speak("Micro đã tắt.");
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
