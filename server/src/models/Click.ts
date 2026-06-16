import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const clickSchema = new Schema({
  shortCode: {
    type: String,
    required: true,
  },
  clickedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  referrer: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  ip: {
    type: String,
    default: null,
  },
});

clickSchema.index({ shortCode: 1, clickedAt: -1 });
clickSchema.index({ referrer: 1 });

export type ClickDocument = InferSchemaType<typeof clickSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Click: Model<ClickDocument> =
  mongoose.models.Click ?? mongoose.model<ClickDocument>("Click", clickSchema);
