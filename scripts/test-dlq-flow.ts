import "dotenv/config";
import { publishNotificationJob } from "../src/queue/rabbitNotifications.js";

const res = await publishNotificationJob("whatsapp_send_message_twilio", {
  to: "+919999999999",
  templateName: "dlq_test_nonexistent_template",
  languageCode: "en_US",
  components: [],
});
console.log("published:", res);
process.exit(0);