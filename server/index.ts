import { config } from "./config";
import { connectDB } from "./lib/db";
import { app } from "./app";
import { backfillReceiptTokens } from "./models/Finance";

async function main() {
  await connectDB();
  await backfillReceiptTokens().catch((e) => console.error("রসিদ টোকেন backfill ব্যর্থ:", e));
  const server = app.listen(config.port, () => {
    console.log(`🚀 API চালু: http://localhost:${config.port}/api/v1`);
    if (config.isProd) {
      console.log(`🟢 PRODUCTION মোড — আসল এসএমএস ${config.sms.enabled ? "চালু" : "বন্ধ (SMS_ENABLED=false)"}, Secure কুকি ${config.cookieSecure ? "চালু" : "বন্ধ"}`);
    } else {
      console.log(`🟡 DEVELOPMENT মোড — ${config.sms.enabled ? "আসল এসএমএস যাবে (SMS_IN_DEV=true)" : "এসএমএস যাবে না, কনসোলে দেখাবে"}; OTP ফর্মে নিজে বসবে`);
      console.log("   production করতে .env এ NODE_ENV=production দিন");
    }
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error("❌ সার্ভার চালু হয়নি:", e);
  process.exit(1);
});
