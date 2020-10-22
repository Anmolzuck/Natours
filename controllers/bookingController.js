const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // console.log(tour);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Tour = require('./../models/tourModel');
// const User = require('./../models/userModel');
// const Booking = require('../models/bookingModel');
// const AppError = require('./../utils/appError');
// const catchAsync = require('./../utils/catchAsync');
// const factory = require('./handleFactory');

// exports.getCheckoutSession = catchAsync(async (req, res, next) => {
//   //1 Get the currently booked tour based on tour id
//   const tour = await Tour.findById(req.params.tourID);

//   //2Create checkout session . We make an api call to the stripe to create our session
//   const session = await stripe.checkout.sessions.create({
//     // creating session
//     payment_method_types: ['card'],
//     success_url: `${req.protocol}://${req.get('host')}/?tour=${
//       req.params.tourID
//     }&user=${req.user.id}&price=${tour.price}`,

//     //success_url: `${req.protocol}://${req.get('host')}/my-tour`,
//     cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
//     customer_email: req.user.email,
//     client_reference_id: req.params.tourID,
//     line_items: [
//       //our product info
//       {
//         name: `${tour.name} Tour`,
//         description: tour.summary,
//         images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
//         amount: tour.price * 100,
//         currency: 'usd',
//         quantity: 1,
//       },
//     ],
//   });

//   //3 Create session as response
//   res.status(200).json({
//     status: 'success',
//     session,
//   });
// });

// //Video 213
// //This middleware will be added on view controller because the success url takes us to overview page
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //This is only TEMPORARY, because its UNSECURE: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   //Creating a new document with tour user and price
//   await Booking.create({ tour, user, price });

//   //Now we will make url secure and redirect it other url (homepage). Remove query string
//   res.redirect(req.originalUrl.split('?')[0]);
// });

// // const createBookingCheckout =async session =>{
// //   const tour = session.client_reference_id;
// //   const user = (await User.findOne({email:session.customer_emai})).id;
// //   const price = session.line_items[0].amount /100;
// //   await Booking.create({ tour, user, price});
// // }

//Stripe webhooks . Now we dont need above code
// exports.webhookCheckout = (req, res, next) => {
//   const signature = req.headers['stripe-signature'];
//   let event;
//   try{
//     event = stripe.webhooks.constructEvent{
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     };
//   }catch(e){
//     return res.status(404).send(`Webhook error: ${e.message}`);
//   }
//   if(event.type === 'checkout.session.complete')
//   createBookingCheckout(event.data.object);

//   res.status(200).json({recieved:true})

// };

// exports.createBooking = factory.createOne(Booking);
// exports.getBooking = factory.getOne(Booking);
// exports.getAllBookings = factory.getAll(Booking);
// exports.updateBooking = factory.updateOne(Booking);
// exports.deleteBooking = factory.deleteOne(Booking);
