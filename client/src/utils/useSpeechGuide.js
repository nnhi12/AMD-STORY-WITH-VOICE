import { useState, useEffect } from "react";

const useSpeechRecognition = (onCommand) => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.lang = "vi-VN";
    recog.continuous = true;
    recog.interimResults = false;

    recog.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log("Nghe được:", transcript);
      if (onCommand) onCommand(transcript); // Gọi hàm xử lý lệnh
    };

    setRecognition(recog);
  }, [onCommand]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognition && !isListening) {
        recognition.start();
        setIsListening(true);
        console.log("🎤 Mic bật");
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognition && isListening) {
        recognition.stop();
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
  }, [recognition, isListening]);

  return null;
};

export default useSpeechRecognition;
