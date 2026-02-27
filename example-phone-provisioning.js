// Example: How to provision numbers programmatically
// This would be integrated into your signup flow

const { Twilio } = require('twilio');

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function provisionPhoneNumber(businessName, userId) {
  try {
    // 1. Search for available numbers in specific area code
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local
      .list({
        areaCode: 555, // or customer's preferred area
        smsEnabled: true,
        limit: 5
      });

    if (availableNumbers.length === 0) {
      throw new Error('No available numbers in this area');
    }

    // 2. Purchase the first available number
    const phoneNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: availableNumbers[0].phoneNumber,
      friendlyName: `${businessName} - Review Requests`,
      smsUrl: 'https://yourapp.com/webhooks/twilio/sms', // Handle replies
    });

    console.log(`✅ Assigned ${phoneNumber.phoneNumber} to ${businessName}`);

    // 3. Save to your database
    await supabase
      .from('profiles')
      .update({
        twilio_phone_number: phoneNumber.phoneNumber,
        twilio_phone_sid: phoneNumber.sid
      })
      .eq('id', userId);

    return phoneNumber.phoneNumber;

  } catch (error) {
    console.error('Failed to provision number:', error);
    throw error;
  }
}

// Usage in your signup flow:
// const newNumber = await provisionPhoneNumber('ABC Plumbing', userId);