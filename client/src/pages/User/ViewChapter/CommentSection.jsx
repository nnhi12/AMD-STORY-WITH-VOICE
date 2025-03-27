import React, { forwardRef, useRef, useImperativeHandle } from 'react';

const CommentSection = forwardRef(({ comments, commentText, setCommentText, handleCommentSubmit }, ref) => {
  const commentInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToInput: () => {
      if (commentInputRef.current) {
        commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentInputRef.current.focus();
      }
    },
  }));

  return (
    <div className="comment-section">
      <h3>Comments</h3>
      <div className="comments-list">
        {comments.map((comment, index) => (
          <div key={index} className="comment">
            <div className="comment-header">
              {comment.user?.image && (
                <img src={comment.user.image} alt="User Avatar" className="comment-user-image" />
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
          ref={commentInputRef}
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button onClick={handleCommentSubmit}>Submit</button>
      </div>
    </div>
  );
});

export default CommentSection;