import axios from 'axios';

async function debugOffers() {
  try {
    console.log('Debugging offers...');
    
    // Test the API endpoint
    const response = await axios.get('http://localhost:3001/api/offers/my', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    
    console.log('API Response:', response.data);
    
    const offers = response.data.offers || response.data || [];
    console.log('All offers:', offers);
    
    offers.forEach((offer, index) => {
      console.log(`Offer ${index + 1}:`, {
        id: offer.id,
        status: offer.status,
        paymentIntentId: offer.paymentIntentId,
        rentAmount: offer.rentAmount,
        depositAmount: offer.depositAmount
      });
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugOffers(); 