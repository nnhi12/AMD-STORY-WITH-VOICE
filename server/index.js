const express = require('express');
const connectDB = require('./utils/connect.js');
const cors = require('cors');
const multer = require("multer");

const authRouter = require('./controllers/authcontroller.js');
const storyRouter = require('./controllers/storycontroller.js');
const commentRouter = require('./controllers/commentcontroller.js');
const userRouter = require('./controllers/usercontroller.js');
const categoryRouter = require('./controllers/categorycontroller.js');
const followRouter = require('./controllers/followstorycontroller.js');
const readingRouter = require('./controllers/readingstorycontroller.js');
const chapterRouter = require('./controllers/chaptercontroller.js');
const readingprogressRouter = require('./controllers/readingprogresscontroller.js');
const vipRouter = require('./controllers/vipcontroller.js');
const storyVoiceRouter = require('./controllers/voicecontroller.js');
const recommendationRoutes = require('./routes/recommendation');
const statisticalRoutes = require('./routes/statistical');
const app = express();

app.use(express.json());
//app.use(cors());
app.use(cors({
    origin: '*',  // Hoặc thay bằng địa chỉ frontend nếu cần
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
const upload = multer();

connectDB();

//dang nhap, dang ky
app.use("/", authRouter);

app.use("/", storyRouter);

//comment
app.use("/", commentRouter);

app.use("/", userRouter);

app.use("/", categoryRouter);

app.use("/", followRouter);

app.use("/", readingRouter);

app.use("/", chapterRouter);

app.use("/", readingprogressRouter);

app.use("/", vipRouter);

app.get('/',storyVoiceRouter);

app.use('/recommend', recommendationRoutes);

app.use('/statistical', statisticalRoutes);

app.listen(3001, '0.0.0.0', () => {
    console.log('Success!');
})