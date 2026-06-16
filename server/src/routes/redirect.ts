import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { Click } from '../models/Click.js';
import { Url } from '../models/Url.js';

const router = Router();

function getClientUrl(): string {
  return process.env.CLIENT_URL ?? 'http://localhost:5173';
}

router.get(
  '/:code',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;
      const shortCode = Array.isArray(code) ? code[0] : code;

      const url = await Url.findOne({ shortCode }).lean();

      if (!url) {
        const wantsHtml = Boolean(req.accepts('html'));

        if (wantsHtml) {
          return res.redirect(
            302,
            `${getClientUrl()}/404?code=${encodeURIComponent(shortCode ?? '')}`,
          );
        }

        return res.status(404).json({
          error: 'Link not found',
          code: 'NOT_FOUND',
        });
      }

      await Click.create({
        shortCode: shortCode ?? '',
        clickedAt: new Date(),
        referrer: req.get('referer') ?? null,
        userAgent: req.get('user-agent') ?? null,
        ip: req.ip ?? null,
      });

      // 302 (temporary) keeps clients from caching the redirect permanently;
      // 301 would let browsers skip us on repeat visits, missing clicks and
      // ignoring destination URL updates.
      return res.redirect(302, url.originalUrl);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
