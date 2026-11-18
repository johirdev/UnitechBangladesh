import type { Request } from "express";
import { AuditLog } from "../models/System";
import { clientIp } from "./http";

export function audit(req: Request, action: string, entity = "", entityId: unknown = "", detail = "") {
  AuditLog.create({
    actor: req.user?._id,
    action,
    entity,
    entityId: entityId ? String(entityId) : "",
    detail: detail.slice(0, 500),
    ip: clientIp(req),
  }).catch(() => {});
}
