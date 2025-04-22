import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../env";

const useVoiceControl = ({ chapters, storyId, chapterData, currentParagraphIndex, callbacks, nextId, previousId, userId, commentText, chapterId, setAge, fetchStories, setStories }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const isChapterPage = location.pathname.includes('/chapters');
  const [categories, setCategories] = useState([]);
  const userIdRef = useRef(userId);
  const nextIdRef = useRef(nextId);
  const previousIdRef = useRef(previousId);
  const commentTextRef = useRef(commentText);
  const chapterIdRef = useRef(chapterId);
  const currentParagraphIndexRef = useRef(currentParagraphIndex);
  const isChapterFinishedRef = useRef(false);
  const isAskingForRatingRef = useRef(false);
  const isWaitingForRatingRef = useRef(false);

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
  };

  // Thông báo khi chuyển trang
  const lastSpokenPathRef = useRef(null);

  useEffect(() => {
    let timeoutId;

    const getPageName = () => {
      if (location.pathname.startsWith('/storyinfo/')) {
        return 'thông tin truyện';
      } else if (location.pathname.startsWith('/stories/') && location.pathname.includes('/chapters/')) {
        return 'nội dung chương';
      } else if (location.pathname.startsWith('/classifiedbygenre/')) {
        return 'truyện theo thể loại';
      } else if (location.pathname.startsWith('/category/')) {
        return 'truyện theo danh mục';
      } else if (location.pathname.startsWith('/classifiedbychapter?')) {
        return 'truyện theo tổng chương';
      } else {
        return pageNameMap[location.pathname] || 'trang không xác định';
      }
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

  useEffect(() => {
    nextIdRef.current = nextId;
    previousIdRef.current = previousId;
    userIdRef.current = userId;
    commentTextRef.current = commentText;
    chapterIdRef.current = chapterId;
    currentParagraphIndexRef.current = currentParagraphIndex;
    console.log("Props cập nhật - previousId:", previousId, "nextId:", nextId, "chapterId:", chapterId);
  }, [nextId, previousId, userId, commentText, chapterId, currentParagraphIndex]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data);
        console.log('Categories loaded:', response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        speak("Không thể tải danh sách thể loại.");
      }
    };
    fetchCategories();
  }, []);

  // Hỏi đánh giá sau khi chapter hoàn tất
  useEffect(() => {
    if (isChapterFinishedRef.current && !isAskingForRatingRef.current) {
      isAskingForRatingRef.current = true;
      speak('Bạn có muốn đánh giá truyện này không? Hãy nói "có" hoặc "không".');
      setTimeout(() => {
        if (isAskingForRatingRef.current) {
          speak('Bạn đã không trả lời. Cảm ơn bạn đã đọc truyện!');
          isAskingForRatingRef.current = false;
          isChapterFinishedRef.current = false;
        }
      }, 20000);
    }
  }, [isChapterFinishedRef.current]);

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log('Trình duyệt không hỗ trợ SpeechRecognition');
      speak("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    if (!recognitionRef.current) {
      const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recog.lang = 'vi-VN';
      recog.continuous = true;
      recog.interimResults = false;

      recog.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log('VoiceControl nghe được:', transcript);
        const isSpeaking = JSON.parse(localStorage.getItem('is_Speaking')) || false;
        const currentParagraphIndex = JSON.parse(localStorage.getItem('currentParagraphIndex')) || 0;

        // Xử lý khi đang hỏi về đánh giá (trang ViewChapter)
        if (isAskingForRatingRef.current) {
          if (transcript === 'có' || transcript === 'không') {
            if (callbacks.onRatingDecision) {
              callbacks.onRatingDecision(transcript);
              isAskingForRatingRef.current = false;
              if (transcript === 'có') {
                isWaitingForRatingRef.current = true;
              }
            }
          } else {
            speak('Vui lòng nói "có" hoặc "không".');
          }
          return;
        }

        // Xử lý lệnh đăng xuất
        if (transcript.includes('đăng xuất')) {
          const userId = localStorage.getItem('accountId');
          if (!userId) {
            speak("Bạn chưa đăng nhập.");
            return;
          }
          speak("Bạn muốn đăng xuất? Hãy nói 'xác nhận' trong 10 giây để tiếp tục.");
          const originalOnResult = recognitionRef.current.onresult;

          recognitionRef.current.onresult = (event) => {
            const confirmationTranscript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            if (confirmationTranscript.includes('xác nhận')) {
              localStorage.removeItem("username");
              localStorage.removeItem("userID"); // Sửa từ accountId thành userID
              localStorage.removeItem("vipExpiredNotificationShown");
              navigate("/login");
              recognitionRef.current.onresult = originalOnResult;
            }
          };

          setTimeout(() => {
            if (recognitionRef.current.onresult !== originalOnResult) {
              speak("Đã hủy đăng xuất do không nhận được xác nhận.");
              recognitionRef.current.onresult = originalOnResult;
            }
          }, 20000);
          return;
        }
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

        if (location.pathname === '/colab-recommend') {
          if (
            transcript.includes('mở tất cả gợi ý') ||
            transcript.includes('hiển thị tất cả gợi ý') ||
            transcript.includes('tất cả gợi ý')
          ) {
            if (callbacks.setSelectedRecommendation) {
              callbacks.setSelectedRecommendation('all');
              callbacks.speak('Đang hiển thị tất cả gợi ý.');
            }
            return;
          } else if (
            transcript.includes('mở gợi ý dựa trên nội dung') ||
            transcript.includes('hiển thị gợi ý dựa trên nội dung') ||
            transcript.includes('gợi ý nội dung')
          ) {
            if (callbacks.setSelectedRecommendation) {
              callbacks.setSelectedRecommendation('contentBased');
              callbacks.speak('Đang hiển thị gợi ý dựa trên nội dung.');
            }
            return;
          } else if (
            transcript.includes('mở gợi ý dựa trên người dùng') ||
            transcript.includes('hiển thị gợi ý dựa trên người dùng') ||
            transcript.includes('gợi ý người dùng') ||
            transcript.includes('gợi ý cộng tác')
          ) {
            if (callbacks.setSelectedRecommendation) {
              callbacks.setSelectedRecommendation('collaborative');
              callbacks.speak('Đang hiển thị gợi ý dựa trên người dùng tương tự.');
            }
            return;
          } else if (
            transcript.includes('mở gợi ý kết hợp') ||
            transcript.includes('hiển thị gợi ý kết hợp') ||
            transcript.includes('gợi ý kết hợp')
          ) {
            if (callbacks.setSelectedRecommendation) {
              callbacks.setSelectedRecommendation('hybrid');
              callbacks.speak('Đang hiển thị gợi ý kết hợp.');
            }
            return;
          }
        }

        if (location.pathname === '/' && transcript.includes('đọc danh sách truyện')) {
          const readStoryList = async () => {
            try {
              const response = await axios.get(`${API_URL}/stories`);
              const stories = response.data;
              console.log("Dữ liệu truyện nhận được:", stories);

              if (!stories || stories.length === 0) {
                speak("Hiện tại không có truyện nào trong danh sách.");
                return;
              }

              localStorage.setItem('is_Speaking', JSON.stringify(true));
              speak("Danh sách các truyện hiện có là:", () => {
                let index = 0;
                const readNextStory = () => {
                  if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                    const story = stories[index];
                    if (story.name) {
                      speak(story.name, () => {
                        console.log(`Đã đọc truyện: ${story.name}`);
                        index++;
                        readNextStory();
                      });
                    } else {
                      console.warn(`Truyện tại index ${index} không có tên:`, story);
                      index++;
                      readNextStory();
                    }
                  } else {
                    localStorage.setItem('is_Speaking', JSON.stringify(false));
                    console.log("Hoàn thành đọc danh sách truyện.");
                    speak("Đã đọc xong danh sách truyện.");
                  }
                };
                readNextStory();
              });
            } catch (error) {
              console.error('Lỗi khi lấy danh sách truyện:', error);
              speak("Có lỗi xảy ra khi lấy danh sách truyện.");
            }
          };
          readStoryList();
          return;
        }

        if (location.pathname === '/library' && transcript.startsWith('xóa truyện ')) {
          if (!localStorage.getItem('accountId')) {
            speak("Bạn cần đăng nhập để xóa truyện khỏi thư viện.");
            return;
          }

          const storyName = transcript.replace('xóa truyện ', '').trim();
          if (!storyName) {
            speak("Vui lòng cung cấp tên truyện để xóa.");
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

              const originalOnResult = recognitionRef.current.onresult;

              recognitionRef.current.onresult = (event) => {
                const confirmationTranscript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
                if (confirmationTranscript.includes('xác nhận')) {
                  axios
                    .post(`${API_URL}/remove-from-reading-list`, {
                      accountId: localStorage.getItem('accountId'),
                      storyId: matchedStory._id,
                    })
                    .then((response) => {
                      if (response.data.message) {
                        speak(`Đã xóa truyện ${matchedStory.name} khỏi thư viện. Đang làm mới trang.`, () => {
                          window.location.reload();
                        });
                      }
                    })
                    .catch((error) => {
                      console.error('Lỗi khi xóa truyện:', error);
                      speak("Có lỗi xảy ra khi xóa truyện. Vui lòng thử lại.");
                    })
                    .finally(() => {
                      recognitionRef.current.onresult = originalOnResult;
                    });
                }
              };

              setTimeout(() => {
                if (recognitionRef.current.onresult !== originalOnResult) {
                  speak(`Đã hủy xóa truyện ${matchedStory.name} do không nhận được xác nhận.`);
                  recognitionRef.current.onresult = originalOnResult;
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

        if (location.pathname === '/library' && transcript.includes('đọc thông tin trang')) {
          const readLibraryStories = async () => {
            const accountId = localStorage.getItem('accountId');
            if (!accountId) {
              speak("Bạn cần đăng nhập để đọc danh sách truyện trong thư viện.");
              return;
            }

            try {
              const response = await axios.get(`${API_URL}/users/${accountId}/readingstories`);
              const stories = response.data;
              console.log("Dữ liệu truyện trong thư viện:", stories);

              if (!stories || stories.length === 0) {
                speak("Thư viện của bạn hiện không có truyện nào.");
                return;
              }

              localStorage.setItem('is_Speaking', JSON.stringify(true));
              speak("Danh sách các truyện trong thư viện của bạn là:", () => {
                let index = 0;
                const readNextStory = () => {
                  if (index < stories.length && JSON.parse(localStorage.getItem('is_Speaking'))) {
                    const story = stories[index];
                    if (story.name) {
                      speak(story.name, () => {
                        console.log(`Đã đọc truyện: ${story.name}`);
                        index++;
                        readNextStory();
                      });
                    } else {
                      console.warn(`Truyện tại index ${index} không có tên:`, story);
                      index++;
                      readNextStory();
                    }
                  } else {
                    localStorage.setItem('is_Speaking', JSON.stringify(false));
                    console.log("Hoàn thành đọc danh sách truyện trong thư viện.");
                    speak("Đã đọc xong danh sách truyện trong thư viện.");
                  }
                };
                readNextStory();
              });
            } catch (error) {
              console.error('Lỗi khi lấy danh sách truyện trong thư viện:', error);
              localStorage.setItem('is_Speaking', JSON.stringify(false));
              speak("Có lỗi xảy ra khi lấy danh sách truyện trong thư viện.");
            }
          };
          readLibraryStories();
          return;
        }

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

            axios
              .get(`${API_URL}/statistical/by-age`, {
                params: { age },
              })
              .then((response) => {
                const stories = response.data;
                console.log('API trả về danh sách truyện:', stories);
                setStories(stories);
                speak(`Đã tìm thấy ${stories.length} truyện phù hợp với độ tuổi ${age}.`);
              })
              .catch((error) => {
                console.error('Lỗi khi tìm truyện theo tuổi:', error);
                if (error.response?.status === 400) {
                  speak('Tuổi không hợp lệ.');
                } else {
                  speak('Có lỗi khi tìm truyện. Vui lòng thử lại.');
                }
              });
          } else {
            speak('Không thể cập nhật giao diện. Vui lòng thử lại.');
          }
          return;
        }

        if (transcript.includes('trang chủ')) {
          speak("Đang quay lại trang chủ.", () => navigate('/'));
          return;
        } else if (transcript.includes('truyện hay nhất')) {
          speak("Đang chuyển đến danh sách truyện hot nhất.", () => navigate('/tophot'));
          return;
        } else if (transcript.includes('đến thư viện')) {
          speak("Đang chuyển đến thư viện của bạn.", () => navigate('/library'));
          return;
        } else if (transcript.includes('danh sách theo dõi')) {
          speak("Đang chuyển đến danh sách truyện bạn theo dõi.", () => navigate('/favpage'));
          return;
        } else if (transcript.startsWith('tìm ') || transcript.startsWith('mở ')) {
          const storyName = transcript.substring(4).trim();
          if (storyName) {
            speak(`Đang tìm truyện ${storyName}`, () => fetchStoryIdByName(storyName));
          } else {
            speak("Vui lòng cung cấp tên truyện sau từ 'tìm'.");
          }
          return;
        } else if ((
          transcript.includes('truyện gợi ý') ||
          transcript.includes('mở truyện gợi ý') ||
          transcript.includes('xem truyện đề xuất') ||
          transcript.includes('danh sách gợi ý') ||
          transcript.includes('truyện được đề xuất')
        )) {
          speak("Đang chuyển đến danh sách truyện gợi ý.", () => navigate('/colab-recommend'));
          return;
        } else if ((
          transcript.includes('truyện phù hợp với độ tuổi') ||
          transcript.includes('truyện theo độ tuổi') ||
          transcript.includes('mở truyện theo tuổi') ||
          transcript.includes('xem truyện theo độ tuổi') ||
          transcript.includes('truyện phân loại tuổi') ||
          transcript.includes('danh sách truyện theo tuổi')
        )) {
          speak("Đang chuyển đến truyện theo độ tuổi.", () => navigate('/by-age'));
          return;
        } else if ((
          transcript.includes('truyện dành cho thiếu nhi') ||
          transcript.includes('truyện cho trẻ em') ||
          transcript.includes('mở truyện trẻ em') ||
          transcript.includes('xem truyện cho trẻ') ||
          transcript.includes('truyện thiếu nhi') ||
          transcript.includes('trẻ dưới 13 tuổi nên đọc truyện gì')
        )) {
          speak("Đang chuyển đến truyện dành cho trẻ em.", () => navigate('/for-kids'));
          return;
        } else if ((
          transcript.includes('gợi ý truyện theo tuổi') ||
          transcript.includes('tìm truyện theo tuổi nhập') ||
          transcript.includes('truyện theo tuổi tự chọn'))) {
          speak("Đang chuyển đến trang nhập độ tuổi.", () => navigate('/by-age-input'));
          return;
        } else if (transcript.includes('truyện phù hợp với giới tính')) {
          speak("Đang chuyển đến truyện theo giới tính.", () => navigate('/by-gender'));
          return;
        } else if (transcript.startsWith('gợi ý truyện thể loại ')) {
          const categoryName = transcript.replace('gợi ý truyện thể loại ', '').trim();
          const fetchCategoryByName = async () => {
            try {
              const response = await axios.get(`${API_URL}/category-by-name`, {
                params: { name: categoryName }
              });
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
        }

        if (transcript.startsWith('thể loại ') || transcript.startsWith('mở thể loại ')) {
          const genreName = transcript.replace('thể loại ', '').replace('mở thể loại ', '').trim();
          console.log('GenreName:', genreName);

          const fetchCategoryByName = async () => {
            try {
              const response = await axios.get(`${API_URL}/category-by-name`, {
                params: { name: genreName }
              });
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

        if (transcript.includes('thêm vào danh sách đọc') && location.pathname.startsWith('/storyinfo')) {
          const userId = localStorage.getItem("accountId");
          const currentStoryId = location.pathname.split('/storyinfo/')[1];

          if (!userId) {
            speak("Bạn cần đăng nhập để thêm truyện vào danh sách đọc.");
            return;
          }

          if (!currentStoryId) {
            speak("Không tìm thấy truyện để thêm vào danh sách đọc.");
            return;
          }

          const addToReadingList = async () => {
            try {
              const response = await axios.post(`${API_URL}/add-to-reading-list`, {
                accountId: userId,
                storyId: currentStoryId,
              });
              if (response.data.message) {
                speak("Đã thêm truyện vào danh sách đọc thành công.");
              }
            } catch (error) {
              console.error('Error adding story to reading list:', error);
              speak("Bạn đã lưu truyện này rồi hoặc có lỗi xảy ra.");
            }
          };
          addToReadingList();
          return;
        }

        if (transcript.includes('theo dõi truyện') || transcript.includes('thêm vào danh sách theo dõi')) {
          const userId = localStorage.getItem("accountId");
          const currentStoryId = location.pathname.split('/storyinfo/')[1];

          if (!userId) {
            speak("Bạn cần đăng nhập để theo dõi truyện.");
            return;
          }

          if (!currentStoryId) {
            speak("Không tìm thấy truyện để theo dõi.");
            return;
          }

          const followStory = async () => {
            try {
              const response = await axios.post(`${API_URL}/add-to-follow-list`, {
                accountId: userId,
                storyId: currentStoryId,
              });
              if (response.data.message) {
                speak("Đã theo dõi truyện thành công.");
              }
            } catch (error) {
              console.error('Lỗi khi theo dõi truyện:', error);
              speak("Bạn đã theo dõi truyện này rồi hoặc có lỗi xảy ra.");
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
                  speak("Không tìm thấy thông tin truyện để đọc.");
                }
              } catch (error) {
                console.error('Lỗi khi lấy thông tin truyện:', error);
                speak("Có lỗi xảy ra khi lấy thông tin truyện.");
              }
            };
            fetchStoryInfo();
            return;
          }

          // Xử lý lệnh "đánh giá XX sao"
          const ratingMatch = transcript.match(/^đánh giá (\d+)\s*sao$/);
          const userId = localStorage.getItem('userId');
          if (ratingMatch) {
            const rating = parseInt(ratingMatch[1], 10);
            if (rating >= 1 && rating <= 5) {
              if (!userId) {
                speak('Vui lòng đăng nhập để đánh giá truyện.');
                return;
              }
              axios.post(`${API_URL}/stories/${storyId}/rating`, {
                user: userId,
                rating: rating,
              })
                .then(() => {
                  speak(`Bạn đã đánh giá ${rating} sao. Cảm ơn bạn! Đang làm mới trang.`, () => {
                    window.location.reload(); // Reload trang sau khi đánh giá thành công
                  });
                })
                .catch(error => {
                  console.error('Error submitting rating:', error);
                  speak('Không thể gửi đánh giá. Vui lòng thử lại sau.');
                });
            } else {
              speak('Vui lòng nói một số từ 1 đến 5, ví dụ "đánh giá 4 sao".');
            }
            return;
          }

          if (transcript.includes('dừng lại')) {
            stopSpeaking();
            speak("Đã dừng đọc thông tin.");
            return;
          }

          if (transcript.includes("đọc từ đầu")) {
            speak("Đang mở chương đầu tiên...", handleReadFromStart);
          } else if (transcript.includes("chương mới nhất")) {
            speak("Đang mở chương mới nhất...", handleReadLatest);
          } else if (transcript.includes("đọc tiếp")) {
            speak("Đang tiếp tục đọc...", handleContinueReadingChapter);
          } else {
            const normalizeChapterName = (text) => {
              const parts = text.split(' ').filter(part => part);
              const chapterIndex = parts.findIndex(part => part === 'chương');
              if (chapterIndex !== -1) {
                const chapterNum = parts.slice(chapterIndex + 1).join(' ');
                return `Chương ${chapterNum}`;
              }
              return text;
            };

            const chapterName = normalizeChapterName(transcript);
            console.log('Chapter name gửi đi:', chapterName);

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
          }
        }

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
            onRatingDecision,
          } = callbacks;

          // Kiểm tra nếu người dùng cuộn đến đoạn văn cuối cùng
          const paragraphs = chapterData.chapter?.content?.split('\n').filter(p => p.trim()) || [];
          if (currentParagraphIndexRef.current === paragraphs.length - 1 && !isSpeaking && !isChapterFinishedRef.current) {
            isChapterFinishedRef.current = true;
          }

          if (transcript.includes('chương trước') && previousIdRef.current) {
            speak('Đang chuyển đến chương trước', () => navigateToChapter(previousIdRef.current));
          } else if (transcript.includes('trương tuyết') && nextIdRef.current) {
            speak('Đang chuyển đến chương tiếp', () => navigateToChapter(nextIdRef.current));
          } else if (transcript.includes('danh sách chương')) {
            speak('Đang mở danh sách chương', toggleDropdown);
          } else if (transcript.includes('nghe truyện') && !isSpeaking) {
            console.log('Triggering handleReadChapter');
            speak('Đang bắt đầu nghe truyện', handleReadChapter(JSON.parse(localStorage.getItem('chapter_paragraph'))));
          } else if (transcript.includes('dừng nghe')) {
            console.log('Triggering handleStop');
            handleStopReading();
            speak('Đã dừng nghe truyện');
          } else if (transcript.includes('tiếp tục nghe') && !isSpeaking) {
            if (currentParagraphIndex > 0) {
              console.log('Triggering handleContinueReading');
              handleContinueReading();
              speak('Đang tiếp tục nghe truyện');
            } else {
              speak('Bạn đang ở đầu chương. Hãy nói "nghe truyện" để bắt đầu.');
            }
          } else if (transcript.includes('đọc lại từ đầu')) {
            console.log('Triggering handleReadFromBeginning');
            speak('Đang đọc lại từ đầu chương');
            handleReadFromBeginning();
          }
          else if (transcript.includes('bình luận truyện')) {
            speak('Đang mở khung bình luận', scrollToComment);
          } else if (transcript.startsWith('nhập ')) {
            const text = transcript.replace('nhập ', '');
            speak(`Đã nhập: ${text}`, () => {
              setCommentText(text);
              commentTextRef.current = text;
            });
          } else if (transcript.includes('đang bình luận')) {
            submitComment();
          }
        }

        if (!handleCommand(transcript)) {
          speak("Tôi không hiểu lệnh của bạn. Hãy thử lại.");
        }
      };

      recog.onerror = (event) => console.error('VoiceControl error:', event.error);
      recognitionRef.current = recog;

      // Đăng ký callback để phát hiện chapter hoàn tất
      if (callbacks && callbacks.onChapterFinished) {
        callbacks.onChapterFinished = () => {
          isChapterFinishedRef.current = true;
        };
      }
    }
  }, [navigate, isChapterPage, chapters, storyId, chapterData, currentParagraphIndex, callbacks]);

  const handleCommand = (transcript) => {
    return transcript.includes('mở tất cả gợi ý') ||
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
      transcript.includes('đăng xuất');
  };

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

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    localStorage.setItem('is_Speaking', JSON.stringify(false));
  };

  const fetchStoryIdByName = async (storyName) => {
    try {
      const response = await fetch(`${API_URL}/searchstory?name=${encodeURIComponent(storyName)}`);
      if (!response.ok) {
        speak(`Không tìm thấy truyện ${storyName}`);
        navigate('/searchresult', { state: { searchResults: [] } });
        return;
      }
      const data = await response.json();
      if (data.length === 1) {
        speak(`Đang chuyển đến truyện ${data[0].name}`, () =>
          navigate(`/storyinfo/${data[0]._id}`));
      } else {
        speak(`Đang hiển thị danh sách tìm kiếm.`, () =>
          navigate('/searchresult', { state: { searchResults: data } }));
      }
    } catch (error) {
      speak("Lỗi khi tìm truyện, vui lòng thử lại sau.");
      navigate('/searchresult', { state: { searchResults: [] } });
    }
  };

  const handleContinueReadingChapter = () => {
    const user = localStorage.getItem('accountId');
    if (user && storyId) {
      axios.get(`${API_URL}/users/${user}/stories/${storyId}/reading-chapter`)
        .then(response => {
          console.log('API response for continue reading:', response.data);
          const { chapter, count_row } = response.data;
          if (Array.isArray(chapter) && chapter.length > 0) {
            speak(`Đang tiếp tục chương ${chapter[0].name}`, () =>
              navigate(`/stories/${storyId}/chapters/${chapter[0]._id}`, { state: { rowCount: count_row } }));
          } else if (chapter && chapter._id) {
            speak(`Đang tiếp tục chương ${chapter.name}`, () =>
              navigate(`/stories/${storyId}/chapters/${chapter._id}`, { state: { rowCount: count_row } }));
          } else {
            speak("Không tìm thấy chương đang đọc dở.");
          }
        })
        .catch(error => {
          console.error('Error fetching reading chapter:', error);
          speak("Lỗi khi lấy dữ liệu chương đang đọc.");
        });
    } else {
      console.log('Missing userId or storyId:', { userId: userIdRef.current, storyId });
      speak("Không thể tiếp tục vì thiếu thông tin người dùng hoặc truyện.");
    }
  };

  const handleReadFromStart = () => {
    const user = localStorage.getItem('accountId');
    axios.get(`${API_URL}/stories/${storyId}/first?accountId=${user || ''}`)
      .then(response => {
        const { firstChapter, enableChapter } = response.data;
        console.log('API response for first chapter:', response.data);
        if (enableChapter && firstChapter && firstChapter._id) {
          speak(`Đang mở chương đầu tiên: ${firstChapter.name}`, () =>
            navigate(`/stories/${storyId}/chapters/${firstChapter._id}`));
        } else {
          speak("Bạn cần VIP để đọc chương này hoặc không tìm thấy chương đầu tiên.");
        }
      })
      .catch(error => {
        console.error('Error fetching first chapter:', error);
        speak("Lỗi khi lấy chương đầu tiên.");
      });
  };

  const handleReadLatest = () => {
    const user = localStorage.getItem('accountId');
    axios.get(`${API_URL}/stories/${storyId}/latest?accountId=${user || ''}`)
      .then(response => {
        const { latestChapter, enableChapter } = response.data;
        if (enableChapter) {
          speak(`Đang mở chương mới nhất: ${latestChapter.name}`, () =>
            navigate(`/stories/${storyId}/chapters/${latestChapter._id}`));
        } else {
          speak("Bạn cần VIP để đọc chương này.");
        }
      })
      .catch(error => {
        speak("Lỗi khi lấy chương mới nhất.");
      });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          speak('🎤 Đang lắng nghe.');
          console.log('🎤 VoiceControl Mic bật');
        } catch (error) {
          console.error('Error starting recognition:', error);
        }
      }
    };

    const handleKeyUp = (event) => {
      if (!event.ctrlKey && recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        speak('🔇 Đã dừng lắng nghe.');
        console.log('🔇 VoiceControl Mic tắt');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const isAppFirstLaunch = !localStorage.getItem("appLaunched");
    if (isAppFirstLaunch && !isChapterPage) {
      speak(
        "Chào mừng bạn đến với trang web đọc truyện! Bạn có thể nói 'trang chủ', 'thư viện', 'truyện hay nhất' hoặc 'đăng xuất' để điều hướng."
      );
      localStorage.setItem("appLaunched", "true");
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, isChapterPage]);

  return { isListening };
};

export default useVoiceControl;