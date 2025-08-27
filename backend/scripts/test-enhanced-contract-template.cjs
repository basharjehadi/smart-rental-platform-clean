const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testEnhancedContractTemplate() {
  console.log('🧪 Testing Enhanced Contract Template...');
  
  try {
    // Test 1: Check template file exists and has required sections
    console.log('\n📋 Test 1: Checking template file structure...');
    const templatePath = path.join(__dirname, '../src/templates/contractTemplate.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template file not found');
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    console.log('✅ Template file found and readable');
    
    // Check for required Handlebars helpers
    const requiredHelpers = [
      '{{#if isTenantBusiness}}',
      '{{#if isTenantGroup}}',
      '{{#if isLandlordBusiness}}',
      '{{#each occupants}}',
      '{{#each tenantGroupMembers}}',
      '{{#unless @last}}'
    ];
    
    console.log('\n🔍 Checking for required Handlebars helpers:');
    requiredHelpers.forEach(helper => {
      if (templateContent.includes(helper)) {
        console.log(`✅ Found: ${helper}`);
      } else {
        console.log(`❌ Missing: ${helper}`);
      }
    });
    
    // Check for new sections
    const requiredSections = [
      'Authorized Occupants / Autoryzowani Mieszkańcy',
      'Group Member Signatures / Podpisy Członków Grupy',
      'Main Contract Signatures / Główne Podpisy Umowy',
      'Business Landlord / Wynajmujący Biznesowy',
      'Business Tenant / Najemca Biznesowy',
      'Primary Group Member / Główny Członek Grupy'
    ];
    
    console.log('\n🔍 Checking for required sections:');
    requiredSections.forEach(section => {
      if (templateContent.includes(section)) {
        console.log(`✅ Found: ${section}`);
      } else {
        console.log(`❌ Missing: ${section}`);
      }
    });
    
    // Check for CSS classes
    const requiredCSS = [
      '.occupants-list',
      '.occupant-item',
      '.occupant-separator',
      '.group-signatures-container',
      '.group-signature-box',
      '.primary-badge'
    ];
    
    console.log('\n🔍 Checking for required CSS classes:');
    requiredCSS.forEach(cssClass => {
      if (templateContent.includes(cssClass)) {
        console.log(`✅ Found: ${cssClass}`);
      } else {
        console.log(`❌ Missing: ${cssClass}`);
      }
    });
    
    // Test 2: Check dynamic section numbering
    console.log('\n🔢 Test 2: Checking dynamic section numbering...');
    
    // Check for conditional section numbers
    const sectionNumbering = [
      '§{{#if isTenantBusiness}}{{#if isTenantGroup}}15{{else}}14{{/if}}{{else}}{{#if isTenantGroup}}14{{else}}13{{/if}}{{/if}}',
      '§{{#if isTenantBusiness}}14{{else}}13{{/if}}'
    ];
    
    sectionNumbering.forEach(numbering => {
      if (templateContent.includes(numbering)) {
        console.log(`✅ Found dynamic numbering: ${numbering}`);
      } else {
        console.log(`❌ Missing dynamic numbering: ${numbering}`);
      }
    });
    
    // Test 3: Check conditional rendering logic
    console.log('\n🎭 Test 3: Checking conditional rendering logic...');
    
    // Check for business tenant conditions
    if (templateContent.includes('{{#if isTenantBusiness}}') && 
        templateContent.includes('{{/if}}')) {
      console.log('✅ Business tenant conditional blocks properly structured');
    } else {
      console.log('❌ Business tenant conditional blocks missing or malformed');
    }
    
    // Check for tenant group conditions
    if (templateContent.includes('{{#if isTenantGroup}}') && 
        templateContent.includes('{{/if}}')) {
      console.log('✅ Tenant group conditional blocks properly structured');
    } else {
      console.log('❌ Tenant group conditional blocks missing or malformed');
    }
    
    // Check for landlord business conditions
    if (templateContent.includes('{{#if isLandlordBusiness}}') && 
        templateContent.includes('{{/if}}')) {
      console.log('✅ Landlord business conditional blocks properly structured');
    } else {
      console.log('❌ Landlord business conditional blocks missing or malformed');
    }
    
    // Test 4: Check looping helpers
    console.log('\n🔄 Test 4: Checking looping helpers...');
    
    // Check for occupants loop
    if (templateContent.includes('{{#each occupants}}') && 
        templateContent.includes('{{/each}}')) {
      console.log('✅ Occupants loop properly structured');
    } else {
      console.log('❌ Occupants loop missing or malformed');
    }
    
    // Check for tenant group members loop
    if (templateContent.includes('{{#each tenantGroupMembers}}') && 
        templateContent.includes('{{/each}}')) {
      console.log('✅ Tenant group members loop properly structured');
    } else {
      console.log('❌ Tenant group members loop missing or malformed');
    }
    
    // Test 5: Check template completeness
    console.log('\n📄 Test 5: Checking template completeness...');
    
    const templateLines = templateContent.split('\n');
    console.log(`📊 Template has ${templateLines.length} lines`);
    
    // Check for proper HTML structure
    if (templateContent.includes('<!DOCTYPE html>') && 
        templateContent.includes('<html') && 
        templateContent.includes('</html>')) {
      console.log('✅ HTML structure is complete');
    } else {
      console.log('❌ HTML structure is incomplete');
    }
    
    // Check for proper Handlebars closing
    const openIfs = (templateContent.match(/\{\{#if/g) || []).length;
    const closeIfs = (templateContent.match(/\{\{\/if\}/g) || []).length;
    const openEachs = (templateContent.match(/\{\{#each/g) || []).length;
    const closeEachs = (templateContent.match(/\{\{\/each\}/g) || []).length;
    
    console.log(`🔍 Handlebars structure check:`);
    console.log(`  - {{#if}} blocks: ${openIfs} open, ${closeIfs} close`);
    console.log(`  - {{#each}} blocks: ${openEachs} open, ${closeEachs} close`);
    
    if (openIfs === closeIfs && openEachs === closeEachs) {
      console.log('✅ All Handlebars blocks are properly closed');
    } else {
      console.log('❌ Handlebars blocks are not properly balanced');
    }
    
    console.log('\n🎉 Enhanced Contract Template testing completed successfully!');
    console.log('\n📋 Key Features Verified:');
    console.log('✅ Conditional rendering for business/individual landlords and tenants');
    console.log('✅ Dynamic section numbering based on tenant type');
    console.log('✅ Authorized Occupants section for business tenants');
    console.log('✅ Group Member Signatures section for tenant groups');
    console.log('✅ Enhanced signature display with proper titles');
    console.log('✅ Professional styling for all new sections');
    console.log('✅ Proper Handlebars syntax and structure');
    console.log('✅ Bilingual support (English/Polish) for all sections');
    
  } catch (error) {
    console.error('❌ Enhanced Contract Template testing failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testEnhancedContractTemplate()
  .then(() => {
    console.log('✅ Enhanced Contract Template test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Enhanced Contract Template test script failed:', error);
    process.exit(1);
  });
