'use client'

import { useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { blogSchema } from '@/lib/validations/blog.schema'
import type { BlogInput } from '@/lib/validations/blog.schema'
import { createBlogPost, updateBlogPost } from '@/app/[locale]/admin/blog/actions'
import { TiptapEditor } from './TiptapEditor'
import type { BlogPost } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  ImageIcon,
  Loader2,
  Trash2,
  Plus,
  X,
  Globe,
  Search,
  CalendarDays,
  User,
  Hash,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogFormProps {
  post?: BlogPost
  locale: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

export function BlogForm({ post, locale }: BlogFormProps) {
  const t = useTranslations('blog')
  const steps = useMemo(
    () =>
      [
        { key: 'tr' as const, label: t('stepTurkish') },
        { key: 'en' as const, label: t('stepEnglish') },
        { key: 'seo' as const, label: t('stepSeo') },
        { key: 'settings' as const, label: t('stepSettings') },
      ] as const,
    [t]
  )
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(post?.cover_image_url ?? null)
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [kwInput, setKwInput] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const pendingCoverPath = useRef<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isDirty },
  } = useForm<BlogInput>({
    resolver: zodResolver(blogSchema) as Resolver<BlogInput>,
    defaultValues: {
      slug: post?.slug ?? '',
      title_tr: post?.title_tr ?? '',
      title_en: post?.title_en ?? '',
      content_tr: post?.content_tr ?? '',
      content_en: post?.content_en ?? '',
      excerpt_tr: post?.excerpt_tr ?? '',
      excerpt_en: post?.excerpt_en ?? '',
      cover_image_url: post?.cover_image_url ?? '',
      author_name: post?.author_name ?? '',
      published_at: post?.published_at ?? new Date().toISOString().slice(0, 10),
      is_published: post?.is_published ?? false,
      tags: post?.tags ?? [],
      meta_title: post?.meta_title ?? '',
      meta_description: post?.meta_description ?? '',
      focus_keywords: post?.focus_keywords ?? [],
    },
  })

  const tags = watch('tags')
  const focusKeywords = watch('focus_keywords')
  const isPublished = watch('is_published')
  const metaTitle = watch('meta_title')
  const metaDescription = watch('meta_description')

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!post && !watch('slug')) {
      setValue('slug', slugify(e.target.value), { shouldDirty: true })
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCoverUploading(true)
    try {
      const supabase = createClient()
      if (pendingCoverPath.current) {
        await supabase.storage.from('bolena-cafe').remove([pendingCoverPath.current])
      }
      const prefix = post?.id ?? crypto.randomUUID()
      const path = `blog/${prefix}/cover/${Date.now()}.webp`
      const { error } = await supabase.storage.from('bolena-cafe').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('bolena-cafe').getPublicUrl(path)
      pendingCoverPath.current = path
      setValue('cover_image_url', urlData.publicUrl, { shouldDirty: true })
      setCoverPreview(urlData.publicUrl)
    } catch {
      toast.error('Kapak görseli yüklenemedi')
    } finally {
      setIsCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveCover = async () => {
    if (coverPreview) {
      const supabase = createClient()
      const match = coverPreview.match(/bolena-cafe\/(.+)$/)
      if (match) {
        await supabase.storage.from('bolena-cafe').remove([match[1]])
      }
    }
    pendingCoverPath.current = null
    setValue('cover_image_url', '', { shouldDirty: true })
    setCoverPreview(null)
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed || tags.includes(trimmed)) { setTagInput(''); return }
    setValue('tags', [...tags, trimmed], { shouldDirty: true })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag), { shouldDirty: true })
  }

  const addKeyword = () => {
    const trimmed = kwInput.trim()
    if (!trimmed || focusKeywords.includes(trimmed)) { setKwInput(''); return }
    setValue('focus_keywords', [...focusKeywords, trimmed], { shouldDirty: true })
    setKwInput('')
  }

  const removeKeyword = (kw: string) => {
    setValue('focus_keywords', focusKeywords.filter((k) => k !== kw), { shouldDirty: true })
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) setStep(index)
  }

  const handleNext = async () => {
    if (step === 0) {
      const ok = await trigger(['title_tr', 'content_tr'])
      if (!ok) {
        toast.error('Lütfen Türkçe başlık ve içeriği doldurun')
        return
      }
    }
    if (step < steps.length - 1) setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const onSubmit = async (data: BlogInput) => {
    setIsLoading(true)
    try {
      const result = post
        ? await updateBlogPost(post.id, data)
        : await createBlogPost(data)

      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(post ? 'Blog yazısı güncellendi' : 'Blog yazısı oluşturuldu')
      router.push(`/${locale}/admin/blog`)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const isLastStep = step === steps.length - 1
  const progressPct = ((step + 1) / steps.length) * 100

  return (
    <form
      className="flex w-full min-w-0 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        if (step !== steps.length - 1) return
        void handleSubmit(onSubmit)(e)
      }}
    >
      <div className="w-full space-y-5">
        <header className="space-y-1.5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t('formPageEyebrow')}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
            {post ? t('formEditHeading') : t('formCreateHeading')}
          </h1>
        </header>

        <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/35 to-muted/10 px-3 py-3 shadow-sm ring-1 ring-border/40 sm:px-5 sm:py-4">
          <div className="mx-auto mb-3 flex max-w-md items-center gap-3">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/90">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {step + 1}/{steps.length}
            </span>
          </div>
          <div
            className="mt-2 flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label={t('formStepsAria')}
          >
            {steps.map((s, i) => {
              const active = i === step
              const done = i < step
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => goToStep(i)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active &&
                      'border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20',
                    done && !active && 'border-primary/25 bg-primary/5 text-primary/90',
                    !active && !done && 'border-border/40 bg-background/90 text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      active && 'bg-primary text-primary-foreground',
                      done && !active && 'bg-primary/20 text-primary',
                      !active && !done && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
        {/* Step: TR */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-2">
              <Label htmlFor="title_tr">Başlık (TR) <span className="text-destructive">*</span></Label>
              <Input
                id="title_tr"
                {...register('title_tr')}
                onBlur={handleTitleBlur}
                placeholder="Blog yazısının başlığı"
                className="h-11"
              />
              {errors.title_tr && <p className="text-sm text-destructive">{errors.title_tr.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt_tr">Özet (TR)</Label>
              <Textarea
                id="excerpt_tr"
                {...register('excerpt_tr')}
                placeholder="Yazının kısa özeti — liste kartında gösterilir (maks. 300 karakter)"
                rows={3}
              />
              {errors.excerpt_tr && <p className="text-sm text-destructive">{errors.excerpt_tr.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>İçerik (TR) <span className="text-destructive">*</span></Label>
              <Controller
                name="content_tr"
                control={control}
                render={({ field }) => (
                  <TiptapEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="İçeriğinizi buraya yazın..."
                    blogPostId={post?.id}
                  />
                )}
              />
              {errors.content_tr && <p className="text-sm text-destructive">{errors.content_tr.message}</p>}
            </div>
          </div>
        )}

        {/* Step: EN */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/30 px-4 py-3">
              İngilizce alanlar isteğe bağlıdır. Boş bırakırsanız sitede yalnızca Türkçe içerik gösterilir.
            </p>
            <div className="space-y-2">
              <Label htmlFor="title_en">Title (EN)</Label>
              <Input id="title_en" {...register('title_en')} placeholder="Blog post title in English" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt_en">Excerpt (EN)</Label>
              <Textarea
                id="excerpt_en"
                {...register('excerpt_en')}
                placeholder="Short summary shown in listing cards (max 300 chars)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Content (EN)</Label>
              <Controller
                name="content_en"
                control={control}
                render={({ field }) => (
                  <TiptapEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Write your content here..."
                    blogPostId={post?.id}
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Step: SEO */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2 shadow-inner">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-3 w-3" /> Google Önizleme
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-[15px] font-medium line-clamp-1">
                {metaTitle || watch('title_tr') || 'Yazı Başlığı'}
              </p>
              <p className="text-green-700 dark:text-green-500 text-xs">
                {`bolena.com/${locale}/blog/${watch('slug') || 'slug'}`}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metaDescription || watch('excerpt_tr') || 'Yazı açıklaması burada görünecek.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_title">
                SEO Başlığı
                <span className="ml-2 text-xs text-muted-foreground">({(metaTitle ?? '').length}/60)</span>
              </Label>
              <Input
                id="meta_title"
                {...register('meta_title')}
                placeholder="Arama sonuçlarında görünecek başlık"
                maxLength={60}
                className="h-11"
              />
              {errors.meta_title && <p className="text-sm text-destructive">{errors.meta_title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">
                Meta Açıklama
                <span className="ml-2 text-xs text-muted-foreground">({(metaDescription ?? '').length}/160)</span>
              </Label>
              <Textarea
                id="meta_description"
                {...register('meta_description')}
                placeholder="Arama sonuçlarında görünecek açıklama"
                rows={3}
                maxLength={160}
              />
              {errors.meta_description && <p className="text-sm text-destructive">{errors.meta_description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Anahtar Kelimeler
              </Label>
              <div className="flex gap-2">
                <Input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
                  placeholder="glutensiz, çölyak, sağlıklı..."
                  className="h-11"
                />
                <Button type="button" variant="outline" size="icon" className="shrink-0 h-11 w-11" onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {focusKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {focusKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => removeKeyword(kw)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Settings */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) <span className="text-destructive">*</span></Label>
              <div className="flex items-center rounded-lg border overflow-hidden shadow-sm">
                <span className="px-3 py-2.5 text-sm bg-muted text-muted-foreground border-r select-none whitespace-nowrap">
                  {locale}/blog/
                </span>
                <Input
                  id="slug"
                  {...register('slug')}
                  className="border-0 rounded-none focus-visible:ring-0 h-11"
                  placeholder="blog-yazi-slug"
                />
              </div>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Yazar <span className="text-destructive">*</span>
              </Label>
              <Input id="author_name" {...register('author_name')} placeholder="Ad Soyad" className="h-11" />
              {errors.author_name && <p className="text-sm text-destructive">{errors.author_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="published_at" className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Yayın Tarihi
              </Label>
              <Input id="published_at" type="date" {...register('published_at')} className="h-11 max-w-xs" />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Kapak Görseli
              </Label>
              {coverPreview ? (
                <div className="relative group w-full aspect-[16/7] rounded-xl overflow-hidden border shadow-sm">
                  <Image src={coverPreview} alt="Kapak" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button type="button" variant="destructive" size="sm" onClick={handleRemoveCover}>
                      <Trash2 className="h-4 w-4 mr-1.5" /> Kaldır
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isCoverUploading}
                  className={cn(
                    'w-full aspect-[16/7] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors',
                    isCoverUploading && 'opacity-50 pointer-events-none'
                  )}
                >
                  {isCoverUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm font-medium">Kapak görseli yükle</span>
                      <span className="text-xs opacity-60">JPG, PNG, WEBP</span>
                    </>
                  )}
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Etiketler
              </Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="glutensiz, sağlık, tarif..."
                  className="h-11"
                />
                <Button type="button" variant="outline" size="icon" className="shrink-0 h-11 w-11" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1 pr-1">
                      {tag}
                      <button type="button" className="rounded p-0.5 hover:bg-muted" onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-2" />

            <div className="rounded-2xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 via-background to-muted/30 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-base">Yayında</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublished
                      ? 'Yazı herkese açık sitede listelenir ve URL ile erişilebilir.'
                      : 'Taslak: ziyaretçiler bu yazıyı görmez; yayıma almak için açın.'}
                  </p>
                </div>
                <Controller
                  name="is_published"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="scale-110"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

        {/* Alt aksiyonlar — sayfa kaydırılır; çubuk altta yapışkan kalabilir */}
        <div
          className={cn(
            'sticky bottom-3 z-20 mx-2 mt-8 shrink-0 sm:mx-4',
            'rounded-full border border-border/80 bg-background/95 px-3 py-3 shadow-lg backdrop-blur-md',
            'supports-[backdrop-filter]:bg-background/90',
            'dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-3">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-5 bg-muted hover:bg-muted/80 border border-border/60 shadow-sm"
              onClick={() => router.push(`/${locale}/admin/blog`)}
            >
              İptal
            </Button>

            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
              {step > 0 && (
                <Button type="button" variant="outline" className="gap-1 rounded-full" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                  Geri
                </Button>
              )}

              {!isLastStep && (
                <Button type="button" className="gap-1 rounded-full min-w-[7rem]" onClick={handleNext}>
                  İleri
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {isLastStep && (
                <Button type="submit" disabled={isLoading || !isDirty} className="gap-2 rounded-full min-w-[8rem]">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {post ? 'Güncelle' : 'Oluştur'}
                </Button>
              )}
            </div>
          </div>
        </div>
    </form>
  )
}
