import { z } from 'zod'

export const blogSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug zorunludur')
    .regex(/^[a-z0-9-]+$/, 'Slug yalnızca küçük harf, rakam ve tire içerebilir'),
  title_tr: z.string().min(1, 'Türkçe başlık zorunludur'),
  title_en: z.string().nullish(),
  content_tr: z.string().min(1, 'Türkçe içerik zorunludur'),
  content_en: z.string().nullish(),
  excerpt_tr: z.string().max(300, 'Özet en fazla 300 karakter olabilir').nullish(),
  excerpt_en: z.string().max(300, 'Özet en fazla 300 karakter olabilir').nullish(),
  cover_image_url: z.string().nullish(),
  author_name: z.string().min(1, 'Yazar adı zorunludur'),
  published_at: z.string().nullish(),
  is_published: z.boolean().default(false),
  reading_time_minutes: z.number().int().min(1).nullish(),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().max(60, 'SEO başlığı en fazla 60 karakter olabilir').nullish(),
  meta_description: z.string().max(160, 'Meta açıklama en fazla 160 karakter olabilir').nullish(),
  focus_keywords: z.array(z.string()).default([]),
})

export type BlogInput = z.infer<typeof blogSchema>
