import dotenv from 'dotenv';
dotenv.config();

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5002';

const testDirect = async () => {
  try {
    console.log('🔍 Direct test with URL:', LIBRETRANSLATE_URL);
    
    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: 'hello',
        source: 'en',
        target: 'pl'
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Direct test successful:', data);
  } catch (error) {
    console.error('❌ Direct test failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor.name);
  }
};

testDirect();
