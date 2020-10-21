/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51HbmbILAv6n3UMFbNSMzaLsqeF4oNe04NIA5vkB0CAA62jhhkPjjAkgHeYMbn3Atx5suBYmVPu20opMjrXraMhBU00q1SC8NAT'
);

export const bookTour = async (tourID) => {
  // tour id will come from the UI
  try {
    // 1 Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    //console.log(session);

    // 2 Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
