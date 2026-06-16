import { Router, type Request, type Response, type NextFunction } from "express";
import { z, type ZodError } from "zod";
import { Click } from "../models/Click.js";
import { Url } from "../models/Url.js";
import { createUrlLimiter } from "../middleware/rateLimiter.js";
import { generateUniqueCode } from "../utils/generateCode.js";

const router = Router();

const BLOCKED_SCHEMES = new Set(["javascript:", "data:", "vbscript:"]);

const createUrlBodySchema = z.object({
  originalUrl: z.string().refine(
    (value) => {
      try {
        const parsed = new URL(value);
        if (BLOCKED_SCHEMES.has(parsed.protocol)) {
          return false;
        }
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "originalUrl must be a valid http or https URL" },
  ),
  customAlias: z
    .string()
    .trim()
    .min(1, "customAlias cannot be empty")
    .max(64, "customAlias must be at most 64 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "customAlias may only contain letters, numbers, hyphens, and underscores",
    )
    .optional(),
});

function getBaseUrl(): string {
  return process.env.BASE_URL ?? "http://localhost:4000";
}

function sendError(
  res: Response,
  status: number,
  code: string,
  error: string,
): Response {
  return res.status(status).json({ error, code });
}

function formatZodError(error: ZodError): string {
  return error.errors.map((issue) => issue.message).join("; ");
}

router.post(
  "/",
  createUrlLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createUrlBodySchema.safeParse(req.body);

      if (!parsed.success) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          formatZodError(parsed.error),
        );
      }

      const { originalUrl, customAlias } = parsed.data;
      let shortCode: string;

      if (customAlias) {
        const aliasTaken = await Url.exists({ shortCode: customAlias });

        if (aliasTaken) {
          return sendError(
            res,
            409,
            "ALIAS_CONFLICT",
            `customAlias "${customAlias}" is already in use`,
          );
        }

        shortCode = customAlias;
      } else {
        shortCode = await generateUniqueCode(Url);
      }

      const url = await Url.create({
        shortCode,
        originalUrl,
        customAlias: customAlias ?? null,
      });

      return res.status(201).json({
        shortCode: url.shortCode,
        shortUrl: `${getBaseUrl()}/${url.shortCode}`,
        originalUrl: url.originalUrl,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        return sendError(
          res,
          409,
          "ALIAS_CONFLICT",
          "shortCode is already in use",
        );
      }

      next(error);
    }
  },
);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const urls = await Url.aggregate([
      {
        $lookup: {
          from: Click.collection.name,
          localField: "shortCode",
          foreignField: "shortCode",
          pipeline: [{ $count: "total" }],
          as: "clickStats",
        },
      },
      {
        $addFields: {
          clickCount: {
            $ifNull: [{ $arrayElemAt: ["$clickStats.total", 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 0,
          shortCode: 1,
          originalUrl: 1,
          customAlias: 1,
          createdAt: 1,
          expiresAt: 1,
          clickCount: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const baseUrl = getBaseUrl();

    return res.json(
      urls.map((url) => ({
        ...url,
        shortUrl: `${baseUrl}/${url.shortCode}`,
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:code/analytics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;

      const url = await Url.findOne({ shortCode: code }).lean();

      if (!url) {
        return sendError(res, 404, "NOT_FOUND", `URL "${code}" not found`);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const [result] = await Click.aggregate<{
        totalClicks: Array<{ count: number }>;
        clicksPerDay: Array<{ date: string; clicks: number }>;
        byReferrer: Array<{ referrer: string; clicks: number }>;
      }>([
        { $match: { shortCode: code } },
        {
          $facet: {
            totalClicks: [{ $count: "count" }],
            clicksPerDay: [
              { $match: { clickedAt: { $gte: thirtyDaysAgo } } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$clickedAt",
                    },
                  },
                  clicks: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              {
                $project: {
                  _id: 0,
                  date: "$_id",
                  clicks: 1,
                },
              },
            ],
            byReferrer: [
              {
                $group: {
                  _id: { $ifNull: ["$referrer", "direct"] },
                  clicks: { $sum: 1 },
                },
              },
              { $sort: { clicks: -1 } },
              {
                $project: {
                  _id: 0,
                  referrer: "$_id",
                  clicks: 1,
                },
              },
            ],
          },
        },
      ]);

      return res.json({
        shortCode: code,
        originalUrl: url.originalUrl,
        totalClicks: result?.totalClicks[0]?.count ?? 0,
        clicksPerDay: result?.clicksPerDay ?? [],
        byReferrer: result?.byReferrer ?? [],
      });
    } catch (error) {
      next(error);
    }
  },
);

router.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    sendError(
      res,
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  },
);

export default router;
