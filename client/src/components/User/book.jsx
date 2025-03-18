import React, { Component } from 'react';
import Swal from 'sweetalert2';
import './book.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../env";

class Book extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isContextMenuOpen: false,
      contextMenuPosition: { x: 0, y: 0 },
    };
  }

  handleContextMenu = (event) => {
    event.preventDefault(); // Prevent the default right-click menu from showing
    this.setState({
      isContextMenuOpen: true,
      contextMenuPosition: { x: event.pageX, y: event.pageY },
    });
  };

  handleOptionClick = (option) => {
    const { data, disabled } = this.props;  // Nhận giá trị disabled từ props
    const userId = localStorage.getItem("accountId"); // Lấy accountId từ localStorage

    // Kiểm tra nếu truyện bị vô hiệu hóa
    if (disabled) {
      Swal.fire({
        title: 'Truyện đã đóng!',
        text: 'Không thể thực hiện hành động này vì truyện đã đóng.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      this.setState({ isContextMenuOpen: false }); // Đóng menu
      return; // Ngừng xử lý nếu truyện đã đóng
    }

    // Kiểm tra nếu chưa đăng nhập
    if (!userId) {
      Swal.fire({
        title: 'Bạn cần đăng nhập',
        text: 'Bạn cần đăng nhập để thực hiện hành động này.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      this.setState({ isContextMenuOpen: false }); // Đóng menu sau khi yêu cầu đăng nhập
      return; // Ngừng xử lý nếu chưa đăng nhập
    }

    if (option === 'follow') {
      console.log(`Add to following list: ${data.name}`);

      axios
        .post(`${API_URL}/add-to-follow-list`, {
          accountId: userId,
          storyId: data._id,
        })
        .then((response) => {
          if (response.data.message) {
            Swal.fire({
              title: 'Thành công!',
              text: 'Đã thêm vào danh sách theo dõi',
              icon: 'success',
              confirmButtonText: 'Đóng',
            });
          }
        })
        .catch((error) => {
          Swal.fire({
            title: 'Lỗi!',
            text: 'Bạn đã theo dõi truyện này rồi',
            icon: 'error',
            confirmButtonText: 'Đóng',
          });
          console.error('Error adding story to following list:', error);
        });
    } else if (option === 'addToList') {
      console.log(`Add to reading list: ${data.name}`);

      axios
        .post(`${API_URL}/add-to-reading-list`, {
          accountId: userId,
          storyId: data._id,
        })
        .then((response) => {
          if (response.data.message) {
            Swal.fire({
              title: 'Thành công!',
              text: 'Đã thêm vào danh sách đọc',
              icon: 'success',
              confirmButtonText: 'Đóng',
            });
          }
        })
        .catch((error) => {
          Swal.fire({
            title: 'Lỗi!',
            text: 'Bạn đã lưu truyện này rồi',
            icon: 'error',
            confirmButtonText: 'Đóng',
          });
          console.error('Error adding story to reading list:', error);
        });
    }

    this.setState({ isContextMenuOpen: false }); // Đóng menu sau khi chọn một hành động
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
    const { data, showChapters, disabled } = this.props;  // Nhận giá trị disabled từ props
    const { isContextMenuOpen, contextMenuPosition } = this.state;
    const imageSrc = data.image ? `data:image/jpeg;base64,${data.image}` : '';

    return (
      <div 
        className="col text-center mb-4"
        onContextMenu={this.handleContextMenu} // Bắt sự kiện chuột phải
      >
        <Link 
          to={`/storyinfo/${data._id}`} 
          className={`u-text-decoration-none u-text-dark ${disabled ? 'disabled-link' : ''}`}
        >
          <img 
            src={imageSrc} 
            alt={data.name} 
            className={`img-fluid u-book-image ${disabled ? 'disabled-image' : ''}`} 
          />
          <p className={`u-book-title mt-2 ${disabled ? 'disabled-text' : ''}`}>{data.name}</p>
        </Link>
        {showChapters && data.chapters && (
          <ul className="fav-chapter-list mt-2">
            {data.chapters.slice(0, 2).map((chapter, index) => (
              <li key={index}>
                <Link
                  to={`/stories/${data._id}/chapters/${chapter}`}
                  className={`u-text-decoration-none ${disabled ? 'disabled-link' : ''}`}
                >
                  {chapter}
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
            <div onClick={() => this.handleOptionClick('follow')} 
                 className={disabled ? 'disabled' : ''}>Theo dõi</div>
            <div onClick={() => this.handleOptionClick('addToList')} 
                 className={disabled ? 'disabled' : ''}>Thêm vào danh sách đọc</div>
          </div>
        )}
      </div>
    );
  }
}

export default Book;
