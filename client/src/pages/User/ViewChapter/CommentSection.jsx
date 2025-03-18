import React, { useEffect, useState } from 'react';
import { useParams} from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../../env.js";

const CommentSection = () => {
    const { chapterId, storyId } = useParams();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [userId, setUserId] = useState(null);
    useEffect(() => {
        const storedUserId = localStorage.getItem("accountId");
        setUserId(storedUserId);
    }, []);
    useEffect(() => {
        axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterId}/comments`)
            .then(response => {
                if (response.data && Array.isArray(response.data.comments)) {
                    setComments(response.data.comments);
                } else {
                    setComments([]);
                }
            })
            .catch(error => {
                console.error('Error fetching comments:', error);
            });
    }, [chapterId, storyId]);
    const handleCommentSubmit = () => {
        if (newComment.trim() === '') {
            // Nếu không có nội dung bình luận, không làm gì
            return;
        }
        axios.post(`${API_URL}/stories/${storyId}/chapters/${chapterId}/comments`, {
          content: newComment,
          accountId: userId,
        })
          .then(() => {
            // Sau khi đăng bình luận thành công, lấy lại danh sách bình luận mới
            axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterId}/comments`)
              .then(response => {
                if (response.data && Array.isArray(response.data.comments)) {
                  setComments(response.data.comments);  // Cập nhật danh sách bình luận mới
                }
              })
              .catch(error => {
                console.error('Error fetching comments:', error);
              });
            
            // Xóa nội dung trong ô input sau khi đăng bình luận
            setNewComment('');
          })
          .catch(error => {
            console.error('Lỗi khi đăng bình luận:', error);
          });
      };
      
    return (
        <div className="comment-section">
            <h3>Comments</h3>
            <div className="comments-list">
                {comments.map((comment, index) => (
                    <div key={index} className="comment">
                        <div className="comment-header">
                            {comment.user?.image && (
                                <img
                                    src={comment.user.image}
                                    alt="User Avatar"
                                    className="comment-user-image"
                                />
                            )}
                            <strong>{comment.user?.username}</strong>
                            <span>{comment.message}</span>
                            <span> - {new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p>{comment.content}</p>
                    </div>
                ))}

            </div>
            <div className="comment-input">
                <textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button onClick={handleCommentSubmit}>Submit</button>
            </div>
        </div>
    );
};

export default CommentSection;
