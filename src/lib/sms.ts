// src\lib\sms.ts
import "server-only";

export async function sendSMS(to: string, message: string) {
  // DEVELOPMENT: Log to console
  if (process.env.NODE_ENV !== "production") {
    console.log(`[📱 MOCK SMS] To: ${to}`);
    console.log(`[💬 Message]: ${message}`);
    return { success: true };
  }

  // PRODUCTION: Implement Twilio/Provider here
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials missing");
    }

    const client = require("twilio")(accountSid, authToken);
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });
    
    return { success: true };
  } catch (error) {
    console.error("SMS Failed:", error);
    // In production, you might want to throw or return false
    return { success: false };
  }
}