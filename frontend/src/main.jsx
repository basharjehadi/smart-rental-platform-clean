import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.jsx'

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51QAt6oDbbcQURwonfGahrY1ELyDXt3ZHGY05hcNnpUkAi9i7HBhuFgTg6JWTKePoqPnORKcW22xgCp01PYtGSU4e00LpGJLcyt')

// Debug Stripe initialization
console.log('Stripe initialized with hardcoded key')

// console.log('main.jsx is executing');
const rootElement = document.getElementById('root');
// console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </StrictMode>,
  )
}
