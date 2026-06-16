import { customAlphabet } from "nanoid";
import type { Model } from "mongoose";
import type { UrlDocument } from "../models/Url.js";

const CODE_LENGTH = 7;
const MAX_RETRIES = 5;

// URL-safe alphanumeric alphabet (62 chars); nanoid default also allows _ and -
const generateCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  CODE_LENGTH,
);

/**
 * Collision retry is a cheap guard before insert: with 62^7 (~3.5T) codes,
 * random clashes are vanishingly rare at typical scale, but concurrent
 * creates can pick the same code in the same moment. Retrying avoids a
 * failed insert against the unique shortCode index.
 */
export async function generateUniqueCode(
  UrlModel: Model<UrlDocument>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    const exists = await UrlModel.exists({ shortCode: code });

    if (!exists) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate a unique short code after ${MAX_RETRIES} attempts`,
  );
}
