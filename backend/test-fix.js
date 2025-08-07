// Test the location matching logic
const rentalRequestLocation = "Stare Miasto, Poznan";
const propertyCity = "Poznan";

console.log('🔍 Testing Location Matching Fix...\n');

console.log(`Rental Request Location: "${rentalRequestLocation}"`);
console.log(`Property City: "${propertyCity}"\n`);

// Test the old logic
const oldLogic = propertyCity.toLowerCase().includes(rentalRequestLocation.toLowerCase());
console.log(`❌ Old Logic: propertyCity.includes(requestLocation) = ${oldLogic}`);

// Test the new logic
const parts = rentalRequestLocation.split(',');
const cityPart = parts.length > 1 ? parts[1].trim() : parts[0].trim();
const districtPart = parts.length > 1 ? parts[0].trim() : parts[0].trim();

const newLogic1 = propertyCity.toLowerCase().includes(cityPart.toLowerCase());
const newLogic2 = propertyCity.toLowerCase().includes(districtPart.toLowerCase());

console.log(`✅ New Logic 1: propertyCity.includes("${cityPart}") = ${newLogic1}`);
console.log(`✅ New Logic 2: propertyCity.includes("${districtPart}") = ${newLogic2}`);

console.log(`\n🎯 Result: ${newLogic1 || newLogic2 ? 'MATCH!' : 'No Match'}`); 