import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Book from './book';

const ListReading = ({ showChapters }) => {
  const { categoryId } = useParams();
  const [stories, setStories] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:3001/categories/${categoryId}/stories`)
      .then(response => {
        setStories(response.data);
      })
      .catch(error => {
        console.error('Error fetching stories for category:', error);
      });
  }, [categoryId]);

  return (
    <div className="container my-5">
      <div className="row row-cols-4">
        {stories.map((story, index) => (
          <Book key={index} data={story} showChapters={showChapters} />
        ))}
      </div>
    </div>
  );
};

export default ListReading;
