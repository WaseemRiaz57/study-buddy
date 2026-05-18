import mongoose, { Schema, type InferSchemaType, models } from "mongoose";

const SubscriptionPlanLimitsSchema = new Schema(
  {
    maxNotesPerDay: { type: Number, default: 5, min: 0 },
    maxStudyRooms: { type: Number, default: 1, min: 0 },
    studyRoomCapacity: { type: Number, default: 4, min: 1 },
    resourceUploadsPerMonth: { type: Number, default: 3, min: 0 },
  },
  { _id: false }
);

const SubscriptionPlanSchema = new Schema(
  {
    tier: {
      type: String,
      enum: ["Free", "Pro", "Elite"],
      required: true,
      unique: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    cta: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    limits: {
      type: SubscriptionPlanLimitsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

SubscriptionPlanSchema.index({ tier: 1 }, { unique: true });

export type SubscriptionPlanDocument = InferSchemaType<typeof SubscriptionPlanSchema>;

export default models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
