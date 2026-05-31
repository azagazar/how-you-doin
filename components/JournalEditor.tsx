"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect } from "react"

type Props = {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function JournalEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "What's on your mind today?" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm max-w-none focus:outline-none min-h-[120px] text-[#2C1A0E]",
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className="rounded-xl border-2 border-[#E8DDD0] bg-white/70 px-4 py-3 focus-within:border-[#6B4F7A] transition-colors">
      <EditorContent editor={editor} />
    </div>
  )
}
