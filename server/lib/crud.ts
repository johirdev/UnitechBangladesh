import { Router, type Request } from "express";
import type { Model } from "mongoose";
import { z } from "zod";
import { requirePerm } from "../middleware/auth";
import type { Permission } from "../models/User";
import { ApiError } from "./errors";
import { ok, parse, paging, escapeRegex, qstr, objectId } from "./http";
import { audit } from "./audit";

type Opts = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  entity: string;
  perm: Permission;
  schema: z.ZodObject<z.ZodRawShape>;
  searchFields?: string[];
  populate?: { path: string; select?: string }[];
  sort?: Record<string, 1 | -1>;
  filters?: (req: Request) => Record<string, unknown>;
  beforeSave?: (data: Record<string, unknown>, req: Request, id?: string) => Promise<Record<string, unknown>> | Record<string, unknown>;
};

/** সাধারণ CRUD রাউটার (লিস্ট, একটি, তৈরি, আপডেট, ডিলিট) */
export function crudRouter(o: Opts) {
  const r = Router();
  r.use(requirePerm(o.perm));

  r.get("/", async (req, res) => {
    const { page, limit, skip } = paging(req, 500);
    const filter: Record<string, unknown> = { ...(o.filters?.(req) || {}) };
    const q = qstr(req.query.q);
    if (q && o.searchFields?.length) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = o.searchFields.map((f) => ({ [f]: rx }));
    }
    if (req.query.isActive === "true" || req.query.isActive === "false") filter.isActive = req.query.isActive === "true";
    const [items, total] = await Promise.all([
      o.model
        .find(filter)
        .sort(o.sort || { order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(o.populate || [])
        .lean(),
      o.model.countDocuments(filter),
    ]);
    ok(res, items, "সফল", 200, { page, limit, total, pages: Math.ceil(total / limit) });
  });

  r.get("/:id", async (req, res) => {
    const doc = await o.model.findById(objectId(req.params.id)).populate(o.populate || []);
    if (!doc) throw new ApiError(404, `${o.entity} পাওয়া যায়নি`);
    ok(res, doc);
  });

  r.post("/", async (req, res) => {
    let data = parse(o.schema, req.body) as Record<string, unknown>;
    if (o.beforeSave) data = await o.beforeSave(data, req);
    const doc = await o.model.create(data);
    audit(req, "create", o.entity, doc._id);
    ok(res, doc, `${o.entity} তৈরি হয়েছে`, 201);
  });

  r.patch("/:id", async (req, res) => {
    const id = objectId(req.params.id);
    let data = parse(o.schema.partial(), req.body) as Record<string, unknown>;
    if (o.beforeSave) data = await o.beforeSave(data, req, id);
    const doc = await o.model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!doc) throw new ApiError(404, `${o.entity} পাওয়া যায়নি`);
    audit(req, "update", o.entity, id);
    ok(res, doc, `${o.entity} আপডেট হয়েছে`);
  });

  r.delete("/:id", async (req, res) => {
    const id = objectId(req.params.id);
    const doc = await o.model.findByIdAndDelete(id);
    if (!doc) throw new ApiError(404, `${o.entity} পাওয়া যায়নি`);
    audit(req, "delete", o.entity, id);
    ok(res, {}, `${o.entity} মুছে ফেলা হয়েছে`);
  });

  return r;
}
