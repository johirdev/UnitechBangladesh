/**
 * .env এর NODE_ENV দেখে পুরো অ্যাপ্লিকেশন চালায়:
 *   NODE_ENV=development → হট-রিলোডসহ API + ওয়েবসাইট (কোড বদলালে নিজে রিলোড)
 *   NODE_ENV=production  → ওয়েবসাইট build করে API + ওয়েবসাইট production সার্ভারে চালায়
 *
 * ব্যবহার:  npm run dev   অথবা   npm start   (দুটোই .env অনুযায়ী চলবে)
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

// .env থেকে শুধু প্রথম (কমেন্ট ছাড়া) NODE_ENV লাইন পড়ি
let nodeEnv = "development";
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*NODE_ENV\s*=\s*([^#\s]+)/);
    if (m) {
      nodeEnv = m[1].trim();
      break;
    }
  }
}
const isProd = nodeEnv === "production";
const webPort = process.env.WEB_PORT || "3000";
const forceBuild = process.argv.includes("--build");

const run = (cmd, env) => spawnSync(cmd, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
const start = (cmd, env) => {
  const p = spawn(cmd, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  p.on("exit", (code) => process.exit(code ?? 0));
  for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => p.kill(s));
};

console.log(`\n${isProd ? "🟢 PRODUCTION" : "🟡 DEVELOPMENT"} মোডে চালু হচ্ছে (.env → NODE_ENV=${nodeEnv})\n`);

if (isProd) {
  // build না থাকলে (বা --build দিলে) আগে build করি
  if (forceBuild || !existsSync(".next/BUILD_ID")) {
    console.log("📦 ওয়েবসাইট build হচ্ছে...\n");
    const b = run("npx next build", { NODE_ENV: "production" });
    if (b.status !== 0) process.exit(b.status ?? 1);
  }
  start(`npx concurrently -k -n api,web -c yellow,cyan "npx tsx server/index.ts" "npx next start -p ${webPort}"`, { NODE_ENV: "production" });
} else {
  start(`npx concurrently -k -n api,web -c yellow,cyan "npx tsx watch --clear-screen=false server/index.ts" "npx next dev -p ${webPort}"`, { NODE_ENV: "development" });
}
