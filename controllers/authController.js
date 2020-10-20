const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// function to create token
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//function to send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //sending a cookie
  res.cookie('jwt', token, cookieOptions);

  //Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // role: req.body.role,
  });

  //Sending email
  //const url = `${req.protocol}://${req.get('host')}/me`;
  //console.log(url);
  //await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  //Creating a token
  // const token = signToken(newUser._id);
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

//logging in users
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide an email and password!', 400));
  }
  //2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  //this line of code is for checking enterd password is equal to stored password but this will not run
  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  //3)If everything is ok send back the token to the client
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

//log out user by sending a token less cookie
exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged Out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

/****************Authentication*****************************/

//Protecting tour routes (vid 130)
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);

  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token does no longer exist', 401)
    );
  }

  //4)Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // will execute only if user changed password
    return next(
      new AppError(
        'The user recently changed password! Please log in again.',
        401
      )
    );
  }
  //Grant access to protected routes
  req.user = currentUser; //if you want to pass data from middleware to other middlewares put it on requset object
  res.locals.user = currentUser;
  next();
});

//This middleware is for frontend only
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      //1)Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next(new AppError());
      }

      //3)Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError());
      }
      //There is a logged in user
      res.locals.user = currentUser; // passing data to the pug template
      return next();
    }
  } catch (e) {
    return next();
  }
  next();
};

/****************Authorization*****************************/

//Granting permissions to admin and lead-guide
exports.restrictTo = (...roles) => {
  // using reset param of es6
  return (req, res, next) => {
    //roles ['admin', 'lead-guide'] can be accessed bcuz of closure
    if (!roles.includes(req.user.role)) {
      // middleware function
      return next(
        new AppError('You do not have permission to access this action!', 403)
      );
    }
    next();
  };
};

/***********Forgot and resest password****************/

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTemail
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3)send it to users email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    //reset token and expires time
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token . Hash the resettoken and compare it the encrypted one in db
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //Get user on bases of token because we don't name and email anything
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expired and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedpasswordAt property for the user
  //4) Log the user in send JWT
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

//Update the password of user if users wants not forgot password
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection . id is avilable bcuz this will only work for logged in users
  const user = await User.findById(req.user.id).select('+password');
  //2)Check if Posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }
  //3)If so update Password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will not work as intended.

  //4)Log user in , send JWT
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});
