import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2'; // Import sweetalert2
import './ChapterList.css';

import { API_URL } from "../../../env.js";

const ChapterList = () => {
  const { storyId } = useParams();
  const [chapters, setChapters] = useState([]);
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState(null);

  // Lấy userId từ localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("accountId");
    setUserId(storedUserId);
  }, []);

  // Lấy danh sách chapters
  useEffect(() => {
    axios.get(`${API_URL}/stories/${storyId}/chapters`)
      .then(response => {
        setChapters(response.data);
      })
      .catch(error => {
        console.error('Error fetching chapters:', error);
      });
  }, [storyId]);

  // Lấy trạng thái tài khoản của người dùng
  useEffect(() => {
    if (userId) {
      axios.get(`${API_URL}/account-status?accountId=${userId}`)
        .then(response => {
          setStatus(response.data.status); // Gán trạng thái tài khoản (VIP hay không)
        })
        .catch(error => {
          console.error("Lỗi khi lấy trạng thái tài khoản:", error);
        });
    }
  }, [userId]);

  const handleChapterClick = (chapter) => {
    if (chapter.status && !status) {
      // Nếu chapter.status = true và người dùng không có VIP
      Swal.fire({
        title: 'Bạn cần VIP!',
        text: 'Hãy nạp VIP để đọc chương này.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else if (!userId && chapter.status) {
      // Nếu người dùng chưa đăng nhập và chapter.status = true
      Swal.fire({
        title: 'Bạn cần đăng nhập!',
        text: 'Hãy đăng nhập và nạp VIP để đọc chương này.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    } else {
      // Các trường hợp còn lại, cho phép vào bình thường
      window.location.href = `/stories/${storyId}/chapters/${chapter._id}`;
    }
  };

  return (
    <section className="u-chapter-list">
      <h3>Chapter List</h3>
      <ul>
        {chapters.map((chapter, index) => {
          const isLocked = chapter.status && status === false;
          const isUnlogged = !userId && chapter.status;
          const chapterClass = isLocked || isUnlogged ? 'locked-chapter' : '';
          
          return (
            <li key={index} className={`u-chapter-item ${chapterClass}`}>
              <a 
                href="#"
                onClick={() => handleChapterClick(chapter)}
                style={{ pointerEvents: isLocked || isUnlogged ? 'none' : 'auto' }}
              >
                {chapter.name}
                {chapter.status === true && <span className="vip-icon">👑</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ChapterList;
