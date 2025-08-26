import Stripe from 'stripe';

// Base provider contract
// Each provider exports: async function refund(payment, prisma, context) -> { refundId?, provider, status, error? }

// Stripe provider (live)
const stripeProvider = {
  refund: async (payment, prisma) => {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return { provider: 'STRIPE', status: 'error', error: 'STRIPE_SECRET_KEY missing' };
    }
    try {
      const stripe = new Stripe(stripeSecret);
      const refund = await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELLED', errorMessage: `REFUNDED:${refund.id}` } });
      return { provider: 'STRIPE', status: 'ok', refundId: refund.id };
    } catch (e) {
      return { provider: 'STRIPE', status: 'error', error: e.message };
    }
  }
};

// Mock-like providers for PayU/P24/Tpay (replace with real API later)
const simpleMarkCancelled = async (payment, prisma, providerName) => {
  try {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELLED', errorMessage: 'REFUNDED:' + providerName } });
    return { provider: providerName, status: 'ok' };
  } catch (e) {
    return { provider: providerName, status: 'error', error: e.message };
  }
};

const payuProvider = { refund: (payment, prisma) => simpleMarkCancelled(payment, prisma, 'PAYU') };
const p24Provider = { refund: (payment, prisma) => simpleMarkCancelled(payment, prisma, 'P24') };
const tpayProvider = { refund: (payment, prisma) => simpleMarkCancelled(payment, prisma, 'TPAY') };

export const getRefundProvider = (gateway) => {
  switch (gateway) {
    case 'STRIPE':
      return stripeProvider;
    case 'PAYU':
      return payuProvider; // TODO: Replace with real PayU refund API
    case 'P24':
      return p24Provider;  // TODO: Replace with real P24 refund API
    case 'TPAY':
      return tpayProvider; // TODO: Replace with real Tpay refund API
    default:
      return {
        refund: async (payment, prisma) => simpleMarkCancelled(payment, prisma, gateway || 'UNKNOWN')
      };
  }
};


