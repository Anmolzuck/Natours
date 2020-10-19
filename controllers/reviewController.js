const Review = require('./../models/reviewModel');
const factory = require('./handleFactory');
// const AppError = require('./../utils/appError');
// const catchAsync = require('./../utils/catchAsync');

exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourID;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteTour = factory.deleteOne(Review);
