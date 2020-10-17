/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51HbmbILAv6n3UMFbNSMzaLsqeF4oNe04NIA5vkB0CAA62jhhkPjjAkgHeYMbn3Atx5suBYmVPu20opMjrXraMhBU00q1SC8NAT'
);

export const bookTour = async (tourID) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
