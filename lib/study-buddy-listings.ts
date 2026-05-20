import BuddyMatch from "@/models/BuddyMatch";

export const STUDY_BUDDY_LISTING_EXPIRY_DAYS = 7;
export const STUDY_BUDDY_LISTING_EXPIRY_MS =
  STUDY_BUDDY_LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export function getStudyBuddyListingExpiry(from = new Date()): Date {
  return new Date(from.getTime() + STUDY_BUDDY_LISTING_EXPIRY_MS);
}

export async function closeExpiredStudyBuddyListings(now = new Date()) {
  return BuddyMatch.updateMany(
    {
      status: "Searching",
      $or: [
        { expiresAt: { $lte: now } },
        { expiresAt: { $exists: false }, createdAt: { $lte: new Date(now.getTime() - STUDY_BUDDY_LISTING_EXPIRY_MS) } },
      ],
    },
    {
      $set: {
        status: "Expired",
        expiresAt: now,
      },
    }
  );
}

export function activeStudyBuddyListingFilter(now = new Date()) {
  return {
    status: "Searching",
    $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }],
  };
}
