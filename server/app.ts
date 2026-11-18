import express, { Router } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { errorHandler, notFound } from "./lib/errors";
import { sanitize, requireClientHeader, globalLimiter } from "./middleware/security";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import uploadRoutes from "./routes/upload";
import studentRoutes from "./routes/student";
import teacherRoutes from "./routes/teacher";
import adminContent from "./routes/admin/content";
import adminCourses from "./routes/admin/courses";
import adminEnrollments from "./routes/admin/enrollments";
import adminUsers from "./routes/admin/users";
import adminFinance from "./routes/admin/finance";
import adminOps from "./routes/admin/ops";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", parseInt(process.env.TRUST_PROXY || "1", 10));
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(
  cors({
    origin: config.frontendUrl.split(",").map((s) => s.trim()),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Requested-With", "Authorization"],
  }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(sanitize);
app.use("/api", globalLimiter);
app.use("/api", requireClientHeader);

app.get("/api/v1/health", (_req, res) => res.json({ success: true, message: "OK", data: { mode: config.env, sms: config.sms.enabled }, time: new Date().toISOString() }));

const v1 = Router();
v1.use("/auth", authRoutes);
v1.use("/public", publicRoutes);
v1.use("/upload", uploadRoutes);
v1.use("/student", studentRoutes);
v1.use("/teacher", teacherRoutes);

const admin = Router();
admin.use(adminContent);
admin.use(adminCourses);
admin.use(adminEnrollments);
admin.use(adminUsers);
admin.use(adminFinance);
admin.use(adminOps);
v1.use("/admin", admin);

app.use("/api/v1", v1);
app.use(notFound);
app.use(errorHandler);
