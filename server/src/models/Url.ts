import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const urlSchema = new Schema(
  {
    shortCode: {
      type: String,
      required: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    customAlias: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

urlSchema.index({ shortCode: 1 }, { unique: true });

export type UrlDocument = InferSchemaType<typeof urlSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Url: Model<UrlDocument> =
  mongoose.models.Url ?? mongoose.model<UrlDocument>("Url", urlSchema);
