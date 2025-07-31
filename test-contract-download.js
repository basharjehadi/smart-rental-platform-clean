import fetch from 'node-fetch';

async function testContractDownload() {
  try {
    console.log('Testing contract download...');
    
    // First, let's test the eligibility endpoint
    const eligibilityResponse = await fetch('http://localhost:3001/api/contracts/2/eligibility', {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // You'll need to replace this with a real token
      }
    });
    
    if (eligibilityResponse.ok) {
      const eligibilityData = await eligibilityResponse.json();
      console.log('✅ Eligibility check passed:', eligibilityData);
      
      if (eligibilityData.canGenerate) {
        // Now test the actual contract download
        const contractResponse = await fetch('http://localhost:3001/api/contracts/2', {
          headers: {
            'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // You'll need to replace this with a real token
          }
        });
        
        if (contractResponse.ok) {
          const pdfBuffer = await contractResponse.buffer();
          console.log('✅ Contract download successful!');
          console.log('PDF size:', pdfBuffer.length, 'bytes');
          
          // Save the PDF for inspection
          const fs = await import('fs');
          fs.writeFileSync('test-contract.pdf', pdfBuffer);
          console.log('✅ PDF saved as test-contract.pdf');
        } else {
          console.log('❌ Contract download failed:', contractResponse.status, contractResponse.statusText);
          const errorText = await contractResponse.text();
          console.log('Error details:', errorText);
        }
      } else {
        console.log('❌ Contract cannot be generated:', eligibilityData.reason);
      }
    } else {
      console.log('❌ Eligibility check failed:', eligibilityResponse.status, eligibilityResponse.statusText);
      const errorText = await eligibilityResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing contract download:', error);
  }
}

testContractDownload(); 