import { useState, useEffect } from 'react';
import HomePage from './pages/User/HomePage/HomePage';
import StoryInfo from './pages/User/StoryInformation/StoryInforPage';
import ChapterView from './pages/User/ViewChapter/viewchapter';
import ListReading from './pages/User/Library/Library';
import LogIn from './pages/Main/Login/Login';
import SignUp from './pages/User/Register/Register';
import ClassifiedByGenre from './pages/User/ClassifiedByGenre/ClassifiedByGenre';
import ClassifiedByChapter from './pages/User/ClassifiedByChapter/ClassifiedByChapter';
import TopHot from './pages/User/TopHotStory/TopHotStory';
import FavouriteStory from './pages/User/FavouriteStory/FavouriteStory';
import AboutUs from './pages/User/AboutUs/AboutUsPage';
import SearchPage from './pages/User/SearchResult/SearchResult';
import UserInfo from './pages/User/UserInformation/UserInformationPage';
import ForgotPassword from './pages/Main/ForgotPassword/ForgotPassword';
import Payment from './pages/User/Payment/Payment';
import StoryList from './components/User/StoryList';
import StoryByCategory from './components/User/StoryByCategory';
import StoryByAge from './components/User/StoryByAge';
import StoryByGender from './components/User/StoryByGender'
import StoryForKids from './components/User/StoryForKids';
import StoryByAgeInput from './components/User/StoryByAgeInput';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/storyinfo/:storyId" element={<StoryInfo />} />
          <Route path="/stories/:storyId/chapters/:chapterId" element={<ChapterView />} />
          <Route path="/library" element={<ListReading />} />
          <Route path="/classifiedbygenre/:categoryId" element={<ClassifiedByGenre />} />
          <Route path="/classifiedbychapter" element={<ClassifiedByChapter />} />
          <Route path="/tophot" element={<TopHot />} />
          <Route path="/favpage" element={<FavouriteStory />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/searchresult" element={<SearchPage />} />
          <Route path="/userinfo" element={<UserInfo />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/colab-recommend" element={<StoryList />} />
          <Route path="/category/:category" element={<StoryByCategory />} />
          <Route path="/by-age" element={<StoryByAge />} />
          <Route path="/for-kids" element={<StoryForKids />} />
          <Route path="/by-age-input" element={<StoryByAgeInput />} />
          <Route path="/by-gender" element={<StoryByGender />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;