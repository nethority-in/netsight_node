import "dotenv/config";
import { sendSystemAlert } from "../src/utils/systemAlert.js";

await sendSystemAlert({
  title: "Notification job failed",
  source: "whatsapp_send_message_twilio",
  reference: "test-job-123",
  details:
    "Template: view_report | To: +91XXXXXX1953 | Code: 21656 | HTTP: 400 | Content variables invalid - check template variables | Attempts: 4 | Error: TEST ALERT",
});
console.log("done");