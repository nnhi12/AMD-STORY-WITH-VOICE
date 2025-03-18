import React, { Component } from 'react';
import Swal from 'sweetalert2'; // Thêm SweetAlert2 vào
import './book.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../env.js";

class Book extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isContextMenuOpen: false,
      contextMenuPosition: { x: 0, y: 0 },
    };
  }

  handleContextMenu = (event) => {
    event.preventDefault();
    this.setState({
      isContextMenuOpen: true,
      contextMenuPosition: { x: event.pageX, y: event.pageY },
    });
  };

  handleOptionClick = (option) => {
    const { data, userId, onBookRemoved } = this.props;
    if (option === 'removeFromList') {
      // Hiển thị hộp thoại xác nhận trước khi xóa
      Swal.fire({
        title: 'Bạn chắc chắn muốn xóa?',
        text: 'Truyện này sẽ bị xóa khỏi danh sách theo dõi của bạn.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, xóa nó!',
        cancelButtonText: 'No, giữ lại',
      }).then((result) => {
        if (result.isConfirmed) {
          // Nếu người dùng nhấn Yes, tiếp tục xóa
          axios
            .post(`${API_URL}/remove-from-follow-list`, {
              accountId: userId,
              storyId: data._id,
            })
            .then((response) => {
              if (response.data.message) {
                console.log(response.data.message);
                // Gọi hàm callback để cập nhật lại danh sách truyện
                onBookRemoved(data._id);
              }
            })
            .catch((error) => {
              console.error('Error removing story from follow list:', error);
            });
        }
      });
    }

    this.setState({ isContextMenuOpen: false });
  };

  handleClickOutside = (event) => {
    if (!event.target.closest('.custom-context-menu')) {
      this.setState({ isContextMenuOpen: false });
    }
  };

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  render() {
    const { data, showChapters } = this.props;
    const { isContextMenuOpen, contextMenuPosition } = this.state;
    const imageSrc = data.image ? `data:image/jpeg;base64,${data.image}` : '';

    return (
      <div 
        className="col text-center mb-4"
        onContextMenu={this.handleContextMenu} // Bắt sự kiện chuột phải
      >
        <Link to={`/storyinfo/${data._id}`} className="u-text-decoration-none u-text-dark">
          <img src={imageSrc} alt={data.name} className="img-fluid u-book-image" />
          <p className="u-book-title mt-2">{data.name}</p>
        </Link>
        {showChapters && data.chapters && (
          <ul className="fav-chapter-list mt-2">
            {data.chapters.slice(0, 2).map((chapter, index) => (
              <li key={index}>
                <Link
                  to={`/stories/${data._id}/chapters/${chapter.id}`}
                  className="u-text-decoration-none"
                >
                  {chapter.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Context Menu */}
        {isContextMenuOpen && (
          <div 
            className="custom-context-menu"
            style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          >
            <div onClick={() => this.handleOptionClick('removeFromList')}>Xóa khỏi danh sách theo dõi</div>
          </div>
        )}
      </div>
    );
  }
}

export default Book;
