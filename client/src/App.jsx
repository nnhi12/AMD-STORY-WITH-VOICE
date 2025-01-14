import { useState, useEffect } from 'react'
import HomePage from './pages/User/HomePage/HomePage'
import StoryInfo from './pages/User/StoryInformation/StoryInforPage'
import ChapterView from './pages/User/ViewChapter/viewchapter'
import ListReading from './pages/User/Library/Library'
import LogIn from './pages/Main/Login/Login'
import SignUp from './pages/User/Register/Register'
import ClassifiedByGenre from './pages/User/ClassifiedByGenre/ClassifiedByGenre'
import ClassifiedByChapter from './pages/User/ClassifiedByChapter/ClassifiedByChapter'
import TopHot from './pages/User/TopHotStory/TopHotStory'
import FavouriteStory from './pages/User/FavouriteStory/FavouriteStory'
import AboutUs from './pages/User/AboutUs/AboutUsPage'
import SearchPage from './pages/User/SearchResult/SearchResult'
import UserInfo from './pages/User/UserInformation/UserInformationPage'
import ForgotPassword from './pages/Main/ForgotPassword/ForgotPassword'
import Payment from './pages/User/Payment/Payment'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
function App() {
  
  return (
    <div>
        <BrowserRouter>
          <Routes>
            <Route path = '/register' element = {<SignUp />}> </Route>
            <Route path = '/login' element = {<LogIn />}> </Route>
            <Route path = '/' element = {<HomePage />}> </Route>
            <Route path = '/storyinfo/:storyId' element = {<StoryInfo />}> </Route>
            <Route path='/stories/:storyId/chapters/:chapterId' element={<ChapterView />} />
            <Route path = '/library' element = {<ListReading />}> </Route>
            <Route path="/classifiedbygenre/:categoryId" element={<ClassifiedByGenre />}>  </Route>
            <Route path = '/classifiedbychapter' element = {<ClassifiedByChapter />}> </Route>
            <Route path = '/tophot' element = {<TopHot />}> </Route>
            <Route path = '/favpage' element = {<FavouriteStory />}> </Route>
            <Route path = '/aboutus' element = {<AboutUs />}> </Route>
            <Route path = '/searchresult' element = {<SearchPage />}> </Route>
            <Route path = '/userinfo' element = {<UserInfo />}> </Route>
            <Route path = '/payment' element = {<Payment />}> </Route>
            <Route path = '/forgot-password' element = {<ForgotPassword />}> </Route>
          </Routes>
        </BrowserRouter>
    </div>
  )
}

export default App
