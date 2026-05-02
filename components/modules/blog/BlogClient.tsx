'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { blogKeys, fetchAllBlogPosts, BLOG_ADMIN_PAGE_SIZE } from '@/lib/queries/blog.queries'
import { deleteBlogPost, toggleBlogPublished } from '@/app/[locale]/admin/blog/actions'
import type { BlogPost } from '@/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface BlogClientProps {
  locale: string
}

export function BlogClient({ locale }: BlogClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [page, setPage] = useState(0)

  const { data: result, isLoading } = useQuery({
    queryKey: blogKeys.adminPosts(page),
    queryFn: () => fetchAllBlogPosts(page),
    placeholderData: (prev) => prev,
  })

  const posts = result?.posts ?? []
  const total = result?.total ?? 0
  const pageCount = Math.ceil(total / BLOG_ADMIN_PAGE_SIZE)
  const publishedCount = posts.filter((p) => p.is_published).length

  const toggleMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) => toggleBlogPublished(id, val),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
    },
    onError: () => toast.error('Bir hata oluştu'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return }
      toast.success('Blog yazısı silindi')
      queryClient.invalidateQueries({ queryKey: blogKeys.all })
      setDeleteTarget(null)
      if (posts.length === 1 && page > 0) setPage((p) => p - 1)
    },
    onError: () => toast.error('Silme işlemi başarısız'),
  })

  const confirmDelete = () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeletingId(null) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Yönetimi</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} yazı · {publishedCount} yayında
          </p>
        </div>
        <Link href={`/${locale}/admin/blog/new`} className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Yazı
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center bg-muted/20">
          <p className="text-muted-foreground">Henüz blog yazısı yok.</p>
          <Link href={`/${locale}/admin/blog/new`} className={buttonVariants({ variant: 'outline' }) + ' mt-4'}>
            <Plus className="h-4 w-4 mr-2" /> İlk yazıyı oluştur
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[36%]">Başlık</TableHead>
                  <TableHead>Yazar</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Etiketler</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Okuma</span>
                  </TableHead>
                  <TableHead>Yayın</TableHead>
                  <TableHead className="text-right w-[140px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{post.title_tr}</p>
                        <p className="text-xs text-muted-foreground font-mono">{post.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{post.author_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {post.published_at
                        ? format(new Date(post.published_at), 'd MMM yyyy', { locale: tr })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] py-0 px-1.5">
                            <Tag className="h-2.5 w-2.5 mr-0.5" />{tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">+{post.tags.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.reading_time_minutes ? `${post.reading_time_minutes} dk` : '—'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={post.is_published}
                        onCheckedChange={(val) => toggleMutation.mutate({ id: post.id, val })}
                        disabled={toggleMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-foreground"
                          title="Sitede görüntüle"
                          onClick={() => window.open(`/${locale}/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-foreground"
                          title="Düzenle"
                          onClick={() => router.push(`/${locale}/admin/blog/${post.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          title="Sil"
                          onClick={() => setDeleteTarget(post)}
                          disabled={deletingId === post.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total} yazı · Sayfa {page + 1} / {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Yazıyı sil</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  <span className="font-medium text-foreground">&quot;{deleteTarget.title_tr}&quot;</span> kalıcı olarak silinecek.
                  Bu işlem geri alınamaz.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingId !== null}
            >
              Evet, sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
