import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import ListSearching from '../../../components/User/ListSeaching.jsx';
import './SearchResult.css';
import '../../../components/User/homepage.css';
import useVoiceControl from '../../../utils/voiceControl.js';

const SearchStory = () => {
  const location = useLocation();
  const searchResults = location.state?.searchResults || [];
  useVoiceControl("", "", "");
  return (
    <div className="u-main-page">
      <Header />
      <Navbar />
      <div className="main-page-content">
        {searchResults.length > 0 ? (
          <div className="search-results">
            <ListSearching results={searchResults} />
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-container">
              <img 
                src="https://img.icons8.com/ios/452/search.png" 
                alt="No results" 
                className="no-results-image" 
              />
              <h3>Không tìm thấy truyện nào</h3>
              <p>Chúng tôi không thể tìm thấy truyện nào với từ khóa bạn đã nhập. Hãy thử lại với từ khóa khác!</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchStory;
