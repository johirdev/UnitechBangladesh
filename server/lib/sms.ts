import axios from "axios";
import { config } from "../config";
import { SmsLog } from "../models/System";

const ERRORS: Record<string, string> = {
  "1001": "অবৈধ নম্বর",
  "1002": "Sender ID ভুল বা বন্ধ",
  "1003": "প্রয়োজনীয় তথ্য নেই",
  "1005": "BulkSMSBD সার্ভার সমস্যা",
  "1006": "ব্যালেন্সের মেয়াদ শেষ",
  "1007": "পর্যাপ্ত এসএমএস ব্যালেন্স নেই",
  "1011": "User ID পাওয়া যায়নি",
  "1012": "মাস্কিং এসএমএস বাংলায় হতে হবে",
  "1013": "Sender ID তে গেটওয়ে নেই",
  "1018": "অ্যাকাউন্ট বন্ধ",
  "1031": "অ্যাকাউন্ট ভেরিফাইড নয়",
  "1032": "IP হোয়াইটলিস্টে নেই",
};

const toIntl = (n: string) => {
  const p = n.trim().replace(/[\s-]/g, "");
  if (p.startsWith("01")) return "88" + p;
  if (p.startsWith("+880")) return p.slice(1);
  return p;
};

export type SmsResult = { ok: boolean; status: "sent" | "failed" | "skipped"; error?: string };

/** একটি নম্বরে এসএমএস পাঠায়, লগ রাখে। কখনো throw করে না। */
export async function sendSms(to: string, message: string, type = "custom", sentBy?: unknown): Promise<SmsResult> {
  let result: SmsResult;
  if (!config.sms.enabled || !config.sms.apiKey) {
    if (config.isDev) console.log(`📱 [DEV — এসএমএস যায়নি] ${to}: ${message}`);
    result = { ok: false, status: "skipped", error: config.isDev ? "Development মোড — এসএমএস পাঠানো হয়নি (কনসোলে দেখুন)" : "SMS সার্ভিস বন্ধ (SMS_ENABLED=false)" };
  } else {
    try {
      const res = await axios.post(
        config.sms.url,
        { api_key: config.sms.apiKey, senderid: config.sms.senderId, number: toIntl(to), message, type: "text" },
        { timeout: 15000 },
      );
      const code = String(res.data?.response_code ?? res.data);
      result = code === "202" ? { ok: true, status: "sent" } : { ok: false, status: "failed", error: ERRORS[code] || `SMS ত্রুটি (${code})` };
    } catch (e) {
      const err = e as { message?: string };
      result = { ok: false, status: "failed", error: err.message || "SMS পাঠানো যায়নি" };
    }
  }
  // OTP এর আসল কোড লগে রাখি না
  const logMsg = type === "otp" ? message.replace(/\d{6}/g, "******") : message;
  await SmsLog.create({ to, message: logMsg, type, status: result.status, response: result.error || "", sentBy: sentBy as string | undefined }).catch(() => {});
  return result;
}

/** একাধিক নম্বরে (ব্যক্তিগত মেসেজসহ) ক্রমানুসারে পাঠায় */
export async function sendBulk(items: { to: string; message: string }[], type: string, sentBy?: unknown) {
  let sent = 0,
    failed = 0,
    skipped = 0;
  const queue = [...items];
  const worker = async () => {
    while (queue.length) {
      const it = queue.shift()!;
      const r = await sendSms(it.to, it.message, type, sentBy);
      if (r.status === "sent") sent++;
      else if (r.status === "skipped") skipped++;
      else failed++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, items.length) }, worker));
  return { total: items.length, sent, failed, skipped };
}

/** টেমপ্লেটের {name} ইত্যাদি প্লেসহোল্ডার পূরণ করে */
export function fillTemplate(tpl: string, vars: Record<string, string | number | undefined | null>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? "" : String(vars[k])));
}
