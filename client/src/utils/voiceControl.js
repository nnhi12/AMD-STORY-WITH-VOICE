import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../env";

const useVoiceControl = ({ chapters, storyId, chapterData, currentParagraphIndex, callbacks, nextId, previousId, userId, commentText, chapterId}) => {
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
    '/': 'trang chủ',
    '/register': 'trang đăng ký',
    '/login': 'trang đăng nhập',
    '/library': 'thư viện',
    '/tophot': 'truyện hot nhất',
    '/favpage': 'danh sách truyện theo dõi',
    '/aboutus': 'trang giới thiệu',
    '/userinfo': 'thông tin người dùng',
    '/payment': 'trang thanh toán',
    '/forgot-password': 'trang quên mật khẩu',
    '/colab-recommend': 'truyện gợi ý',
    '/by-age': 'truyện theo độ tuổi',
    '/for-kids': 'truyện dành cho trẻ em',
    '/by-age-input': 'trang nhập độ tuổi',
    '/by-gender': 'truyện theo giới tính',
  };

  // Thông báo khi chuyển trang
  useEffect(() => {
    const getPageName = () => {
      // Kiểm tra các trường hợp đặc biệt trước (có tham số động)
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
        // Kiểm tra các đường dẫn tĩnh trong pageNameMap
        return pageNameMap[location.pathname] || 'trang không xác định';
      }
    };

    const pageName = getPageName();
    speak(`Bạn đang ở trang ${pageName}`);
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
        const currentParagraphIndex = JSON.parse(localStorage.getItem('currentParagraphIndex')) || false;
        
        if (location.pathname === '/' && transcript.includes('đọc danh sách truyện')) {
          const readStoryList = async () => {
            try {
              const response = await axios.get(`${API_URL}/stories`);
              const stories = response.data;
              console.log("Dữ liệu truyện nhận được:", stories); // Kiểm tra dữ liệu
        
              if (!stories || stories.length === 0) {
                speak("Hiện tại không có truyện nào trong danh sách.");
                return;
              }
        
              localStorage.setItem('is_Speaking', JSON.stringify(true)); // Đặt trạng thái
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
        
              // Lưu hàm onresult ban đầu
              const originalOnResult = recognitionRef.current.onresult;
        
              // Gán onresult để chỉ lắng nghe "xác nhận"
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
                          window.location.reload(); // Làm mới trang
                        });
                      }
                    })
                    .catch((error) => {
                      console.error('Lỗi khi xóa truyện:', error);
                      speak("Có lỗi xảy ra khi xóa truyện. Vui lòng thử lại.");
                    })
                    .finally(() => {
                      // Khôi phục onresult sau khi hoàn tất
                      recognitionRef.current.onresult = originalOnResult;
                    });
                }
              };
        
              // Thiết lập timeout để hủy nếu không xác nhận
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
        } else if (transcript.startsWith('tìm ')) {
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
              speak(`Không tìm thấy thể loại ${genreName}.`);
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
          const currentStoryId = location.pathname.split('/storyinfo/')[1]; // Lấy storyId từ URL

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

        if (location.pathname === '/library') {
          // Lệnh "đọc các truyện có trong thư viện"
          if (transcript.includes('đọc các truyện có trong thư viện')) {
            if (books.length === 0) {
              speak("Thư viện của bạn hiện không có truyện nào.");
              return;
            }

            const readBooks = () => {
              let index = 0;
              const speakNextBook = () => {
                if (index < books.length && isSpeaking) {
                  const book = books[index];
                  speak(book.name, () => {
                    index++;
                    speakNextBook();
                  });
                }
              };
              speakNextBook();
            };

            speak("Danh sách các truyện trong thư viện của bạn là:", readBooks);
            return;
          }

          // Lệnh "dừng"
          if (transcript.includes('dừng')) {
            stopSpeaking();
            speak("Đã dừng đọc danh sách truyện.");
            return;
          }

          // Lệnh "đọc truyện xxx"
          if (transcript.startsWith('đọc truyện ')) {
            const storyName = transcript.replace('đọc truyện ', '').trim();
            const matchedBook = books.find(book =>
              book.name.toLowerCase().includes(storyName)
            );

            if (matchedBook) {
              speak(`Đang mở truyện ${matchedBook.name}`, () => {
                navigate(`/storyinfo/${matchedBook._id}`);
              });
            } else {
              speak(`Không tìm thấy truyện ${storyName} trong thư viện của bạn.`);
            }
            return;
          }
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
  
          // Xử lý lệnh "dừng lại" để dừng đọc
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
          } = callbacks;

          console.log('Checking nghe truyện:', { transcript, isSpeaking, currentParagraphIndex });

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
    }
  }, [navigate, isChapterPage, chapters, storyId, chapterData, currentParagraphIndex, callbacks]);

  const handleCommand = (transcript) => {
    return transcript.includes('đọc thông tin trang') ||
    transcript.includes('đọc danh sách truyện') ||
    transcript.includes('dừng lại') ||
    transcript.startsWith('xóa truyện ') ||
    transcript.includes('truyện hay nhất') ||
      transcript.includes('đến thư viện') ||
      transcript.includes('trang chủ') ||
      transcript.includes('danh sách theo dõi') ||
      transcript.startsWith('tìm ') ||
      transcript.startsWith('thể loại ') || // Thêm lệnh tìm thể loại
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
      transcript.includes('đang bình luận') ||
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
      transcript.includes('xem truyện theo độ tuổi') |
      transcript.includes('truyện phân loại tuổi') ||
      transcript.includes('danh sách truyện theo tuổi') ||
      transcript.includes('truyện cho trẻ em') ||
      transcript.includes('mở truyện trẻ em') ||
      transcript.includes('xem truyện cho trẻ') ||
      transcript.includes('truyện thiếu nhi') ||
      transcript.includes('trẻ dưới 13 tuổi nên đọc truyện gì') ||
      transcript.includes('tìm truyện theo tuổi nhập') ||
      transcript.includes('truyện theo tuổi tự chọn');
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
      axios.get(`${API_URL}/stories/${storyId}/chapters/${chapterIdRef.current}/comments`)
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
        "Chào mừng bạn đến với trang web đọc truyện! Bạn có thể nói 'trang chủ', 'thư viện' hoặc 'truyện hay nhất' để điều hướng."
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