import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="u-footer">
      <div className="u-footer-content">
        <img src="https://genk.mediacdn.vn/thumb_w/640/2014/amdlogo-1407485590324.jpg" alt="AMD Logo" className="u-footer-logo" />
        <p>
          MangaFox - Đọc truyện online, đọc truyện chữ, truyện hay. Website luôn cập nhật những bộ truyện mới thuộc các thể loại đặc sắc như truyện tiên hiệp, truyện kiếm hiệp, hay truyện ngôn tình một cách nhanh nhất. Liên hệ: <a href="mailto:contact@mangafox.io" className="contact-email">contact@mangafox.io</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;