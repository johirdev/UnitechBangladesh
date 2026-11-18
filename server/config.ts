import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config({ path: path.join(process.cwd(), ".env"), quiet: true } as dotenv.DotenvConfigOptions);

const env = (k: string, d = "") => (process.env[k] ?? d).trim();

const jwtSecret = env("JWT_SECRET");
let refreshSecret = env("JWT_REFRESH_SECRET");
// access ও refresh একই secret হলে একটা দিয়ে অন্যটা জাল করা যায় — তাই আলাদা করে নিই
if (!refreshSecret || refreshSecret === jwtSecret) {
  refreshSecret = crypto.createHash("sha256").update(`refresh::${jwtSecret}`).digest("hex");
}

/**
 * মোড — .env এর NODE_ENV অনুযায়ী
 *  development: এসএমএস আসলে যায় না (কনসোলে দেখায়), OTP ফর্মে নিজে বসে যায়, রেট লিমিট ঢিলা, এরর বিস্তারিত
 *  production : আসল এসএমএস, OTP কখনো দেখায় না, Secure কুকি, কড়া রেট লিমিট, এরর লুকানো
 */
const mode = env("NODE_ENV", "development") === "production" ? "production" : "development";
const isProd = mode === "production";

export const config = {
  env: mode,
  isProd,
  isDev: !isProd,
  // ডেভেলপমেন্টে আসল এসএমএস পাঠাতে চাইলে .env এ SMS_IN_DEV=true
  smsInDev: env("SMS_IN_DEV") === "true",
  cookieSecure: env("COOKIE_SECURE") ? env("COOKIE_SECURE") === "true" : isProd,
  port: parseInt(env("PORT", "5000"), 10),
  dbUrl: env("DATABASE_URL"),
  dbName: env("DB_NAME", "unitech_bangladesh"),
  bcryptRounds: Math.max(10, parseInt(env("BCRYPT_SALT_ROUND", "12"), 10)),
  appName: env("APP_NAME", "Unitech Bangladesh") === "coders24" ? "Unitech Bangladesh" : env("APP_NAME", "Unitech Bangladesh"),
  frontendUrl: env("FRONTEND_URL", "http://localhost:3000"),
  // এসএমএসের লিংকে যে ঠিকানা যাবে (রসিদ ইত্যাদি) — .env এ SITE_URL দিলে সেটা
  siteUrl: env("SITE_URL", isProd ? "http://unitechbangladesh.com" : "http://localhost:3000").replace(/\/+$/, ""),
  jwt: {
    secret: jwtSecret,
    refreshSecret,
    expiresIn: env("JWT_EXPIRES_IN", "7d"),
    adminExpiresIn: env("JWT_EXPIRES_IN_ADMIN", "1d"),
    refreshExpiresIn: env("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  sms: {
    url: env("BULKSMSBD_API_URL", "http://bulksmsbd.net/api/smsapi"),
    apiKey: env("BULKSMSBD_API_KEY"),
    senderId: env("BULKSMSBD_SENDER_ID"),
    // production এ SMS_ENABLED=true হলে আসল এসএমএস; development এ শুধু SMS_IN_DEV=true হলে
    enabled: env("SMS_ENABLED") === "true" && (isProd || env("SMS_IN_DEV") === "true"),
  },
  cloudinary: {
    cloudName: env("CLOUDINARY_CLOUD_NAME"),
    apiKey: env("CLOUDINARY_API_KEY"),
    apiSecret: env("CLOUDINARY_API_SECRET"),
  },
};

if (!config.dbUrl) throw new Error("DATABASE_URL .env এ নেই");
if (!config.jwt.secret || config.jwt.secret.length < 32) throw new Error("JWT_SECRET কমপক্ষে ৩২ অক্ষরের হতে হবে");
