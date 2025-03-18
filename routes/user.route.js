var express = require('express');
const router = express.Router();
const User = require('../models/users');
const Course = require('../models/courses');
const Exercise = require('../models/exercises');
const Review = require('../models/reviews');
const Comment = require('../models/lecturecomments');
const userController = require('../controllers/user.controllers');
const courseController = require('../controllers/course.controllers');
const { validate } = require('../controllers/validator');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const uploadsFolderPath = path.join(__dirname, '../uploads');

// multer lưu ảnh của khóa học
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsFolderPath + '/courses');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//TODO: Tạo page mặc định cho role student
router.get('/', function (req, res) {
  res.redirect('/home/course');
})
  .get('/course', async function (req, res, next) {
    const partial = 'partials/course';
    const layout = 'layouts/main';

    // delete req.session.customer;
    if (req.session.role == "instructor") {
      res.redirect('/home/course_create');
    } else {
      req.partial_path = partial
      req.layout_path = layout

      req.page_data = {
        listcourse: await courseController.get_list_course(),
      }
      await userController.getpage(req, res, next);
    }

  })
  .get('/course_create', async function (req, res, next) {
    const partial = 'partials/course_create';
    const layout = 'layouts/main';


    req.partial_path = partial
    req.layout_path = layout

    req.page_data = {
      list_my_course: await courseController.get_my_course(req, res, next),
    }
    await userController.getpage(req, res, next);
  })
  .post('/course/create', upload.single('courseImage'), async (req, res, next) => {
    try {
        req.body = JSON.parse(req.body.courseData);
        const result = await courseController.addNewCourse(req, res, next);
        res.json(result);
    } catch (error) {
        next(error);
    }
  })
  .get('/courseedit/:courseId', async function (req, res, next) {
    console.log(req.params.courseId)
    const partial = 'partials/edit_course';
    const layout = 'layouts/main';
    req.partial_path = partial
    req.layout_path = layout
    req.page_data = {
      courseId: req.params.courseId,
      course_detail: await courseController.getCourse(req.params.courseId),
      section_detail: await courseController.getSectionsAndLectures(req.params.courseId)
    }
    // console.log(req.page_data.account_details)
    await userController.getpage(req, res, next);

  })
  .put('/courseedit/:courseId', upload.single('courseImage'), async (req, res, next) => {
    try {
        req.body = JSON.parse(req.body.courseData);
        const result = await courseController.editCourse(req, res, next);
        res.json(result);
    } catch (error) {
        next(error);
    }
  })
  .get('/course/:courseId', async function (req, res, next) {
    const user = await User.findById(req.session.account);
    const hasBought = user.subscribed.includes(req.params.courseId);
    const hasAddToCart = user.cart.includes(req.params.courseId);
    const hasReviewsOfACourse = await Review.find({ courseId: req.params.courseId })
    .populate('userId', 'fullName profilePicture'); 
    const hasReviewed = await Review.findOne({ courseId: req.params.courseId, userId: req.session.account })
    .populate('userId', 'fullName profilePicture');
    const hasExercises = await Exercise.find({ courseId: req.params.courseId });

    console.log(req.params.courseId)
    const partial = 'partials/course_detail';
    const layout = 'layouts/main';
    req.partial_path = partial
    req.layout_path = layout
    req.page_data = {
      course_detail: await courseController.getCourse(req.params.courseId),
      hasBought: hasBought,
      hasAddToCart: hasAddToCart,
      hasReviewed: hasReviewed,
      hasReviewsOfACourse: hasReviewsOfACourse,
      hasExercises: hasExercises
    }
    // console.log(req.page_data.account_details)
    await userController.getpage(req, res, next);
  })
  .delete('/course/:courseId', courseController.delete_course)
  .get('/exercise', async function (req, res, next) {
    const partial = 'partials/exercise';
    const layout = 'layouts/main';
  
    const coursesWithExercises = await courseController.getCoursesWithExercises(req, res, next);
    console.log("Courses with exercises: ", coursesWithExercises);
  
    req.partial_path = partial;
    req.layout_path = layout;
  
    req.page_data = {
      list_my_course: coursesWithExercises,
      list_all_course_of_anInstructor: await courseController.get_my_course(req, res, next)
    }
    await userController.getpage(req, res, next);
  })
  .post('/course/exercise', async (req, res, next) => {
    await courseController.manageExercise(req, res, next);
  })
  .get('/exercise', async function (req, res, next) {
    const partial = 'partials/exercise';
    const layout = 'layouts/main';
  
    const coursesWithExercises = await courseController.getCoursesWithExercises(req, res, next);
    console.log("Courses with exercises: ", coursesWithExercises);
  
    req.partial_path = partial;
    req.layout_path = layout;
  
    req.page_data = {
      list_my_course: coursesWithExercises,
      list_all_course_of_anInstructor: await courseController.get_my_course(req, res, next)
    }
    await userController.getpage(req, res, next);
  })
  .post('/course/exercise', async (req, res, next) => {
    await courseController.manageExercise(req, res, next);
  })
  .delete('/course/:courseId', courseController.delete_course)
  .get('/rating', async function (req, res, next) {
    const user = await User.findById(req.session.account);
    const hasBought = user.subscribed.includes(req.params.courseId);
    const hasAddToCart = user.cart.includes(req.params.courseId);

    const hasReviewsOfACourse = await Review.find({ courseId: req.params.courseId })
    .populate('userId', 'fullName'); 

    const hasReviewed = await Review.findOne({ courseId: req.params.courseId, userId: req.session.account })
    .populate('userId', 'fullName');

    const partial = 'partials/course_detail';
    const layout = 'layouts/main';
    req.partial_path = partial
    req.layout_path = layout
    req.page_data = {
      course_detail: await courseController.getCourse(req.params.courseId),
      hasBought: hasBought,
      hasAddToCart: hasAddToCart,
      hasReviewed: hasReviewed,
      hasReviewsOfACourse: hasReviewsOfACourse
    }
    await userController.getpage(req, res, next);
  })
  .post('/rating', async function(req, res) {
      const courseId = req.body.courseId;
      try {
        await courseController.addRatingAndComment(req, res, courseId);
      } catch (error) {
          res.status(500).json({ message: 'Error while adding rating and comment!!' });
      }
  })
  .get('/lecture/:courseId', async function (req, res, next) {
    const firstLectureData = await courseController.getFirstlecture(req.params.courseId);
    const lectureId = firstLectureData ? firstLectureData.lectureID : null;
    req.session.courseId = req.params.courseId;
    if (!lectureId) {
      console.log('No lecture ID found');
    } else {
      console.log('Lecture ID found:', lectureId);
    }

    // Tìm các bình luận cho bài giảng đầu tiên
    const hasCommentsOfALecture = await Comment.find({ lectureID: lectureId })
      .populate('userId', 'fullName profilePicture');

    console.log('Comments of a lecture:', hasCommentsOfALecture);
    const partial = 'partials/lecture';
    const layout = 'layouts/main';
    req.partial_path = partial
    req.layout_path = layout
    req.page_data = {
      menu_bar: await courseController.getSectionsAndLectures(req.params.courseId),
      first_lecture: await courseController.getFirstlecture(req.params.courseId),
      notes: await courseController.getNotesByUserAndCourseID(req),
      hasCommentsOfALecture: hasCommentsOfALecture
    }
    // console.log(req.page_data.account_details)
    await userController.getpage(req, res, next);
  })
  .post('/addcomment', async function(req, res) {
    const firstLectureData = await courseController.getFirstlecture(req.session.courseId);
    console.log('First lecture data:', firstLectureData.lectureID);
    const lectureId = firstLectureData ? firstLectureData.lectureID : null;
    try {
      await courseController.addCommentsForALecture(req, res, firstLectureData.lectureID);
    } catch (error) {
        res.status(500).json({ message: 'Error while adding comment!!' });
    }
  })
  .get('/notes', async (req, res) => {
    const courseId = req.query.courseId;
    req.params.courseId = courseId;
    const notes = await courseController.getNotesByUserAndCourseID(req);
    res.json(notes);
  })
  .post('/take-note', async function (req, res, next) {
    try {
      const added = await courseController.addNewNote(req, res);
      
      res.json(added);

    } catch (error) {
      // Xử lý lỗi (nếu có)
      console.error("Error:", error);
      next(error);
    }
  })
  .get('/cart', async function (req, res, next) {
    const partial = 'partials/shopping_cart';
    const layout = 'layouts/main';

    console.log(req.session.account)

    req.partial_path = partial
    req.layout_path = layout

    req.page_data = {
      list_cart: await courseController.get_list_cart(req, res , next),
    }
    await userController.getpage(req, res, next);


  })
  .post('/cart', async function (req, res, next) {
    console.log(req.body);
  
    try {
      // Xử lý logic liên quan đến thêm vào giỏ hàng ở đây
      // Ví dụ:
      // Tiếp tục xử lý các thao tác thêm vào giỏ hàng với courseId
      const added = await courseController.add_to_cart(req, res , next);
      
      res.json(added);
      // Gửi phản hồi thành công về client

    } catch (error) {
      // Xử lý lỗi (nếu có)
      console.error("Error:", error);
      next(error);
      // Gửi phản hồi lỗi về client
      // res.status(500).json({ status: "error", message: "Đã xảy ra lỗi khi thêm vào giỏ hàng" });
    }
  })

  .get('/subscribed', async function (req, res, next) {
    const partial = 'partials/my_course';
    const layout = 'layouts/main';

    req.partial_path = partial
    req.layout_path = layout
    req.page_data = {
      list_my_course: await courseController.get_subcribe_course(req, res, next),
    }
    await userController.getpage(req, res, next);
  })

  .get('/exercise', async function (req, res, next) {
    const partial = 'partials/exercise';
    const layout = 'layouts/main';

    req.partial_path = partial
    req.layout_path = layout

    await userController.getpage(req, res, next);
  })
  .get('/search/:term' , courseController.getcoursebyTermRegex)

  .get('/about_us', async function (req, res, next) {
    const partial = 'partials/about_us';
    const layout = 'layouts/main';

    delete req.session.customer;

    req.partial_path = partial
    req.layout_path = layout
    const aboutUsData = await courseController.getAboutUS();

    req.page_data = {
      num_student : aboutUsData.students.length,
      num_course : aboutUsData.courses.length,
      num_instructor : aboutUsData.instructors.length,
    }
    await userController.getpage(req, res, next);
  })
  .get('/contact', async function (req, res, next) {
    const partial = 'partials/contact';
    const layout = 'layouts/main';

    delete req.session.customer;

    req.partial_path = partial
    req.layout_path = layout

    await userController.getpage(req, res, next);
  })
  .post('/update-progress', async (req, res) => {
    const result = await courseController.updateProgress(req);
    res.status(result.success ? 200 : 500).json(result);
  })
  .get('/course-progress/:courseId', async (req, res) => {
    const result = await courseController.getCourseProgress(req);
    res.status(result.success ? 200 : 500).json(result);
  })
  .get('/completed-courses', async (req, res) => {
    const result = await courseController.getCompletedCourses(req);
    res.status(result.success ? 200 : 500).json(result);
  })
  .get('/certificate/:courseId', async function (req, res) {
    try {
      const user = await User.findById(req.session.account);
      const result = await courseController.getCourse(req.params.courseId);
      if (result) {
        res.json({ success: true, course: result, fullname: user.fullName });
      } else {
        res.json({ success: false, error: 'Course not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  })

module.exports = router;
