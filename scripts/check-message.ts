import "dotenv/config";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
const m = await client
  .messages("HX0f04e4c6c1ab288aa482cb268fc71dbb")
  .fetch();
console.log({
  status: m.status,
  errorCode: m.errorCode,
  errorMessage: m.errorMessage,
});