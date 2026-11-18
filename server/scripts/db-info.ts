// ডেটাবেসে কোন কোন কালেকশন আছে দেখায়:  npx tsx server/scripts/db-info.ts
import mongoose from "mongoose";
import { config } from "../config";

(async () => {
  await mongoose.connect(config.dbUrl, { dbName: config.dbName, serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db!;
  console.log("DB:", db.databaseName);
  for (const c of await db.listCollections().toArray()) console.log(` - ${c.name}: ${await db.collection(c.name).countDocuments()}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
