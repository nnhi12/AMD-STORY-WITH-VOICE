// src/components/Banner.jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Image, Carousel} from 'react-bootstrap';
import './Banner.css';

const Banner = () => {
  return (
    <Carousel>
      <Carousel.Item>
        <div className = "row">
          <div className = "col-4">
            <Image src= "https://media.printables.com/media/prints/184387/images/1719386_fcfada9d-1320-4fdb-b39f-8121e74bf119/thumbs/cover/1200x630/jpg/fbfc7783ac7dada533301b4935d7cfe7_display_large_18.jpg" className="d-block w-100 banner-image-fit"/>
          </div>
          <div className = "col-4">
            <Image src= "https://cdnphoto.dantri.com.vn/2_Bw_63Da8JObwdOYjSIcn8ZV2A=/zoom/1200_630/2024/06/01/doraemon-elleman-8617-crop-crop-1717228639382.jpeg" className="d-block w-100 banner-image-fit"/>
          </div>
          <div className = "col-4">
            <Image src= "https://media.yeah1.com/resize/1200x630/files/uploads/47/2021/04/17/607a5c9bd26f5.jpg" className="d-block w-100 banner-image-fit"/>
          </div>
        </div>
      </Carousel.Item>
      <Carousel.Item>
        <div className = "row">
          <div className = "col-4">
            <Image src= "https://wallpapergod.com/images/hd/naruto-characters-1200X630-wallpaper-y1784eyqj64lez5t.jpeg" className="d-block w-100 banner-image-fit"/>
          </div>
          <div className = "col-4">
            <Image src= "https://dnsg.1cdn.vn/thumbs/1200x630/2020/12/30/i.doanhnhansaigon.vn-2020-12-30-_truyentranhlactroidoanhnhansaigon02-1609302076.jpg" className="d-block w-100 banner-image-fit"/>
          </div>
          <div className = "col-4">
            <Image src= "https://static1.purebreak.com/articles/6/24/80/36/@/856750-la-fin-du-manga-jujutsu-kaisen-deja-conn-1200x630-7.jpg" className="d-block w-100 banner-image-fit"/>
          </div>
        </div>
      </Carousel.Item>
    </Carousel>
  );
};

export default Banner;
