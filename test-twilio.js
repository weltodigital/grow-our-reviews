// Test script to verify Twilio setup
// Run with: node test-twilio.js

require('dotenv').config({ path: '.env.local' });

const { Twilio } = require('twilio');

async function testTwilio() {
  // Check if credentials are present
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ Missing Twilio credentials in .env.local');
    console.log('Required variables:');
    console.log('- TWILIO_ACCOUNT_SID');
    console.log('- TWILIO_AUTH_TOKEN');
    console.log('- TWILIO_PHONE_NUMBER');
    return;
  }

  console.log('🔍 Testing Twilio connection...');
  console.log(`Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);
  console.log(`Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);

  try {
    const client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Test account info
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Twilio connection successful!');
    console.log(`Account Status: ${account.status}`);

    // Test phone number validation
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });

    if (phoneNumbers.length > 0) {
      console.log('✅ Phone number is valid and active');
      console.log(`Capabilities: SMS=${phoneNumbers[0].capabilities.sms ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  Phone number not found in your Twilio account');
    }

  } catch (error) {
    console.error('❌ Twilio connection failed:', error.message);

    if (error.code === 20003) {
      console.log('💡 Check your Account SID and Auth Token');
    }
  }
}

testTwilio();