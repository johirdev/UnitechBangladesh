# Unitech Bangladesh — কোর্স বিক্রি ও একাডেমি ম্যানেজমেন্ট

কোর্স এনরোলমেন্ট, ব্যাচ, পেমেন্ট/বকেয়া, শিক্ষক পেমেন্ট, আয়-ব্যয়, এসএমএস (BulkSMSBD), সার্টিফিকেট ও ভিজিটর অ্যানালিটিক্সসহ পূর্ণ ওয়েবসাইট।

| অংশ | টেকনোলজি | ফোল্ডার |
|---|---|---|
| ফ্রন্টএন্ড + অ্যাডমিন/শিক্ষক/শিক্ষার্থী ড্যাশবোর্ড | Next.js 16 (App Router), Tailwind | `src/` |
| API | Express 5, Mongoose, Zod | `server/` |
| ছবি | Cloudinary (ক্রপ করে আপলোড) | — |
| এসএমএস | BulkSMSBD | `server/lib/sms.ts` |

ব্যবহার নির্দেশিকা (বাংলা) সাইটেই আছে: **`/guide`**

## চালু করা

```bash
npm install
npm run seed      # প্রথমবার: Master Admin + ক্যাটাগরি, কোর্স, ব্যাচ, ব্যানার, গ্যালারি
npm run dev       # .env এর NODE_ENV অনুযায়ী API (5000) + ওয়েবসাইট (3000) চালু হবে
```

### Development ও Production মোড

শুধু `.env` এ `NODE_ENV` বদলান, তারপর `npm run dev` (বা `npm start`):

| | `NODE_ENV=development` | `NODE_ENV=production` |
|---|---|---|
| সার্ভার | হট-রিলোড (কোড বদলালে নিজে রিলোড) | প্রথমবার build করে production সার্ভার |
| এসএমএস | যায় না — টার্মিনালে দেখায় (খরচ নেই) | আসল এসএমএস (BulkSMSBD) |
| OTP | ফর্মে নিজে বসে যায় | শুধু মোবাইলে যায়, কোথাও দেখায় না |
| কুকি | সাধারণ | `Secure` (HTTPS লাগবে) |
| রেট লিমিট | ২০ গুণ ঢিলা | কড়া |
| এরর | বিস্তারিত | লুকানো |
| স্ক্রিনে ব্যাজ | 🛠 DEVELOPMENT | কিছু না |

- development এ আসল এসএমএস দিয়ে টেস্ট করতে চাইলে: `SMS_IN_DEV=true`
- production এ কোড বদলানোর পর আবার build করতে: `npm run rebuild`
- HTTPS ছাড়া (শুধু IP দিয়ে) production চালালে লগইন কাজ করবে না; সাময়িকভাবে `COOKIE_SECURE=false` দিন (প্রস্তাবিত নয়)

- ওয়েবসাইট: http://localhost:3000
- স্টাফ লগইন: http://localhost:3000/admin/login — `.env` এর `MASTER_ADMIN_EMAIL` / `MASTER_ADMIN_PASSWORD`
- Master Admin এর পাসওয়ার্ড `.env` অনুযায়ী আবার সেট করতে: `npm run seed -- --reset-admin`

## .env

`.env.example` দেখুন। গুরুত্বপূর্ণ:

- `DATABASE_URL` + `DB_NAME=unitech_bangladesh` — এই প্রজেক্টের আলাদা ডেটাবেস (একই ক্লাস্টারের অন্য ডেটা ছোঁয় না)
- `JWT_SECRET` (৩২+ অক্ষর) — `JWT_REFRESH_SECRET` আলাদা রাখুন
- `BULKSMSBD_*`, `SMS_ENABLED=true` — `false` করলে এসএমএস না গিয়ে কনসোলে দেখাবে এবং OTP টেস্টের জন্য স্ক্রিনে দেখাবে (শুধু development)
- `CLOUDINARY_*` — না থাকলে ছবি আপলোড হবে না
- `FRONTEND_URL` — CORS এর জন্য
- `TRUST_PROXY` (ঐচ্ছিক, ডিফল্ট 1) — রিভার্স প্রক্সির পেছনে থাকলে সঠিক IP পেতে

## প্রোডাকশন

```bash
npm run build
npm run start        # ওয়েবসাইট
npm run api:start    # API (pm2 দিয়ে চালানো ভালো)
```

ব্রাউজার সবসময় `/api/v1/*` কল করে, Next.js সেটা `NEXT_PUBLIC_API_URL` এ পাঠায় — তাই লগইন কুকি একই ডোমেইনে থাকে। প্রোডাকশনে `NODE_ENV=production` দিন (কুকি তখন `Secure` হয়, HTTPS লাগবে)।

## রোল ও অনুমতি

| রোল | কী করতে পারে |
|---|---|
| Super Admin | সব কিছু, অ্যাডমিন/সিইও তৈরি, অ্যাকাউন্ট মুছা |
| CEO | সব দেখা ও পরিচালনা |
| Admin | যে অনুমতিগুলো দেওয়া হয়: content, courses, students, enrollments, finance, sms, certificates, analytics, settings |
| শিক্ষক | নিজের ব্যাচ, শিক্ষার্থী তালিকা, নিজের পেমেন্ট, স্বাক্ষর |
| শিক্ষার্থী | এনরোল, কোর্স/পেমেন্ট/বকেয়া, সার্টিফিকেট PDF, রিভিউ, প্রোফাইল |

## নিরাপত্তা

bcrypt পাসওয়ার্ড • httpOnly + SameSite কুকি সেশন, tokenVersion দিয়ে সাথে সাথে সেশন বাতিল • ৫ বার ভুলে ১৫ মিনিট লক • HMAC-হ্যাশড OTP (৫ মিনিট, ৫ চেষ্টা, ৬০ সেকেন্ড কুলডাউন, ঘণ্টায় ৬টি) • রেট লিমিট • কাস্টম হেডার দিয়ে CSRF সুরক্ষা • Helmet ও সিকিউরিটি হেডার • Zod ইনপুট যাচাই • NoSQL injection স্যানিটাইজার • ছবির magic-byte যাচাই • রোল/পারমিশনভিত্তিক API • অডিট লগ (IP সহ)।

## API সংক্ষেপ (`/api/v1`)

- `auth/*` — otp/send, otp/verify, register, login (ফোন বা ইমেইল), reset-password, me, change-password, logout, logout-all
- `public/*` — home, settings, categories, courses, courses/:slug, gallery, toppers, attachments, reviews, promo/validate, certificates/verify, certificates/:no, track
- `student/*` — enroll, dashboard, enrollments, payments, certificates, reviews
- `teacher/*` — overview, batches/:id, earnings
- `admin/*` — dashboard, banners, categories, gallery, attachments, toppers, reviews, promo-codes, courses, batches, enrollments, enrollments/:id/payments, payments, users, users/:id/reset-password, expenses, finance/report, sms/custom, sms/enrollments, sms/logs, certificates, certificates/issue, analytics, analytics/visits, analytics/delete, settings, audit-logs
- `upload` — Cloudinary ছবি আপলোড
