import { useState } from 'react';
import { CopyIcon } from 'lucide-react';
import { useFormik } from 'formik';
import { ApiError, createShortUrl, type UrlResponse } from '@/api/trim';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BLOCKED_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:']);

interface CreateUrlFormProps {
  onSuccess?: () => void;
}

type FormValues = {
  longUrl: string;
  customAlias: string;
};

export function CreateUrlForm({ onSuccess }: CreateUrlFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<UrlResponse | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      longUrl: '',
      customAlias: '',
    },
    validate(values) {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      const trimmed = values.longUrl.trim();

      if (!trimmed) {
        errors.longUrl = 'Long URL is required';
      } else {
        try {
          const parsed = new URL(trimmed);

          if (BLOCKED_SCHEMES.has(parsed.protocol)) {
            errors.longUrl = 'javascript: and data: URLs are not allowed';
          } else if (
            parsed.protocol !== 'http:' &&
            parsed.protocol !== 'https:'
          ) {
            errors.longUrl = 'URL must use http or https';
          }
        } catch {
          errors.longUrl = 'Enter a valid URL';
        }
      }

      const alias = values.customAlias.trim();
      if (alias && !/^[a-zA-Z0-9_-]+$/.test(alias)) {
        errors.customAlias =
          'Alias may only contain letters, numbers, hyphens, and underscores';
      } else if (alias.length > 64) {
        errors.customAlias = 'Alias must be at most 64 characters';
      }

      return errors;
    },
    async onSubmit(values, helpers) {
      setError(null);

      try {
        const result = await createShortUrl(
          values.longUrl.trim(),
          values.customAlias.trim() ? values.customAlias.trim() : undefined,
        );
        setCreatedUrl(result);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Failed to shorten URL',
        );
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  async function handleCopy() {
    if (!createdUrl) {
      return;
    }

    setIsCopying(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(createdUrl.shortUrl);
      formik.resetForm();
      setCreatedUrl(null);
      onSuccess?.();
    } catch {
      setError('Failed to copy to clipboard');
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
      <DialogHeader className="space-y-3">
        <span className="section-kicker w-fit bg-muted/40">New link</span>
        <div className="space-y-1">
          <DialogTitle className="text-xl sm:text-2xl">
            Shorten a URL
          </DialogTitle>
          <DialogDescription className="max-w-md">
            Paste a long link, optionally choose a custom alias, and get a
            polished short link in seconds.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="grid gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {createdUrl ? (
          <div className="surface rounded-[1.25rem] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="section-kicker w-fit bg-background/70">Ready</p>
                <p className="text-sm text-muted-foreground">
                  Your short link is live and ready to share.
                </p>
              </div>
              <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Trimmed
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor="shortUrl">Your short link</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="shortUrl"
                  readOnly
                  value={createdUrl.shortUrl}
                  className="font-mono text-[0.95rem]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={isCopying}
                  className="sm:min-w-28"
                >
                  <CopyIcon />
                  {isCopying ? 'Copying...' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 rounded-[1.25rem] border border-border/70 bg-background/60 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="grid gap-2">
              <Label htmlFor="longUrl">Long URL</Label>
              <Input
                id="longUrl"
                name="longUrl"
                type="url"
                placeholder="https://example.com"
                value={formik.values.longUrl}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={
                  (formik.touched.longUrl || formik.submitCount > 0) &&
                  formik.errors.longUrl
                    ? true
                    : undefined
                }
                className="h-10 bg-background/80"
              />
              {(formik.touched.longUrl || formik.submitCount > 0) &&
              formik.errors.longUrl ? (
                <p className="text-xs text-destructive">
                  {formik.errors.longUrl}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customAlias">Custom alias (optional)</Label>
              <div className="space-y-1.5">
                <Input
                  id="customAlias"
                  name="customAlias"
                  placeholder="my-link"
                  value={formik.values.customAlias}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="h-10 bg-background/80 font-mono"
                  aria-invalid={
                    (formik.touched.customAlias || formik.submitCount > 0) &&
                    formik.errors.customAlias
                      ? true
                      : undefined
                  }
                />
                {(formik.touched.customAlias || formik.submitCount > 0) &&
                formik.errors.customAlias ? (
                  <p className="text-xs text-destructive">
                    {formik.errors.customAlias}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Use letters, numbers, hyphens, or underscores. Keep it short
                  and memorable.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!createdUrl ? (
        <DialogFooter className="mt-1">
          <Button
            type="submit"
            disabled={formik.isSubmitting}
            className="min-w-36"
          >
            {formik.isSubmitting ? 'Creating...' : 'Create short link'}
          </Button>
        </DialogFooter>
      ) : null}
    </form>
  );
}
