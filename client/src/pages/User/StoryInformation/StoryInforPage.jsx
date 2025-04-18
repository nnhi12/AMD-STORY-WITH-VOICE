import React from 'react';
import { useParams } from 'react-router-dom';

import Header from '../../../layouts/header/User/header.jsx';
import Footer from '../../../layouts/footer/User/footer.jsx';
import Navbar from '../../../components/User/navbar.jsx';
import StoryInfo from './StoryInfo';
import ChapterList from './ChapterList';
import NewestChapter from './NewestChapter';
//import RecommendedStories from '../../../components/User/RecommendStories.jsx';
import './StoryInforPage.css';


const StoryInforPage = () => {
  const { storyId } = useParams();
  return (
    <div className="story-info-page">
      <Header />
      <Navbar />
      <div className="story-info-content">
        <div className="story-info-container">
          <StoryInfo />
        </div>
        <div className="chapter-newest-container">
          <div className="chapter-list-container">
            <ChapterList />
          </div>
          <div className="newest-chapter-container">
            <NewestChapter />
          </div>
        </div>
        {/* <RecommendedStories storyId={storyId} /> */}
      </div>
      <Footer />
    </div>
  );
};

export default StoryInforPage;
