const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handleFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image.', 400), false);
  }
};

//for image upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

//edit user photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  //Because filename is not set when we use memoryStorage
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//filter the request body
/* newObj[el] = obj[el] => newObj with the field name of the current field,should be equal to whatever is in the object at the current element, so the current field name.*/
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//Set the getOne id value to user id and user can get his info
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// updating the currrently authenticated user
exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user Posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }
  //2) We need to filter the update request so that we only allow users to update the fields we want and not any other field
  const filteredBody = filterObj(req.body, 'name', 'email');

  //upload new photo file name to database
  if (req.file) filteredBody.photo = req.file.filename;

  //3) Update user document
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

//Allowing user to delete his account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

//Don't change password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
