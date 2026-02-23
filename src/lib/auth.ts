// src\lib\auth.ts
  // src\lib\auth.ts
  import { betterAuth } from "better-auth";
  import { drizzleAdapter } from "better-auth/adapters/drizzle";
  import { db } from "@/db"; 
  import { user, session, account, verification } from "@/db/schema"; // Import specific tables
  import { nextCookies } from "better-auth/next-js";
  import { phoneNumber } from "better-auth/plugins"; 
  import { sendSMS } from "@/lib/sms"; 

  export const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      // 1. Pass only the Auth tables to avoid confusion with your other schema helpers
      schema: {
        user,
        session,
        account,
        verification,
      },
      usePlural: false,
    }),
    // 3. Add Social Provider
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    plugins: [
      nextCookies(),
      phoneNumber({
        sendOTP: async ({ phoneNumber, code }) => {
          // Ensure this sends the SMS
          console.log(`[SMS] Sending ${code} to ${phoneNumber}`);
          await sendSMS(phoneNumber, `Your OTP code is ${code}`); 
          // Note: Ensure sendSMS is not throwing errors. 
        },
        signUpOnVerification: {
          getTempEmail: (phoneNumber) => {
            return `${phoneNumber}@temp.propertygo.com`;
          },
          getTempName: (phoneNumber) => {
            return `User ${phoneNumber}`;
          },
        },
      }),
    ],
    logger: {
      level: "debug", // Keep debug to see specific SQL errors in terminal
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day (only update session in DB if it's older than 1 day)
    },
  });