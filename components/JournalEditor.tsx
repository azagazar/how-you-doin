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
      Placeholder.configure({ placeholder: placeholder ?? "Co warto zapamiętać z dzisiejszego dnia?" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "tiptap font-serif text-base focus:outline-none min-h-[140px] text-black",
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className="border border-[#6a4f79] border-b-4 bg-[#faf8f4] px-4 py-3">
      <EditorContent editor={editor} />
    </div>
  )
}
