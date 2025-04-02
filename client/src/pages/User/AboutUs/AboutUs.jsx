import React, { useEffect } from 'react';
import './AboutUs.css';
import 'aos/dist/aos.css';
import AOS from 'aos';
import useVoiceControl from '../../../utils/voiceControl.js';

const AboutUs = () => {
  useEffect(() => {
    AOS.init({
      duration: 1200, // Thời gian hiệu ứng (ms)
      once: true, // Hiệu ứng chỉ xảy ra một lần
    });
  }, []);

  useVoiceControl("", "", "");
  
  return (
    <div className="about-container my-5">
      <h1 className="text-center mb-4" data-aos="fade-up">
        Giới Thiệu Về Chúng Tôi
      </h1>

      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="image-section" data-aos="fade-up">
            <img
              src="https://cdn.pixabay.com/photo/2018/01/12/10/19/fantasy-3077928_1280.jpg" // Thay thế bằng URL ảnh của bạn
              alt="Comic Book"
              className="about-image"
            />
          </div>

          <p data-aos="fade-up">
            Chào mừng bạn đến với nền tảng của chúng tôi, nơi cung cấp nhiều thể loại truyện tranh, manga và các nội dung thú vị dành cho người hâm mộ trên toàn thế giới. Sứ mệnh của chúng tôi là mang lại một trải nghiệm sống động và thư viện đa dạng phục vụ sở thích của độc giả.
          </p>

          <h2 data-aos="fade-right">Hướng Dẫn Đọc Truyện</h2>
          <p data-aos="fade-right">
            Để đọc truyện trên nền tảng của chúng tôi, bạn chỉ cần đăng nhập vào tài khoản của mình. 
            Sau đó, chọn thể loại truyện yêu thích và bắt đầu khám phá các câu chuyện hấp dẫn. 
            Bạn có thể lựa chọn chế độ nghe để trực tiếp nghe truyện.
            Bạn còn có thể lưu truyện vào danh sách đọc để có thể ghi lại tiến trình đọc truyện hoặc theo dõi truyện mà mình yêu thích.
            Nhưng cũng sẽ có những giới hạn đối với tài khoản thường, các chương truyện có gắn biểu tượng 👑, bạn chỉ có thể đọc khi là tài khoản VIP.
            Hãy ủng hộ website bằng cách đăng ký tài khoản VIP để chúng tôi có thể sở hữu bản quyền của nhiều truyện hơn nhé!!!!!!
          </p>

          <h2 data-aos="fade-left">Hướng Dẫn Đăng Ký Thành Viên VIP</h2>
          <p data-aos="fade-left">
            Để trở thành thành viên VIP và không giới hạn các chương truyện bạn có thể truy cập, bạn chỉ cần làm theo các bước sau:
            <ul>
              <li>Đăng nhập vào tài khoản của bạn hoặc tạo tài khoản mới nếu chưa có.</li>
              <li>Truy cập vào trang "Thành viên VIP" ở đầu trang.</li>
              <li>Tiến hành nạp tiền bằng Paypal chỉ với 99.000 vnd là bạn đã có thể trở thành VIP và đọc bất cứ truyện nào mà bạn muốn.</li>
            </ul>
            Sau khi đăng ký, bạn sẽ có quyền truy cập vào các truyện mới nhất, bản quyền đặc biệt và các tính năng độc quyền khác.
            Cảm ơn các độc giả thân yêu.
          </p>

          <div className="contact-section" data-aos="zoom-in">
            <h2>Liên Hệ Với Chúng Tôi</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi, phản hồi hoặc gợi ý nào, đừng ngần ngại liên hệ với chúng tôi qua email: <a href="mailto:contact@mangafox.io">contact@mangafox.io</a>.
            </p>
          </div>

          <div className="join-section" data-aos="flip-up">
            <h2>Tham Gia Cùng Chúng Tôi</h2>
            <p>
              Chúng tôi luôn tìm kiếm các tác giả đam mê muốn chia sẻ công trình sáng tạo của mình. Nếu bạn là người yêu thích truyện hoặc có đam mê kể chuyện, đừng ngần ngại kết nối với chúng tôi!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
