import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../env';

// Hàm chuẩn hóa văn bản: loại bỏ dấu, khoảng cách, chuyển thành chữ thường
const normalizeText = (text) => {
  // Chuyển thành chữ thường
  let normalized = text.toLowerCase();
  // Loại bỏ dấu tiếng Việt
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
  // Loại bỏ khoảng cách và ký tự đặc biệt
  normalized = normalized.replace(/\s+/g, '');
  return normalized;
};

const capitalizeName = (name) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const useVoiceControl = ({
  chapters,
  storyId,
  chapterData,
  currentParagraphIndex,
  callbacks,
  nextId,
  previousId,
  userId,
  commentText,
  chapterId,
  setAge,
  fetchStories,
  setStories,
  loadingUserInfo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isChapterFinished, setIsChapterFinished] = useState(false);
  const isChapterPage = location.pathname.includes('/chapters');
  const userIdRef = useRef(userId);
  const nextIdRef = useRef(nextId);
  const previousIdRef = useRef(previousId);
  const commentTextRef = useRef(commentText);
  const chapterIdRef = useRef(chapterId);
  const currentParagraphIndexRef = useRef(currentParagraphIndex);
  const isAskingForRatingRef = useRef(false);
  const isWaitingForRatingRef = useRef(false);
  const lastSpokenPathRef = useRef(null);
  const usernameRef = useRef('');
  const passwordRef = useRef('');
  const emailRef = useRef('');
  const ageRef = useRef('');
  const genderRef = useRef('other');
  const preferredCategoriesRef = useRef([]);
  const fullnameRef = useRef('');
  const isEditingRef = useRef(false);
  

  const getCategories = async () => {
    let categories = [];
    try {
      // Kiểm tra localStorage
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        categories = JSON.parse(storedCategories);
        console.log('Đã lấy categories từ localStorage:', categories);
        if (Array.isArray(categories) && categories.length > 0) {
          return categories;
        }
      }
      // Nếu localStorage rỗng, gọi API
      console.log('localStorage rỗng, gọi API /categories');
      const response = await axios.get(`${API_URL}/categories`);
      categories = response.data;
      // Lưu vào localStorage
      localStorage.setItem('categories', JSON.stringify(categories));
      console.log('Đã lưu categories từ API vào localStorage:', categories);
      return categories;
    } catch (error) {
      console.error('Lỗi khi lấy categories:', error);
      return [];
    }
  };

  // Hàm speak với debug và kiểm tra
  const speak = (text, callback) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    const voices = synth.getVoices();
    const vietnameseVoice = voices.find(voice => voice.lang === "vi-VN");
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    if (callback) utterance.onend = callback;
    synth.speak(utterance);
  };

  // Xử lý phím Ctrl với keydown/keyup (tương tự code cũ của bạn)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey) {
        if (!isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
            console.log('SpeechRecognition started');
            speak('Mic đã bật, hãy nói lệnh của bạn.');
          } catch (error) {
            console.error('Lỗi khi bật mic:', error);
            speak('Không thể bật mic, vui lòng kiểm tra quyền truy cập.');
          }
        }
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey) {
        if (isListening && recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
          console.log('SpeechRecognition stopped');
          speak('Mic đã tắt.');
        }
      }
    };

    console.log('Attaching keydown/keyup listeners');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening]);

  // Page name mapping
  const pageNameMap = {
    '/': 'chủ',
    '/register': 'đăng ký',
    '/login': 'đăng nhập',
    '/library': 'thư viện',
    '/tophot': 'truyện hot nhất',
    '/favpage': 'danh sách truyện theo dõi',
    '/aboutus': 'giới thiệu',
    '/userinfo': 'thông tin người dùng',
    '/payment': 'thanh toán',
    '/forgot-password': 'quên mật khẩu',
    '/colab-recommend': 'truyện gợi ý',
    '/by-age': 'truyện theo độ tuổi',
    '/for-kids': 'truyện dành cho trẻ em',
    '/by-age-input': 'nhập độ tuổi',
    '/by-gender': 'truyện theo giới tính',
    '/searchresult': 'tìm kiếm truyện',
  };

  // Announce page changes
  useEffect(() => {
    let timeoutId;
    const getPageName = () => {
      if (location.pathname.startsWith('/storyinfo/')) return 'thông tin truyện';
      if (location.pathname.startsWith('/stories/') && location.pathname.includes('/chapters/'))
        return 'nội dung chương';
      if (location.pathname.startsWith('/classifiedbygenre/')) return 'truyện theo thể loại';
      if (location.pathname.startsWith('/category/')) return 'truyện theo danh mục';
      if (location.pathname.startsWith('/classifiedbychapter?')) return 'truyện theo tổng chương';
      return pageNameMap[location.pathname] || 'trang không xác định';
    };

    const pageName = getPageName();
    if (lastSpokenPathRef.current !== location.pathname) {
      window.speechSynthesis.cancel();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        speak(`Bạn đang ở trang ${pageName}`);
        lastSpokenPathRef.current = location.pathname;
      }, 500);
    }

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Update refs
  useEffect(() => {
    nextIdRef.current = nextId;
    previousIdRef.current = previousId;
    userIdRef.current = userId;
    commentTextRef.current = commentText;
    chapterIdRef.current = chapterId;
    currentParagraphIndexRef.current = currentParagraphIndex;
  }, [nextId, previousId, userId, commentText, chapterId, currentParagraphIndex]);



  // Handle chapter completion
  useEffect(() => {
    if (isChapterFinished && !isAskingForRatingRef.current) {
      isAskingForRatingRef.current = true;
      speak('Bạn có muốn đánh giá truyện này không? Hãy nói "có" hoặc "không".');
      setTimeout(() => {
        if (isAskingForRatingRef.current) {
          speak('Bạn đã không trả lời. Cảm ơn bạn đã đọc truyện!');
          isAskingForRatingRef.current = false;
          setIsChapterFinished(false);
        }
      }, 20000);
    }
  }, [isChapterFinished]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('Trình duyệt không hỗ trợ SpeechRecognition');
      speak('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }

    if (!recognitionRef.current) {
      const recog = new SpeechRecognition();
      recog.lang = 'vi-VN';
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = async (event) => {
        console.log('SpeechRecognition result:', event.results);
        if (event.results.length > 0) {
          const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
          console.log('VoiceControl nghe được:', transcript);
          const isSpeaking = JSON.parse(localStorage.getItem('is_Speaking')) || false;

          // Handle rating prompt
          if (isAskingForRatingRef.current) {
            if (transcript === 'có' || transcript === 'không') {
              if (callbacks.onRatingDecision) {
                callbacks.onRatingDecision(transcript);
                isAskingForRatingRef.current = false;
                if (transcript === 'có') {
                  isWaitingForRatingRef.current = true;
                  speak('Vui lòng nói "đánh giá X sao", với X từ 1 đến 5.');
                }
              }
            } else {
              speak('Vui lòng nói "có" hoặc "không".');
            }
            return;
          }

          // Handle rating submission
          if (isWaitingForRatingRef.current || location.pathname.startsWith('/storyinfo')) {
            const ratingMatch = transcript.match(/^đánh giá (\d+)\s*sao$/);
            const user = localStorage.getItem('userId');
            if (ratingMatch) {
              const rating = parseInt(ratingMatch[1], 10);
              if (rating >= 1 && rating <= 5) {
                if (!user) {
                  speak('Vui lòng đăng nhập để đánh giá truyện.');
                  return;
                }
                try {
                  await axios.post(`${API_URL}/stories/${storyId}/rating`, {
                    user: user,
                    rating,
                  });
                  speak(`Bạn đã đánh giá ${rating} sao. Cảm ơn bạn! Đang làm mới trang.`, () => {
                    window.location.reload();
                  });
                  isWaitingForRatingRef.current = false;
                } catch (error) {
                  console.error('Error submitting rating:', error);
                  speak('Không thể gửi đánh giá. Vui lòng thử lại sau.');
                }
              } else {
                speak('Vui lòng nói một số từ 1 đến 5, ví dụ "đánh giá 4 sao".');
              }
              return;
            }
          }

          //userinfo
          if (location.pathname === '/userinfo') {
            if (transcript.includes('chỉnh sửa thông tin')) {
              if (callbacks && callbacks.setIsEditing) {
                callbacks.setIsEditing(true);
                isEditingRef.current = true;
                console.log('Chuyển sang chế độ chỉnh sửa, isEditing:', true);
                speak('Đã chuyển sang chế độ chỉnh sửa.');
              } else {
                speak('Không thể chuyển sang chế độ chỉnh sửa. Vui lòng thử lại.');
              }
              return;
            } else if (transcript.startsWith('nhập họ tên ')) {
              let fullname = transcript.replace('nhập họ tên ', '').trim();
              if (fullname && callbacks && callbacks.handleChange) {
                callbacks.setIsEditing(true);
                isEditingRef.current = true;
                console.log('Tự động chuyển sang chế độ chỉnh sửa khi nhập họ tên, isEditing:', true);
                fullname = capitalizeName(fullname);
                callbacks.handleChange({ target: { name: 'fullname', value: fullname } });
                fullnameRef.current = fullname;
                speak(`Đã nhập họ tên: ${fullname}`);
              } else {
                speak('Vui lòng cung cấp họ tên hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập email ')) {
              let email = transcript.replace('nhập email ', '').trim();
              if (email && callbacks && callbacks.handleChange) {
                callbacks.setIsEditing(true);
                isEditingRef.current = true;
                console.log('Tự động chuyển sang chế độ chỉnh sửa khi nhập email, isEditing:', true);
                email = normalizeText(email).replace(/\s/g, '');
                callbacks.handleChange({ target: { name: 'email', value: email } });
                emailRef.current = email;
                console.log('Cập nhật email:', email);
                speak(`Đã nhập email: ${email}`);
              } else {
                speak('Vui lòng cung cấp email hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập tuổi ')) {
              const age = transcript.replace('nhập tuổi ', '').trim();
              if (!isNaN(age) && age >= 0 && callbacks && callbacks.handleChange) {
                callbacks.setIsEditing(true);
                isEditingRef.current = true;
                console.log('Tự động chuyển sang chế độ chỉnh sửa khi nhập tuổi, isEditing:', true);
                callbacks.handleChange({ target: { name: 'age', value: age } });
                ageRef.current = age;
                speak(`Đã nhập tuổi: ${age}`);
              } else {
                speak('Vui lòng cung cấp tuổi hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('chọn giới tính ')) {
              const genderInput = transcript.replace('chọn giới tính ', '').trim();
              let gender = 'other';
              if (genderInput.includes('nam')) gender = 'male';
              else if (genderInput.includes('nữ') || genderInput.includes('nu')) gender = 'female';
              if (callbacks && callbacks.handleChange) {
                callbacks.setIsEditing(true);
                isEditingRef.current = true;
                console.log('Tự động chuyển sang chế độ chỉnh sửa khi chọn giới tính, isEditing:', true);
                callbacks.handleChange({ target: { name: 'gender', value: gender } });
                genderRef.current = gender;
                speak(`Đã chọn giới tính: ${gender === 'male' ? 'nam' : gender === 'female' ? 'nữ' : 'khác'}`);
              } else {
                speak('Không thể chọn giới tính. Vui lòng thử lại.');
              }
              return;
            } else if (transcript.startsWith('chọn thể loại yêu thích ')) {
              const categoryName = transcript.replace('chọn thể loại yêu thích ', '').trim().toLowerCase();
              const categories = await getCategories();
              if (!categories || categories.length === 0) {
                speak('Danh sách thể loại không khả dụng. Vui lòng thử lại sau.');
                return;
              }
              const normalizedCategoryName = normalizeText(categoryName);
              const category = categories.find((cat) => normalizeText(cat.name.toLowerCase()) === normalizedCategoryName);
              if (category && callbacks && callbacks.handleCategoryChange) {
                callbacks.setIsEditing(true);
                isEditingRef.current = true;
                console.log('Tự động chuyển sang chế độ chỉnh sửa khi chọn thể loại, isEditing:', true);
                const updatedCategories = [...new Set([...preferredCategoriesRef.current, category._id])].filter(
                  (id) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)
                );
                callbacks.handleCategoryChange({ target: { value: updatedCategories } });
                preferredCategoriesRef.current = updatedCategories;
                console.log('Cập nhật preferred_categories:', updatedCategories);
                speak(`Đã chọn thể loại yêu thích: ${category.name}`);
              } else {
                speak(`Thể loại ${categoryName} không hợp lệ hoặc không tìm thấy. Các thể loại khả dụng: ${categories.map(cat => cat.name).join(', ')}.`);
              }
              return;
            } else if (transcript.includes('lưu thông tin')) {
              if (callbacks && callbacks.handleSave) {
                console.log('Xử lý lệnh lưu thông tin, isEditingRef:', isEditingRef.current);
                console.log('userInfo hiện tại:', callbacks.userInfo.current);
                if (isEditingRef.current) {
                  speak('Đang lưu thông tin người dùng.');
                  callbacks.handleSave();
                } else {
                  speak('Vui lòng chuyển sang chế độ chỉnh sửa trước khi lưu.');
                }
              } else {
                speak('Không thể lưu thông tin. Vui lòng thử lại.');
              }
              return;
            }
          }

          // Xử lý lệnh đăng nhập trên trang /login
          if (location.pathname === '/login') {
            if (transcript.startsWith('nhập tên ')) {
              const rawUsername = transcript.replace('nhập tên ', '').trim();
              const username = normalizeText(rawUsername);
              if (username && callbacks.setUsername) {
                callbacks.setUsername(username);
                usernameRef.current = username;
                speak(`Đã nhập tên đăng nhập: ${username}`);
              } else {
                speak('Vui lòng cung cấp tên đăng nhập hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập mật khẩu ')) {
              const rawPassword = transcript.replace('nhập mật khẩu ', '').trim();
              const password = normalizeText(rawPassword);
              if (password && callbacks.setPassword) {
                callbacks.setPassword(password);
                passwordRef.current = password;
                speak('Đã nhập mật khẩu.');
              } else {
                speak('Vui lòng cung cấp mật khẩu hợp lệ.');
              }
              return;
            } else if (transcript.includes('đăng nhập')) {
              if (!usernameRef.current || !passwordRef.current) {
                speak('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu trước.');
                return;
              }
              if (callbacks.submitLogin) {
                speak('Đang thực hiện đăng nhập.');
                // Gửi dữ liệu chuẩn hóa từ usernameRef và passwordRef
                callbacks.submitLogin({
                  username: usernameRef.current,
                  password: passwordRef.current,
                });
              } else {
                speak('Không thể đăng nhập. Vui lòng thử lại.');
              }
              return;
            }
          }

          if (location.pathname === '/register') {
            if (transcript.startsWith('nhập tên đăng nhập ')) {
              const rawUsername = transcript.replace('nhập tên đăng nhập ', '').trim();
              const username = normalizeText(rawUsername);
              if (username && callbacks.setUsername) {
                callbacks.setUsername(username);
                usernameRef.current = username;
                speak(`Đã nhập tên đăng nhập: ${username}`);
              } else {
                speak('Vui lòng cung cấp tên đăng nhập hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập mật khẩu ')) {
              const rawPassword = transcript.replace('nhập mật khẩu ', '').trim();
              const password = normalizeText(rawPassword);
              if (password && callbacks.setPassword) {
                callbacks.setPassword(password);
                passwordRef.current = password;
                speak('Đã nhập mật khẩu.');
              } else {
                speak('Vui lòng cung cấp mật khẩu hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập email ')) {
              const email = transcript.replace('nhập email ', '').trim();
              if (email && callbacks.setEmail) {
                callbacks.setEmail(email);
                emailRef.current = email;
                speak(`Đã nhập email: ${email}`);
              } else {
                speak('Vui lòng cung cấp email hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập tuổi ')) {
              const age = transcript.replace('nhập tuổi ', '').trim();
              if (!isNaN(age) && age >= 0 && callbacks.setAge) {
                callbacks.setAge(age);
                ageRef.current = age;
                speak(`Đã nhập tuổi: ${age}`);
              } else {
                speak('Vui lòng cung cấp tuổi hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('chọn giới tính ')) {
              const genderInput = transcript.replace('chọn giới tính ', '').trim();
              let gender = 'other';
              if (genderInput.includes('nam')) gender = 'male';
              else if (genderInput.includes('nữ') || genderInput.includes('nu')) gender = 'female';
              if (callbacks.setGender) {
                callbacks.setGender(gender);
                genderRef.current = gender;
                speak(`Đã chọn giới tính: ${gender === 'male' ? 'nam' : gender === 'female' ? 'nữ' : 'khác'}`);
              } else {
                speak('Không thể chọn giới tính. Vui lòng thử lại.');
              }
              return;
            } else if (transcript.startsWith('chọn thể loại ')) {
              const categoryName = transcript.replace('chọn thể loại ', '').trim().toLowerCase();
              // Lấy categories từ localStorage hoặc API
              const categories = await getCategories();
              console.log('categories hiện tại:', categories);
              if (!categories || categories.length === 0) {
                speak('Danh sách thể loại không khả dụng. Vui lòng thử lại sau.');
                console.log('categories rỗng:', categories);
                return;
              }
              const normalizedCategoryName = normalizeText(categoryName);
              const category = categories.find((cat) => normalizeText(cat.name.toLowerCase()) === normalizedCategoryName);
              console.log('Tìm thể loại:', normalizedCategoryName, 'Danh sách categories:', categories.map(cat => cat.name));
              if (category && callbacks.addCategory) {
                callbacks.addCategory(category._id);
                preferredCategoriesRef.current = [
                  ...new Set([...preferredCategoriesRef.current, category._id]),
                ];
                speak(`Đã chọn thể loại: ${category.name}`);
                console.log('preferredCategoriesRef sau khi chọn:', preferredCategoriesRef.current);
              } else {
                speak(`Thể loại ${categoryName} không hợp lệ hoặc không tìm thấy. Các thể loại khả dụng: ${categories.map(cat => cat.name).join(', ') || 'không có'}.`);
                console.log('Không tìm thấy thể loại:', normalizedCategoryName, 'Thể loại khả dụng:', categories.map(cat => cat.name));
              }
              return;
            } else if (transcript.includes('đăng ký')) {
              if (
                !usernameRef.current ||
                !passwordRef.current ||
                !emailRef.current ||
                !ageRef.current
              ) {
                speak('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, email và tuổi trước.');
                return;
              }
              if (callbacks.submitRegister) {
                speak('Đang thực hiện đăng ký.');
                callbacks.submitRegister({
                  username: usernameRef.current,
                  password: passwordRef.current,
                  confirmPassword: passwordRef.current,
                  email: emailRef.current,
                  age: ageRef.current,
                  gender: genderRef.current,
                  preferredCategories: preferredCategoriesRef.current,
                });
              } else {
                speak('Không thể đăng ký. Vui lòng thử lại.');
              }
              return;
            }
          }

          // Handle logout
          if (transcript.includes('đăng xuất')) {
            const userId = localStorage.getItem('accountId');
            if (!userId) {
              speak('Bạn chưa đăng nhập.');
              return;
            }
            speak("Bạn muốn đăng xuất? Hãy nói 'xác nhận' trong 10 giây để tiếp tục.");
            const originalOnResult = recog.onresult;
            recog.onresult = async (event) => {
              const confirmationTranscript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
              if (confirmationTranscript.includes('xác nhận')) {
                localStorage.removeItem('username');
                localStorage.removeItem('userId');
                localStorage.removeItem('accountId');
                localStorage.removeItem('vipExpiredNotificationShown');
                navigate('/login');
                recog.onresult = originalOnResult;
              }
            };
            setTimeout(() => {
              if (recog.onresult !== originalOnResult) {
                speak('Đã hủy đăng xuất do không nhận được xác nhận.');
                recog.onresult = originalOnResult;
              }
            }, 20000);
            return;
          }

          // Handle login
          if (location.pathname === '/login') {
            if (transcript.startsWith('nhập tên đăng nhập ')) {
              const username = transcript.replace('nhập tên đăng nhập ', '').trim();
              if (username && callbacks.setUsername) {
                callbacks.setUsername(username);
                speak(`Đã nhập tên đăng nhập: ${username}`);
              } else {
                speak('Vui lòng cung cấp tên đăng nhập hợp lệ.');
              }
              return;
            } else if (transcript.startsWith('nhập mật khẩu ')) {
              const password = transcript.replace('nhập mật khẩu ', '').trim();
              if (password && callbacks.setPassword) {
                callbacks.setPassword(password);
                speak('Đã nhập mật khẩu.');
              } else {
                speak('Vui lòng cung cấp mật khẩu hợp lệ.');
              }
              return;
            } else if (transcript.includes('đăng nhập')) {
              if (callbacks.submitLogin) {
                speak('Đang thực hiện đăng nhập.');
                callbacks.submitLogin();
              } else {
                speak('Không thể đăng nhập. Vui lòng thử lại.');
              }
              return;
            }
          }

          // Handle recommendation page
          if (location.pathname === '/colab-recommend') {
            const getRecommendationText = (selectedRecommendation) => {
              switch (selectedRecommendation) {
                case 'all': return 'tất cả gợi ý';
                case 'contentBased': return 'gợi ý dựa trên nội dung';
                case 'collaborative': return 'gợi ý dựa trên người dùng tương tự';
                case 'hybrid': return 'gợi ý kết hợp';
                default: return 'tất cả gợi ý';
              }
            };

            const fetchRecommendations = async (type, userId) => {
              try {
                const endpoint = type === 'all'
                  ? `${API_URL}/recommend/contentBased/${userId}`
                  : `${API_URL}/recommend/${type}/${userId}`;
                const response = await axios.get(endpoint);
                return response.data || [];
              } catch (error) {
                console.error(`Lỗi khi lấy gợi ý ${type}:`, error);
                speak('Có lỗi khi lấy danh sách truyện.');
                return [];
              }
            };

            const handleRecommendationSelection = async (type) => {
              if (callbacks.setSelectedRecommendation) {
                callbacks.setSelectedRecommendation(type);
                localStorage.setItem('selectedRecommendation', type);
                const recommendationText = getRecommendationText(type);
                const stories = await fetchRecommendations(type, userIdRef.current);
                const storyNames = stories
                  .map((story, index) => `${index + 1}. ${story.name || story.title || 'Tên truyện không xác định'}`)
                  .join(', ');
                speak(`Đang hiển thị ${recommendationText}. Các truyện: ${storyNames || 'Không có truyện'}.`);
              } else {
                speak('Không thể thay đổi gợi ý. Vui lòng thử lại.');
              }
            };

            const recommendationCommands = {
              all: ['mở tất cả gợi ý', 'hiển thị tất cả gợi ý', 'tất cả gợi ý'],
              contentBased: ['mở gợi ý dựa trên nội dung', 'hiển thị gợi ý dựa trên nội dung', 'gợi ý nội dung'],
              collaborative: [
                'mở gợi ý dựa trên người dùng',
                'hiển thị gợi ý dựa trên người dùng',
                'gợi ý người dùng',
                'gợi ý cộng tác',
              ],
              hybrid: ['mở gợi ý kết hợp', 'hiển thị gợi ý kết hợp', 'gợi ý kết hợp'],
            };

            for (const [type, commands] of Object.entries(recommendationCommands)) {
              if (commands.some((cmd) => transcript.includes(cmd))) {
                await handleRecommendationSelection(type);
                return;
              }
            }

            if (transcript.includes('đọc thông tin trang') || transcript.includes('đọc trang') || transcript.includes('thông tin trang')) {
              const selectedRecommendation = localStorage.getItem('selectedRecommendation') || 'all';
              const recommendationText = getRecommendationText(selectedRecommendation);
              const stories = await fetchRecommendations(selectedRecommendation, userIdRef.current);
              const storyNames = stories
                .map((story, index) => `${index + 1}. ${story.name || story.title || 'Tên truyện không xác định'}`)
                .join(', ');
              speak(`Bạn đang xem ${recommendationText}. Các truyện: ${storyNames || 'Không có truyện'}.`);
              return;
            }
          }

          // Handle homepage story list
          if (location.pathname === '/' && transcript.includes('đọc danh sách truyện')) {
            const readStoryList = async () => {
              try {
                const response = await axios.get(`${API_URL}/stories`);
                const stories = response.data;
                if (!stories || stories.length === 0) {
                  speak('Hiện tại không có truyện nào trong danh sách.');
                  return;
                }

                localStorage.setItem('is_Speaking', JSON.stringify(true));
                speak('Danh sách các truyện hiện có là:', () => {
                  let index = 0;
                  const readNextStory = () => {
                    if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                      const story = stories[index];
                      if (story.name) {
                        speak(story.name, () => {
                          index++;
                          readNextStory();
                        });
                      } else {
                        index++;
                        readNextStory();
                      }
                    } else {
                      localStorage.setItem('is_Speaking', JSON.stringify(false));
                      speak('Đã đọc xong danh sách truyện.');
                    }
                  };
                  readNextStory();
                });
              } catch (error) {
                console.error('Lỗi khi lấy danh sách truyện:', error);
                speak('Có lỗi xảy ra khi lấy danh sách truyện.');
              }
            };
            readStoryList();
            return;
          }

          // Handle remove story from library
          if (location.pathname === '/library' && transcript.startsWith('xóa truyện ')) {
            if (!localStorage.getItem('accountId')) {
              speak('Bạn cần đăng nhập để xóa truyện khỏi thư viện.');
              return;
            }

            const storyName = transcript.replace('xóa truyện ', '').trim();
            if (!storyName) {
              speak('Vui lòng cung cấp tên truyện để xóa.');
              return;
            }

            const fetchStoryByName = async () => {
              try {
                const response = await axios.get(
                  `${API_URL}/users/${localStorage.getItem('accountId')}/search-reading-story`,
                  { params: { name: storyName } }
                );

                const matchedStories = response.data;
                if (!matchedStories || matchedStories.length === 0) {
                  speak(`Không tìm thấy truyện ${storyName} trong thư viện của bạn.`);
                  return;
                }
                if (matchedStories.length > 1) {
                  speak(`Tìm thấy nhiều truyện phù hợp với tên ${storyName}. Vui lòng nói rõ hơn tên truyện.`);
                  return;
                }

                const matchedStory = matchedStories[0];
                speak(`Bạn muốn xóa truyện ${matchedStory.name} khỏi thư viện. Hãy nói 'xác nhận' trong 15 giây để tiếp tục.`);

                const originalOnResult = recog.onresult;
                recog.onresult = async (event) => {
                  const confirmationTranscript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
                  if (confirmationTranscript.includes('xác nhận')) {
                    try {
                      await axios.post(`${API_URL}/remove-from-reading-list`, {
                        accountId: localStorage.getItem('accountId'),
                        storyId: matchedStory._id,
                      });
                      speak(`Đã xóa truyện ${matchedStory.name} khỏi thư viện. Đang làm mới trang.`, () => {
                        window.location.reload();
                      });
                    } catch (error) {
                      console.error('Lỗi khi xóa truyện:', error);
                      speak('Có lỗi xảy ra khi xóa truyện. Vui lòng thử lại.');
                    }
                    recog.onresult = originalOnResult;
                  }
                };

                setTimeout(() => {
                  if (recog.onresult !== originalOnResult) {
                    speak(`Đã hủy xóa truyện ${matchedStory.name} do không nhận được xác nhận.`);
                    recog.onresult = originalOnResult;
                  }
                }, 15000);
              } catch (error) {
                console.error('Lỗi khi tìm truyện:', error);
                speak(`Không thể tìm truyện ${storyName}. Vui lòng thử lại.`);
              }
            };

            fetchStoryByName();
            return;
          }

          // Handle library stories
          if (location.pathname === '/library' && transcript.includes('đọc thông tin trang')) {
            const readLibraryStories = async () => {
              const accountId = localStorage.getItem('accountId');
              if (!accountId) {
                speak('Bạn cần đăng nhập để đọc danh sách truyện trong thư viện.');
                return;
              }

              try {
                const response = await axios.get(`${API_URL}/users/${accountId}/readingstories`);
                const stories = response.data;
                if (!stories || stories.length === 0) {
                  speak('Thư viện của bạn hiện không có truyện nào.');
                  return;
                }

                localStorage.setItem('is_Speaking', JSON.stringify(true));
                speak('Danh sách các truyện trong thư viện của bạn là:', () => {
                  let index = 0;
                  const readNextStory = () => {
                    if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                      const story = stories[index];
                      if (story.name) {
                        speak(story.name, () => {
                          index++;
                          readNextStory();
                        });
                      } else {
                        index++;
                        readNextStory();
                      }
                    } else {
                      localStorage.setItem('is_Speaking', JSON.stringify(false));
                      speak('Đã đọc xong danh sách truyện trong thư viện.');
                    }
                  };
                  readNextStory();
                });
              } catch (error) {
                console.error('Lỗi khi lấy danh sách truyện trong thư viện:', error);
                localStorage.setItem('is_Speaking', JSON.stringify(false));
                speak('Có lỗi xảy ra khi lấy danh sách truyện trong thư viện.');
              }
            };
            readLibraryStories();
            return;
          }

          // Handle age input
          if (location.pathname === '/by-age-input' && transcript.startsWith('nhập tuổi ')) {
            const ageStr = transcript.replace('nhập tuổi ', '').trim();
            const age = parseInt(ageStr, 10);

            if (isNaN(age) || age < 0) {
              speak('Vui lòng nói một số tuổi hợp lệ.');
              return;
            }

            if (setAge && setStories) {
              setAge(age.toString());
              speak(`Đã nhập tuổi ${age}. Đang tìm truyện.`);

              try {
                const response = await axios.get(`${API_URL}/statistical/by-age`, { params: { age } });
                const stories = response.data;
                setStories(stories);
                speak(`Đã tìm thấy ${stories.length} truyện phù hợp với độ tuổi ${age}.`);
              } catch (error) {
                console.error('Lỗi khi tìm truyện theo tuổi:', error);
                if (error.response?.status === 400) {
                  speak('Tuổi không hợp lệ.');
                } else {
                  speak('Có lỗi khi tìm truyện. Vui lòng thử lại.');
                }
              }
            } else {
              speak('Không thể cập nhật giao diện. Vui lòng thử lại.');
            }
            return;
          }

          // Handle navigation
          if (transcript.includes('trang chủ')) {
            speak('Đang quay lại trang chủ.', () => navigate('/'));
            return;
          } else if (transcript.includes('truyện hay nhất')) {
            speak('Đang chuyển đến danh sách truyện hot nhất.', () => navigate('/tophot'));
            return;
          } else if (transcript.includes('đến thư viện')) {
            speak('Đang chuyển đến thư viện của bạn.', () => navigate('/library'));
            return;
          } else if (transcript.includes('danh sách theo dõi')) {
            speak('Đang chuyển đến danh sách truyện bạn theo dõi.', () => navigate('/favpage'));
            return;
          } else if (transcript.includes('mở trang thanh toán')) {
            speak('Đang chuyển đến trang thanh toán.', () => navigate('/payment'));
            return;
          } else if (transcript.includes('mở thông tin người dùng')) {
            speak('Đang chuyển đến trang thông tin người dùng.', () => navigate('/userinfo'));
            return;
          } else if (transcript.startsWith('tìm ') || transcript.startsWith('mở ')) {
            const storyName = transcript.substring(4).trim();
            if (storyName) {
              speak(`Đang tìm truyện ${storyName}`, () => fetchStoryIdByName(storyName));
            } else {
              speak("Vui lòng cung cấp tên truyện sau từ 'tìm'.");
            }
            return;
          } else if (
            transcript.includes('truyện gợi ý') ||
            transcript.includes('mở truyện gợi ý') ||
            transcript.includes('xem truyện đề xuất') ||
            transcript.includes('danh sách gợi ý') ||
            transcript.includes('truyện được đề xuất')
          ) {
            speak('Đang chuyển đến danh sách truyện gợi ý.', () => navigate('/colab-recommend'));
            return;
          } else if (
            transcript.includes('truyện phù hợp với độ tuổi') ||
            transcript.includes('truyện theo độ tuổi') ||
            transcript.includes('mở truyện theo tuổi') ||
            transcript.includes('xem truyện theo độ tuổi') ||
            transcript.includes('truyện phân loại tuổi') ||
            transcript.includes('danh sách truyện theo tuổi')
          ) {
            speak('Đang chuyển đến truyện theo độ tuổi.', () => navigate('/by-age'));
            return;
          } else if (
            transcript.includes('truyện dành cho thiếu nhi') ||
            transcript.includes('truyện cho trẻ em') ||
            transcript.includes('mở truyện trẻ em') ||
            transcript.includes('xem truyện cho trẻ') ||
            transcript.includes('truyện thiếu nhi') ||
            transcript.includes('trẻ dưới 13 tuổi nên đọc truyện gì')
          ) {
            speak('Đang chuyển đến truyện dành cho trẻ em.', () => navigate('/for-kids'));
            return;
          } else if (
            transcript.includes('gợi ý truyện theo tuổi') ||
            transcript.includes('tìm truyện theo tuổi nhập') ||
            transcript.includes('truyện theo tuổi tự chọn')
          ) {
            speak('Đang chuyển đến trang nhập độ tuổi.', () => navigate('/by-age-input'));
            return;
          } else if (transcript.includes('truyện phù hợp với giới tính')) {
            speak('Đang chuyển đến truyện theo giới tính.', () => navigate('/by-gender'));
            return;
          } else if (transcript.startsWith('gợi ý truyện thể loại ')) {
            const categoryName = transcript.replace('gợi ý truyện thể loại ', '').trim();
            const fetchCategoryByName = async () => {
              try {
                const response = await axios.get(`${API_URL}/category-by-name`, { params: { name: categoryName } });
                const matchedCategory = response.data;
                speak(`Top 5 truyện hay nhất thể loại ${matchedCategory.name}`, () =>
                  navigate(`/category/${matchedCategory._id}`)
                );
              } catch (error) {
                console.error('Error fetching category by name:', error);
                speak(`Không tìm thấy thể loại ${categoryName}.`);
              }
            };
            fetchCategoryByName();
            return;
          } else if (transcript.startsWith('thể loại ') || transcript.startsWith('mở thể loại ')) {
            const genreName = transcript.replace('thể loại ', '').replace('mở thể loại ', '').trim();
            const fetchCategoryByName = async () => {
              try {
                const response = await axios.get(`${API_URL}/category-by-name`, { params: { name: genreName } });
                const matchedCategory = response.data;
                speak(`Đang mở thể loại ${matchedCategory.name}`, () =>
                  navigate(`/classifiedbygenre/${matchedCategory._id}`)
                );
              } catch (error) {
                console.error('Error fetching category by name:', error);
                speak(`Không tìm thấy thể loại ${genreName}.`);
              }
            };
            fetchCategoryByName();
            return;
          }

          // Handle story info page
          if (transcript.includes('thêm vào danh sách đọc') && location.pathname.startsWith('/storyinfo')) {
            const userId = localStorage.getItem('accountId');
            const currentStoryId = location.pathname.split('/storyinfo/')[1];

            if (!userId) {
              speak('Bạn cần đăng nhập để thêm truyện vào danh sách đọc.');
              return;
            }

            if (!currentStoryId) {
              speak('Không tìm thấy truyện để thêm vào danh sách đọc.');
              return;
            }

            const addToReadingList = async () => {
              try {
                const response = await axios.post(`${API_URL}/add-to-reading-list`, {
                  accountId: userId,
                  storyId: currentStoryId,
                });
                if (response.data.message) {
                  speak('Đã thêm truyện vào danh sách đọc thành công.');
                }
              } catch (error) {
                console.error('Error adding story to reading list:', error);
                speak('Bạn đã lưu truyện này rồi hoặc có lỗi xảy ra.');
              }
            };
            addToReadingList();
            return;
          }

          if (transcript.includes('theo dõi truyện') || transcript.includes('thêm vào danh sách theo dõi')) {
            const userId = localStorage.getItem('accountId');
            const currentStoryId = location.pathname.split('/storyinfo/')[1];

            if (!userId) {
              speak('Bạn cần đăng nhập để theo dõi truyện.');
              return;
            }

            if (!currentStoryId) {
              speak('Không tìm thấy truyện để theo dõi.');
              return;
            }

            const followStory = async () => {
              try {
                const response = await axios.post(`${API_URL}/add-to-follow-list`, {
                  accountId: userId,
                  storyId: currentStoryId,
                });
                if (response.data.message) {
                  speak('Đã theo dõi truyện thành công.');
                }
              } catch (error) {
                console.error('Lỗi khi theo dõi truyện:', error);
                speak('Bạn đã theo dõi truyện này rồi hoặc có lỗi xảy ra.');
              }
            };
            followStory();
            return;
          }

          if (location.pathname.startsWith('/storyinfo') && chapters && storyId) {
            if (transcript.includes('đọc thông tin trang')) {
              const fetchStoryInfo = async () => {
                try {
                  const response = await axios.get(`${API_URL}/stories/${storyId}`);
                  const story = response.data;

                  if (story) {
                    const storyInfo = `
                      Tên truyện: ${story.name}. 
                      Tác giả: ${story.author || 'Không rõ tác giả'}. 
                      Ngày tạo: ${new Date(story.created_at).toLocaleString('vi-VN')}. 
                      Ngày cập nhật: ${new Date(story.updated_at).toLocaleString('vi-VN')}. 
                      Trạng thái: ${story.status ? 'Đã hoàn thành' : 'Chưa hoàn thành'}. 
                      Tóm tắt: ${story.description || 'Không có tóm tắt'}.
                    `;
                    speak(storyInfo);
                  } else {
                    speak('Không tìm thấy thông tin truyện để đọc.');
                  }
                } catch (error) {
                  console.error('Lỗi khi lấy thông tin truyện:', error);
                  speak('Có lỗi xảy ra khi lấy thông tin truyện.');
                }
              };
              fetchStoryInfo();
              return;
            }
            if (transcript.includes('dừng lại')) {
              stopSpeaking();
              speak('Đã dừng đọc thông tin.');
              return;
            }
            if (transcript.includes('đọc từ đầu')) {
              speak('Đang mở chương đầu tiên...', handleReadFromStart);
              return;
            } else if (transcript.includes('chương mới nhất')) {
              speak('Đang mở chương mới nhất...', handleReadLatest);
              return;
            } else if (transcript.includes('đọc tiếp')) {
              speak('Đang tiếp tục đọc...', handleContinueReadingChapter);
              return;
            } else if (transcript.includes('tôi muốn đánh giá truyện được không')) {
              const user = localStorage.getItem('userId');
              if (!user) {
                speak('Vui lòng đăng nhập để đánh giá truyện.');
                return;
              }
              if (!storyId) {
                speak('Không tìm thấy truyện để đánh giá.');
                return;
              }
              try {
                const endpoint = `${API_URL}/checkstory/${user}/stories/${storyId}/reading-chapter`;
                console.log('Requesting endpoint:', endpoint);
                const response = await axios.get(endpoint);
                const readingData = response.data;
                console.log('Reading data response:', readingData);
                if (readingData.chapter && readingData.chapter.length > 0) {
                  speak('Bạn đã đọc truyện này. Bạn có thể đánh giá.');
                } else {
                  speak('Bạn chưa đọc truyện này. Hãy thử đọc trước rồi đánh giá sau.');
                }
              } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái đọc:', error);
                if (error.response && error.response.status === 404) {
                  speak('Bạn chưa đọc truyện này. Hãy thử đọc trước rồi đánh giá sau.');
                } else {
                  speak('Có lỗi xảy ra khi kiểm tra trạng thái đọc. Vui lòng thử lại.');
                }
              }
              return;
            } else {
              const normalizeChapterName = (text) => {
                const parts = text.split(' ').filter((part) => part);
                const chapterIndex = parts.findIndex((part) => part === 'chương');
                if (chapterIndex !== -1) {
                  const chapterNum = parts.slice(chapterIndex + 1).join(' ');
                  return `Chương ${chapterNum}`;
                }
                return text;
              };

              const chapterName = normalizeChapterName(transcript);
              const findChapter = async () => {
                try {
                  const response = await axios.get(
                    `${API_URL}/stories/${storyId}/chapters/name/${encodeURIComponent(chapterName)}`
                  );
                  const chapter = response.data;
                  speak(`Đang mở ${chapter.name}`, () => {
                    navigate(`/stories/${storyId}/chapters/${chapter._id}`);
                  });
                } catch (error) {
                  console.error('Lỗi khi tìm chapter:', error);
                  speak(`Không tìm thấy chapter có tên ${chapterName} trong truyện này.`);
                }
              };
              findChapter();
              return;
            }
          }

          // Handle chapter page
          if (chapterData && callbacks) {
            const {
              toggleDropdown,
              navigateToChapter,
              handleReadChapter,
              handleStopReading,
              handleContinueReading,
              handleReadFromBeginning,
              scrollToComment,
              setCommentText,
              handleCommentSubmit,
              updateReadingProgress,
              setComments,
              onChapterFinished,
            } = callbacks;

            const paragraphs = chapterData.chapter?.content?.split('\n').filter((p) => p.trim()) || [];
            if (currentParagraphIndexRef.current === paragraphs.length - 1 && !isSpeaking && !isChapterFinished) {
              setIsChapterFinished(true);
            }

            if (transcript.includes('chương trước') && previousIdRef.current) {
              speak('Đang chuyển đến chương trước', () => navigateToChapter(previousIdRef.current));
              return;
            } else if (transcript.includes('chương tiếp') && nextIdRef.current) {
              speak('Đang chuyển đến chương tiếp', () => navigateToChapter(nextIdRef.current));
              return;
            } else if (transcript.includes('danh sách chương')) {
              speak('Đang mở danh sách chương', toggleDropdown);
              return;
            } else if (transcript.includes('nghe truyện') && !isSpeaking) {
              speak('Đang bắt đầu nghe truyện', handleReadChapter(JSON.parse(localStorage.getItem('chapter_paragraph'))));
              return;
            } else if (transcript.includes('dừng nghe')) {
              handleStopReading();
              speak('Đã dừng nghe truyện');
              return;
            } else if (transcript.includes('tiếp tục nghe') && !isSpeaking) {
              if (currentParagraphIndexRef.current > 0) {
                handleContinueReading();
                speak('Đang tiếp tục nghe truyện');
                return;
              } else {
                speak('Bạn đang ở đầu chương. Hãy nói "nghe truyện" để bắt đầu.');
                return;
              }
            } else if (transcript.includes('đọc lại từ đầu')) {
              speak('Đang đọc lại từ đầu chương');
              handleReadFromBeginning();
              return;
            } else if (transcript.includes('bình luận truyện')) {
              speak('Đang mở khung bình luận', scrollToComment);
              return;
            } else if (transcript.startsWith('nhập ')) {
              const text = transcript.replace('nhập ', '');
              speak(`Đã nhập: ${text}`, () => {
                setCommentText(text);
                commentTextRef.current = text;
              });
              return;
            } else if (transcript.includes('đăng bình luận')) {
              submitComment();
              return;
            }
          }

          // Send to chatbot if no local command
          if (!handleCommand(transcript)) {
            try {
              const response = await axios.post(`${API_URL}/chatbot/process-voice`, { transcript });
              console.log('Backend response:', response.data);
              const { intent, parameters, confidence, message } = response.data;

              if (intent === 'unrelated') {
                speak(message || 'Ôi, cái này mình không rành lắm đâu! Bạn muốn hỏi gì về truyện không?');
                return;
              }

              if (intent === 'story_related_unknown') {
                speak(message || 'Câu hỏi này thú vị đấy! Mình sẽ hỏi người quản trị và gửi câu trả lời qua email của bạn nhé. Bạn có thể cung cấp email không?');
                return;
              }

              if (intent === 'unknown' || confidence < 0.7) {
                speak('Tôi không hiểu lệnh của bạn. Hãy thử lại.');
                return;
              }

              handleIntent(intent, parameters);
            } catch (error) {
              console.error('Lỗi xử lý lệnh qua chatbot:', error);
              speak('Có lỗi xảy ra khi xử lý lệnh. Vui lòng thử lại.');
            }
          }
        } else {
          console.log('No speech detected');
          speak('Không nhận diện được giọng nói. Hãy thử lại.');
        }
      };

      recog.onerror = (event) => {
        console.error('SpeechRecognition error:', event.error, event.message);
        speak(`Lỗi nhận diện giọng nói: ${event.error}`);
        setIsListening(false);
      };

      recog.onend = () => {
        console.log('SpeechRecognition ended');
        setIsListening(false);
        // Không gọi speak('Nhận diện giọng nói đã dừng.') để tránh lặp
      };

      recognitionRef.current = recog;

      if (callbacks && callbacks.onChapterFinished) {
        callbacks.onChapterFinished = () => {
          setIsChapterFinished(true);
        };
      }
    }
  }, [navigate, isChapterPage, chapters, storyId, chapterData, currentParagraphIndex, callbacks]);

  // Check local commands
  const handleCommand = (transcript) => {
    return (
      transcript.includes('mở tất cả gợi ý') ||
      transcript.includes('hiển thị tất cả gợi ý') ||
      transcript.includes('tất cả gợi ý') ||
      transcript.includes('mở gợi ý dựa trên nội dung') ||
      transcript.includes('hiển thị gợi ý dựa trên nội dung') ||
      transcript.includes('gợi ý nội dung') ||
      transcript.includes('mở gợi ý dựa trên người dùng') ||
      transcript.includes('hiển thị gợi ý dựa trên người dùng') ||
      transcript.includes('gợi ý người dùng') ||
      transcript.includes('gợi ý cộng tác') ||
      transcript.includes('mở gợi ý kết hợp') ||
      transcript.includes('hiển thị gợi ý kết hợp') ||
      transcript.includes('gợi ý kết hợp') ||
      transcript.includes('đọc thông tin trang') ||
      transcript.includes('đọc danh sách truyện') ||
      transcript.includes('dừng lại') ||
      transcript.startsWith('xóa truyện ') ||
      transcript.includes('truyện hay nhất') ||
      transcript.includes('đến thư viện') ||
      transcript.includes('trang chủ') ||
      transcript.includes('danh sách theo dõi') ||
      transcript.startsWith('tìm ') ||
      transcript.startsWith('mở ') ||
      transcript.startsWith('thể loại ') ||
      transcript.startsWith('mở thể loại ') ||
      transcript.includes('đọc từ đầu') ||
      transcript.includes('chương mới nhất') ||
      transcript.includes('đọc tiếp') ||
      transcript.includes('chương trước') ||
      transcript.includes('chương tiếp') ||
      transcript.includes('danh sách chương') ||
      transcript.includes('nghe truyện') ||
      transcript.includes('dừng nghe') ||
      transcript.includes('tiếp tục nghe') ||
      transcript.includes('bình luận truyện') ||
      transcript.startsWith('nhập ') ||
      transcript.includes('đăng bình luận') ||
      transcript.includes('thêm vào danh sách đọc') ||
      transcript.includes('theo dõi truyện') ||
      transcript.includes('thêm vào danh sách theo dõi') ||
      transcript.includes('truyện gợi ý') ||
      transcript.includes('truyện phù hợp với độ tuổi') ||
      transcript.includes('truyện dành cho thiếu nhi') ||
      transcript.includes('gợi ý truyện theo tuổi') ||
      transcript.includes('truyện phù hợp với giới tính') ||
      transcript.startsWith('gợi ý truyện thể loại ') ||
      transcript.includes('mở truyện gợi ý') ||
      transcript.includes('xem truyện đề xuất') ||
      transcript.includes('danh sách gợi ý') ||
      transcript.includes('truyện được đề xuất') ||
      transcript.includes('truyện theo độ tuổi') ||
      transcript.includes('mở truyện theo tuổi') ||
      transcript.includes('xem truyện theo độ tuổi') ||
      transcript.includes('truyện phân loại tuổi') ||
      transcript.includes('danh sách truyện theo tuổi') ||
      transcript.includes('truyện cho trẻ em') ||
      transcript.includes('mở truyện trẻ em') ||
      transcript.includes('xem truyện cho trẻ') ||
      transcript.includes('truyện thiếu nhi') ||
      transcript.includes('trẻ dưới 13 tuổi nên đọc truyện gì') ||
      transcript.includes('tìm truyện theo tuổi nhập') ||
      transcript.includes('truyện theo tuổi tự chọn') ||
      transcript.includes('đăng xuất') ||
      transcript.startsWith('nhập tên đăng nhập ') ||
      transcript.startsWith('nhập mật khẩu ') ||
      transcript.includes('đăng nhập') ||
      transcript.startsWith('nhập tuổi ') ||
      transcript.includes('tôi muốn đánh giá truyện được không')
    );
  };

  // Submit comment
  const submitComment = async () => {
    if (!userIdRef.current) {
      speak('Vui lòng đăng nhập để đăng bình luận');
      return;
    }
    if (!commentTextRef.current || commentTextRef.current.trim() === '') {
      speak('Vui lòng nhập nội dung bình luận');
      return;
    }
    if (!chapterIdRef.current) {
      speak('Không tìm thấy ID chương, vui lòng thử lại sau');
      console.error('chapterId không hợp lệ:', chapterIdRef.current);
      return;
    }
    try {
      await axios.post(`${API_URL}/stories/${storyId}/chapters/${chapterIdRef.current}/comments`, {
        content: commentTextRef.current,
        accountId: userIdRef.current,
      });
      speak('Bình luận đã được đăng thành công');
      callbacks.setCommentText('');
      commentTextRef.current = '';
      const response = await axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterIdRef.current}/comments`);
      callbacks.setComments(response.data.comments || []);
    } catch (error) {
      console.error('Lỗi khi đăng bình luận:', error);
      speak('Có lỗi xảy ra khi đăng bình luận');
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    localStorage.setItem('is_Speaking', JSON.stringify(false));
  };

  // Search story by name
  const fetchStoryIdByName = async (storyName) => {
    try {
      const response = await fetch(`${API_URL}/searchstory?name=${encodeURIComponent(storyName)}`);
      if (!response.ok) {
        console.log('API response not OK:', response.status);
        await speak(`Không tìm thấy truyện ${storyName}`);
        setTimeout(() => navigate('/searchresult', { state: { searchResults: [] } }), 2000);
        return;
      }
      const data = await response.json();
      console.log('API response data:', data);
      if (data.length === 0) {
        await speak(`Không tìm thấy truyện ${storyName}`);
        setTimeout(() => navigate('/searchresult', { state: { searchResults: [] } }), 2000);
        return;
      }
      if (data.length === 1) {
        await speak(`Đang chuyển đến truyện ${data[0].name}`);
        setTimeout(() => navigate(`/storyinfo/${data[0]._id}`), 3000);
      } else {
        await speak(`Đang hiển thị danh sách tìm kiếm.`);
        setTimeout(() => navigate('/searchresult', { state: { searchResults: data } }), 2000);
      }
    } catch (error) {
      console.error('Lỗi khi tìm truyện:', error);
      await speak('Lỗi khi tìm truyện, vui lòng thử lại sau.');
      setTimeout(() => navigate('/searchresult', { state: { searchResults: [] } }), 2000);
    }
  };

  // Continue reading
  const handleContinueReadingChapter = () => {
    const user = localStorage.getItem('accountId');
    if (user && storyId) {
      axios
        .get(`${API_URL}/users/${user}/stories/${storyId}/reading-chapter`)
        .then((response) => {
          const { chapter, count_row } = response.data;
          if (Array.isArray(chapter) && chapter.length > 0) {
            speak(`Đang tiếp tục chương ${chapter[0].name}`, () =>
              navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, { state: { rowCount: count_row } })
            );
          } else if (chapter && chapter._id) {
            speak(`Đang tiếp tục chương ${chapter.name}`, () =>
              navigate(`/stories/${storyId}/chapters/${chapter._id}`, { state: { rowCount: count_row } })
            );
          } else {
            speak('Không tìm thấy chương đang đọc dở.');
          }
        })
        .catch((error) => {
          console.error('Error fetching reading chapter:', error);
          speak('Lỗi khi lấy dữ liệu chương đang đọc.');
        });
    } else {
      speak('Không thể tiếp tục vì thiếu thông tin người dùng hoặc truyện.');
    }
  };

  const addToReadingList = async () => {
    const user = localStorage.getItem('accountId');
    if (!user) {
      speak('Vui lòng đăng nhập để thêm truyện vào danh sách đọc.');
      return false;
    }
    if (!storyId) {
      console.error('storyId is undefined or invalid:', storyId);
      speak('Không thể thêm truyện do thiếu thông tin truyện.');
      return false;
    }
    console.log('Adding to reading list:', { accountId: user, storyId });
    try {
      const response = await axios.post(`${API_URL}/add-to-reading-list`, {
        accountId: user,
        storyId: storyId,
      });
      console.log('Successfully added to reading list:', response.data);
      speak('Đã thêm truyện vào danh sách đọc thành công.');
      return true;
    } catch (error) {
      console.error('Error adding story to reading list:', error.response?.data || error.message);
      if (error.response && error.response.status === 400) {
        if (error.response.data.message === 'Story already in reading list.') {
          console.log('Story already in reading list, proceeding.');
          return true;
        }
        speak(`Lỗi: ${error.response.data.message || 'Dữ liệu không hợp lệ.'}`);
      } else {
        speak('Không thể thêm truyện vào danh sách đọc do lỗi hệ thống. Vui lòng thử lại sau.');
      }
      return false;
    }
  };

  // Read from start
  const handleReadFromStart = async ()  => {
    const user = localStorage.getItem('accountId');
    if (user) {
      await addToReadingList();
    }
    axios
      .get(`${API_URL}/stories/${storyId}/first?accountId=${user || ''}`)
      .then((response) => {
        const { firstChapter, enableChapter } = response.data;
        if (enableChapter && firstChapter && firstChapter._id) {
          speak(`Đang mở chương đầu tiên: ${firstChapter.name}`, () =>
            navigate(`/stories/${storyId}/chapters/${firstChapter._id}`)
          );
        } else {
          speak('Bạn cần VIP để đọc chương này hoặc không tìm thấy chương đầu tiên.');
        }
      })
      .catch((error) => {
        console.error('Error fetching first chapter:', error);
        speak('Lỗi khi lấy chương đầu tiên.');
      });
  };

  
  // Read latest chapter
  const handleReadLatest = async ()  => {
    const user = localStorage.getItem('accountId');
    if (user) {
      await addToReadingList();
    }
    axios
      .get(`${API_URL}/stories/${storyId}/latest?accountId=${user || ''}`)
      .then((response) => {
        const { latestChapter, enableChapter } = response.data;
        if (enableChapter) {
          speak(`Đang mở chương mới nhất: ${latestChapter.name}`, () =>
            navigate(`/stories/${storyId}/chapters/${latestChapter._id}`)
          );
        } else {
          speak('Bạn cần VIP để đọc chương này.');
        }
      })
      .catch((error) => {
        speak('Lỗi khi lấy chương mới nhất.');
      });
  };

  // Handle chatbot intents
  const handleIntent = async (intent, parameters) => {
    const {
      toggleDropdown,
      navigateToChapter,
      handleReadChapter,
      handleStopReading,
      handleContinueReading,
      handleReadFromBeginning,
      scrollToComment,
      setCommentText,
      setComments,
    } = callbacks || {};

    switch (intent) {
      case 'navigate_home':
        speak('Đang quay lại trang chủ.', () => navigate('/'));
        break;
      case 'navigate_library':
        speak('Đang chuyển đến thư viện của bạn.', () => navigate('/library'));
        break;
      case 'navigate_tophot':
        speak('Đang chuyển đến danh sách truyện hot nhất.', () => navigate('/tophot'));
        break;
      case 'navigate_favpage':
        speak('Đang chuyển đến danh sách truyện bạn theo dõi.', () => navigate('/favpage'));
        break;
      case 'navigate_recommend':
        speak('Đang chuyển đến danh sách truyện gợi ý.', () => navigate('/colab-recommend'));
        break;
      case 'navigate_by_age':
        speak('Đang chuyển đến truyện theo độ tuổi.', () => navigate('/by-age'));
        break;
      case 'navigate_for_kids':
        speak('Đang chuyển đến truyện dành cho trẻ em.', () => navigate('/for-kids'));
        break;
      case 'navigate_by_age_input':
        if (parameters.age) {
          const age = parseInt(parameters.age, 10);
          if (isNaN(age) || age < 0) {
            speak('Vui lòng nói một số tuổi hợp lệ.');
            return;
          }
          if (setAge && setStories) {
            setAge(age.toString());
            speak(`Đã nhập tuổi ${age}. Đang tìm truyện.`);
            try {
              const response = await axios.get(`${API_URL}/statistical/by-age`, { params: { age } });
              setStories(response.data);
              speak(`Đã tìm thấy ${response.data.length} truyện phù hợp với độ tuổi ${age}.`);
            } catch (error) {
              speak('Có lỗi khi tìm truyện. Vui lòng thử lại.');
            }
          }
        } else {
          speak('Đang chuyển đến trang nhập độ tuổi.', () => navigate('/by-age-input'));
        }
        break;
      case 'navigate_by_gender':
        speak('Đang chuyển đến truyện theo giới tính.', () => navigate('/by-gender'));
        break;
      case 'navigate_genre':
        if (parameters.genre) {
          try {
            const response = await axios.get(`${API_URL}/category-by-name`, { params: { name: parameters.genre } });
            const matchedCategory = response.data;
            speak(`Đang mở thể loại ${matchedCategory.name}`, () =>
              navigate(`/classifiedbygenre/${matchedCategory._id}`)
            );
          } catch (error) {
            speak(`Không tìm thấy thể loại ${parameters.genre}.`);
          }
        } else {
          speak('Vui lòng cung cấp tên thể loại.');
        }
        break;
      case 'search_story':
        if (parameters.storyName) {
          speak(`Đang tìm truyện ${parameters.storyName}`, () => fetchStoryIdByName(parameters.storyName));
        } else {
          speak('Vui lòng cung cấp tên truyện.');
        }
        break;
      case 'add_to_reading_list':
        if (location.pathname.startsWith('/storyinfo')) {
          const userId = localStorage.getItem('accountId');
          const currentStoryId = location.pathname.split('/storyinfo/')[1];
          if (!userId) {
            speak('Bạn cần đăng nhập để thêm truyện vào danh sách đọc.');
            return;
          }
          try {
            const response = await axios.post(`${API_URL}/add-to-reading-list`, {
              accountId: userId,
              storyId: currentStoryId,
            });
            speak('Đã thêm truyện vào danh sách đọc thành công.');
          } catch (error) {
            speak('Bạn đã lưu truyện này rồi hoặc có lỗi xảy ra.');
          }
        }
        break;
      case 'follow_story':
        if (location.pathname.startsWith('/storyinfo')) {
          const userId = localStorage.getItem('accountId');
          const currentStoryId = location.pathname.split('/storyinfo/')[1];
          if (!userId) {
            speak('Bạn cần đăng nhập để theo dõi truyện.');
            return;
          }
          try {
            const response = await axios.post(`${API_URL}/add-to-follow-list`, {
              accountId: userId,
              storyId: currentStoryId,
            });
            speak('Đã theo dõi truyện thành công.');
          } catch (error) {
            speak('Bạn đã theo dõi truyện này rồi hoặc có lỗi xảy ra.');
          }
        }
        break;
      case 'read_page_info':
        if (location.pathname.startsWith('/storyinfo') && storyId) {
          try {
            const response = await axios.get(`${API_URL}/stories/${storyId}`);
            const story = response.data;
            const storyInfo = `
              Tên truyện: ${story.name}. 
              Tác giả: ${story.author || 'Không rõ tác giả'}. 
              Ngày tạo: ${new Date(story.created_at).toLocaleString('vi-VN')}. 
              Ngày cập nhật: ${new Date(story.updated_at).toLocaleString('vi-VN')}. 
              Trạng thái: ${story.status ? 'Đã hoàn thành' : 'Chưa hoàn thành'}. 
              Tóm tắt: ${story.description || 'Không có tóm tắt'}.
            `;
            speak(storyInfo);
          } catch (error) {
            speak('Có lỗi xảy ra khi lấy thông tin truyện.');
          }
        } else if (location.pathname === '/library') {
          const accountId = localStorage.getItem('accountId');
          if (!accountId) {
            speak('Bạn cần đăng nhập để đọc danh sách truyện trong thư viện.');
            return;
          }
          try {
            const response = await axios.get(`${API_URL}/users/${accountId}/readingstories`);
            const stories = response.data;
            if (!stories || stories.length === 0) {
              speak('Thư viện của bạn hiện không có truyện nào.');
              return;
            }
            localStorage.setItem('is_Speaking', JSON.stringify(true));
            speak('Danh sách các truyện trong thư viện của bạn là:', () => {
              let index = 0;
              const readNextStory = () => {
                if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                  const story = stories[index];
                  speak(story.name, () => {
                    index++;
                    readNextStory();
                  });
                } else {
                  localStorage.setItem('is_Speaking', JSON.stringify(false));
                  speak('Đã đọc xong danh sách truyện trong thư viện.');
                }
              };
              readNextStory();
            });
          } catch (error) {
            speak('Có lỗi xảy ra khi lấy danh sách truyện trong thư viện.');
          }
        } else if (location.pathname === '/') {
          try {
            const response = await axios.get(`${API_URL}/stories`);
            const stories = response.data;
            if (!stories || stories.length === 0) {
              speak('Hiện tại không có truyện nào trong danh sách.');
              return;
            }
            localStorage.setItem('is_Speaking', JSON.stringify(true));
            speak('Danh sách các truyện hiện có là:', () => {
              let index = 0;
              const readNextStory = () => {
                if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                  const story = stories[index];
                  speak(story.name, () => {
                    index++;
                    readNextStory();
                  });
                } else {
                  localStorage.setItem('is_Speaking', JSON.stringify(false));
                  speak('Đã đọc xong danh sách truyện.');
                }
              };
              readNextStory();
            });
          } catch (error) {
            speak('Có lỗi xảy ra khi lấy danh sách truyện.');
          }
        }
        break;
      case 'read_story_list':
        if (location.pathname === '/library') {
          const accountId = localStorage.getItem('accountId');
          if (!accountId) {
            speak('Bạn cần đăng nhập để đọc danh sách truyện trong thư viện.');
            return;
          }
          try {
            const response = await axios.get(`${API_URL}/users/${accountId}/readingstories`);
            const stories = response.data;
            if (!stories || stories.length === 0) {
              speak('Thư viện của bạn hiện không có truyện nào.');
              return;
            }
            localStorage.setItem('is_Speaking', JSON.stringify(true));
            speak('Danh sách các truyện trong thư viện của bạn là:', () => {
              let index = 0;
              const readNextStory = () => {
                if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                  const story = stories[index];
                  speak(story.name, () => {
                    index++;
                    readNextStory();
                  });
                } else {
                  localStorage.setItem('is_Speaking', JSON.stringify(false));
                  speak('Đã đọc xong danh sách truyện trong thư viện.');
                }
              };
              readNextStory();
            });
          } catch (error) {
            speak('Có lỗi xảy ra khi lấy danh sách truyện trong thư viện.');
          }
        } else if (location.pathname === '/') {
          try {
            const response = await axios.get(`${API_URL}/stories`);
            const stories = response.data;
            if (!stories || stories.length === 0) {
              speak('Hiện tại không có truyện nào trong danh sách.');
              return;
            }
            localStorage.setItem('is_Speaking', JSON.stringify(true));
            speak('Danh sách các truyện hiện có là:', () => {
              let index = 0;
              const readNextStory = () => {
                if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                  const story = stories[index];
                  speak(story.name, () => {
                    index++;
                    readNextStory();
                  });
                } else {
                  localStorage.setItem('is_Speaking', JSON.stringify(false));
                  speak('Đã đọc xong danh sách truyện.');
                }
              };
              readNextStory();
            });
          } catch (error) {
            speak('Có lỗi xảy ra khi lấy danh sách truyện.');
          }
        }
        break;
      case 'remove_from_library':
        if (location.pathname === '/library' && parameters.storyName) {
          const accountId = localStorage.getItem('accountId');
          if (!accountId) {
            speak('Bạn cần đăng nhập để xóa truyện khỏi thư viện.');
            return;
          }
          try {
            const response = await axios.get(
              `${API_URL}/users/${accountId}/search-reading-story`,
              { params: { name: parameters.storyName } }
            );
            const matchedStories = response.data;
            if (!matchedStories || matchedStories.length === 0) {
              speak(`Không tìm thấy truyện ${parameters.storyName} trong thư viện của bạn.`);
              return;
            }
            if (matchedStories.length > 1) {
              speak(`Tìm thấy nhiều truyện phù hợp với tên ${parameters.storyName}. Vui lòng nói rõ hơn tên truyện.`);
              return;
            }
            const matchedStory = matchedStories[0];
            speak(`Bạn muốn xóa truyện ${matchedStory.name} khỏi thư viện. Hãy nói 'xác nhận' trong 15 giây để tiếp tục.`);
            recognitionRef.current.onresult = async (event) => {
              const confirmationTranscript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
              if (confirmationTranscript.includes('xác nhận')) {
                try {
                  await axios.post(`${API_URL}/remove-from-reading-list`, {
                    accountId,
                    storyId: matchedStory._id,
                  });
                  speak(`Đã xóa truyện ${matchedStory.name} khỏi thư viện. Đang làm mới trang.`, () => {
                    window.location.reload();
                  });
                } catch (error) {
                  speak('Có lỗi xảy ra khi xóa truyện. Vui lòng thử lại.');
                }
              }
            };
            setTimeout(() => {
              speak(`Đã hủy xóa truyện ${matchedStory.name} do không nhận được xác nhận.`);
              recognitionRef.current.onresult = null;
            }, 15000);
          } catch (error) {
            speak(`Không thể tìm truyện ${parameters.storyName}. Vui lòng thử lại.`);
          }
        }
        break;
      case 'logout':
        const userId = localStorage.getItem('accountId');
        if (!userId) {
          speak('Bạn chưa đăng nhập.');
          return;
        }
        speak("Bạn muốn đăng xuất? Hãy nói 'xác nhận' trong 10 giây để tiếp tục.");
        recognitionRef.current.onresult = async (event) => {
          const confirmationTranscript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
          if (confirmationTranscript.includes('xác nhận')) {
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            localStorage.removeItem('accountId');
            localStorage.removeItem('vipExpiredNotificationShown');
            navigate('/login');
          }
        };
        setTimeout(() => {
          speak('Đã hủy đăng xuất do không nhận được xác nhận.');
          recognitionRef.current.onresult = null;
        }, 20000);
        break;
      case 'read_from_start':
        if (storyId) {
          const user = localStorage.getItem('accountId');
          try {
            const response = await axios.get(`${API_URL}/stories/${storyId}/first?accountId=${user || ''}`);
            const { firstChapter, enableChapter } = response.data;
            if (enableChapter && firstChapter && firstChapter._id) {
              speak(`Đang mở chương đầu tiên: ${firstChapter.name}`, () =>
                navigate(`/stories/${storyId}/chapters/${firstChapter._id}`)
              );
            } else {
              speak('Bạn cần VIP để đọc chương này hoặc không tìm thấy chương đầu tiên.');
            }
          } catch (error) {
            speak('Lỗi khi lấy chương đầu tiên.');
          }
        }
        break;
      case 'read_latest':
        if (storyId) {
          const user = localStorage.getItem('accountId');
          try {
            const response = await axios.get(`${API_URL}/stories/${storyId}/latest?accountId=${user || ''}`);
            const { latestChapter, enableChapter } = response.data;
            if (enableChapter) {
              speak(`Đang mở chương mới nhất: ${latestChapter.name}`, () =>
                navigate(`/stories/${storyId}/chapters/${latestChapter._id}`)
              );
            } else {
              speak('Bạn cần VIP để đọc chương này.');
            }
          } catch (error) {
            speak('Lỗi khi lấy chương mới nhất.');
          }
        }
        break;
      case 'continue_reading':
        if (storyId) {
          const user = localStorage.getItem('accountId');
          try {
            const response = await axios.get(`${API_URL}/users/${user}/stories/${storyId}/reading-chapter`);
            const { chapter, count_row } = response.data;
            if (Array.isArray(chapter) && chapter.length > 0) {
              speak(`Đang tiếp tục chương ${chapter[0].name}`, () =>
                navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, { state: { rowCount: count_row } })
              );
            } else if (chapter && chapter._id) {
              speak(`Đang tiếp tục chương ${chapter.name}`, () =>
                navigate(`/stories/${storyId}/chapters/${chapter._id}`, { state: { rowCount: count_row } })
              );
            } else {
              speak('Không tìm thấy chương đang đọc dở.');
            }
          } catch (error) {
            speak('Lỗi khi lấy dữ liệu chương đang đọc.');
          }
        }
        break;
      case 'previous_chapter':
        if (previousIdRef.current) {
          speak('Đang chuyển đến chương trước', () => navigateToChapter(previousIdRef.current));
        }
        break;
      case 'next_chapter':
        if (nextIdRef.current) {
          speak('Đang chuyển đến chương tiếp', () => navigateToChapter(nextIdRef.current));
        }
        break;
      case 'chapter_list':
        speak('Đang mở danh sách chương', toggleDropdown);
        break;
      case 'read_chapter':
        if (!isSpeaking) {
          speak('Đang bắt đầu nghe truyện', handleReadChapter(JSON.parse(localStorage.getItem('chapter_paragraph'))));
        }
        break;
      case 'stop_reading':
        handleStopReading();
        speak('Đã dừng nghe truyện');
        break;
      case 'continue_reading_chapter':
        if (currentParagraphIndexRef.current > 0) {
          handleContinueReading();
          speak('Đang tiếp tục nghe truyện');
        } else {
          speak('Bạn đang ở đầu chương. Hãy nói "nghe truyện" để bắt đầu.');
        }
        break;
      case 'comment':
        speak('Đang mở khung bình luận', scrollToComment);
        break;
      case 'input_comment':
        if (parameters.comment) {
          speak(`Đã nhập: ${parameters.comment}`, () => {
            setCommentText(parameters.comment);
            commentTextRef.current = parameters.comment;
          });
        }
        break;
      case 'submit_comment':
        if (!userIdRef.current) {
          speak('Vui lòng đăng nhập để đăng bình luận');
          return;
        }
        if (!commentTextRef.current || commentTextRef.current.trim() === '') {
          speak('Vui lòng nhập nội dung bình luận');
          return;
        }
        if (!chapterIdRef.current) {
          speak('Không tìm thấy ID chương, vui lòng thử lại sau');
          return;
        }
        try {
          await axios.post(`${API_URL}/stories/${storyId}/chapters/${chapterIdRef.current}/comments`, {
            content: commentTextRef.current,
            accountId: userIdRef.current,
          });
          speak('Bình luận đã được đăng thành công');
          setCommentText('');
          commentTextRef.current = '';
          const response = await axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterIdRef.current}/comments`);
          setComments(response.data.comments || []);
        } catch (error) {
          speak('Có lỗi xảy ra khi đăng bình luận');
        }
        break;
      default:
        speak('Lệnh không được hỗ trợ. Vui lòng thử lại.');
    }
  };

  return {
    isListening,
    setIsListening,
    recognition: recognitionRef.current,
    speak,
    stopSpeaking,
  };
};

export default useVoiceControl;