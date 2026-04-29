'use client'

import { useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  blogPostId?: string
  disabled?: boolean
}

interface ToolButtonProps {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
  disabled?: boolean
}

function ToolButton({ active, onClick, children, title, disabled }: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className={cn('h-8 w-8', active && 'bg-primary/10 text-primary')}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}

export function TiptapEditor({ value, onChange, placeholder, blogPostId, disabled }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUploading = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'İçeriğinizi buraya yazın...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[320px] p-4 focus:outline-none',
      },
    },
  })

  const uploadImage = useCallback(async (file: File) => {
    if (isUploading.current) return
    isUploading.current = true
    try {
      const supabase = createClient()
      const prefix = blogPostId ?? crypto.randomUUID()
      const path = `blog/${prefix}/content/${Date.now()}.webp`

      const { error: uploadError } = await supabase.storage
        .from('bolena-cafe')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('bolena-cafe').getPublicUrl(path)
      editor?.chain().focus().setImage({ src: urlData.publicUrl }).run()
    } catch {
      toast.error('Görsel yüklenemedi')
    } finally {
      isUploading.current = false
    }
  }, [editor, blogPostId])

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadImage(file)
    e.target.value = ''
  }, [uploadImage])

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href as string | undefined
    const url = window.prompt('URL girin:', prev ?? '')
    if (url === null) return
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className={cn('rounded-lg border bg-background overflow-hidden', disabled && 'opacity-60 pointer-events-none')}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Kalın" disabled={disabled}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="İtalik" disabled={disabled}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Altı Çizili" disabled={disabled}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Üstü Çizili" disabled={disabled}>
          <Strikethrough className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Başlık 2" disabled={disabled}>
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Başlık 3" disabled={disabled}>
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Alıntı" disabled={disabled}>
          <Quote className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Sola Hizala" disabled={disabled}>
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Ortala" disabled={disabled}>
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Sağa Hizala" disabled={disabled}>
          <AlignRight className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Madde İşareti" disabled={disabled}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numaralı Liste" disabled={disabled}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Yatay Çizgi" disabled={disabled}>
          <Minus className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton onClick={setLink} active={editor.isActive('link')} title="Link Ekle" disabled={disabled}>
          <LinkIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => fileInputRef.current?.click()} active={false} title="Görsel Ekle" disabled={disabled}>
          <ImageIcon className="h-4 w-4" />
        </ToolButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Geri Al" disabled={disabled}>
          <Undo className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Yinele" disabled={disabled}>
          <Redo className="h-4 w-4" />
        </ToolButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
          cursor: default;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid hsl(var(--primary));
        }
        .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1rem;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  )
}
