import { PromoCode } from "../models/Catalog";
import { ApiError } from "./errors";

type CourseLike = { _id: unknown; price: number; discountPrice?: number | null };
type BatchLike = { fee?: number | null } | null | undefined;

export const basePrice = (course: CourseLike, batch?: BatchLike) => {
  if (batch?.fee && batch.fee > 0) return batch.fee;
  const d = course.discountPrice || 0;
  return d > 0 && d < course.price ? d : course.price;
};

/** প্রোমো কোড যাচাই করে ছাড়ের পরিমাণ বের করে */
export async function applyPromo(code: string | undefined, course: CourseLike, amount: number) {
  if (!code) return { discount: 0, promo: null as null | { _id: unknown; code: string } };
  const promo = await PromoCode.findOne({ code: code.trim().toUpperCase() });
  const now = new Date();
  if (!promo || !promo.isActive) throw new ApiError(400, "প্রোমো কোডটি সঠিক নয়");
  if (promo.validFrom && promo.validFrom > now) throw new ApiError(400, "প্রোমো কোডটি এখনো চালু হয়নি");
  if (promo.validTo && promo.validTo < now) throw new ApiError(400, "প্রোমো কোডের মেয়াদ শেষ");
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) throw new ApiError(400, "প্রোমো কোডের ব্যবহার সীমা শেষ");
  if (promo.courses?.length && !promo.courses.some((c) => String(c) === String(course._id)))
    throw new ApiError(400, "এই কোর্সে প্রোমো কোডটি প্রযোজ্য নয়");

  let discount = promo.type === "percent" ? Math.round((amount * promo.value) / 100) : promo.value;
  if (promo.type === "percent" && promo.maxDiscount > 0) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.min(discount, amount);
  return { discount, promo: { _id: promo._id, code: promo.code } };
}

/**
 * প্রোমোর একটা ব্যবহার অ্যাটমিকভাবে বুক করে — সীমা শেষ হলে false।
 * (আগে যাচাই আর +১ আলাদা ধাপে হওয়ায় একসাথে রিকোয়েস্ট এলে সীমা পেরিয়ে যেত)
 */
export async function reservePromo(id: unknown) {
  const r = await PromoCode.updateOne(
    { _id: id, isActive: true, $or: [{ maxUses: { $lte: 0 } }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }] },
    { $inc: { usedCount: 1 } },
  );
  return r.modifiedCount === 1;
}
