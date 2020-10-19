//creating catchAsync function to pass the try catch blocks
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
