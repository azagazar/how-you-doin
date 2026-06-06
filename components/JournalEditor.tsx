"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect, useRef, useState, useCallback } from "react"
import { useI18n } from "@/lib/i18n"

// Extend Window with WebSpeech API types
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

type Props = {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

type VoiceState = "idle" | "listening" | "error"

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function JournalEditor({ content, onChange, placeholder }: Props) {
  const { lang, t } = useI18n()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? t("home.journalPlaceholders.0") }),
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

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const voiceStateRef = useRef<VoiceState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)

  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognitionConstructor())
  }, [])

  const updateVoiceState = useCallback((state: VoiceState) => {
    voiceStateRef.current = state
    setVoiceState(state)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    updateVoiceState("idle")
  }, [updateVoiceState])

  const startListening = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor()
    if (!Constructor || !editor) return

    const recognition = new Constructor()
    recognition.lang = lang === "pl" ? "pl-PL" : "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => updateVoiceState("listening")

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ""
      if (transcript) {
        const currentText = editor.getText().trim()
        editor.commands.focus("end")
        editor.commands.insertContent((currentText ? " " : "") + transcript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let msg = t("voice.errorGeneric")
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        msg = t("voice.errorPermission")
      } else if (event.error === "no-speech") {
        msg = t("voice.errorNoSpeech")
      }
      setErrorMsg(msg)
      updateVoiceState("error")
      setTimeout(() => {
        if (voiceStateRef.current === "error") {
          updateVoiceState("idle")
          setErrorMsg("")
        }
      }, 3500)
    }

    recognition.onend = () => {
      if (voiceStateRef.current === "listening") {
        updateVoiceState("idle")
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setErrorMsg(t("voice.errorGeneric"))
      updateVoiceState("error")
      setTimeout(() => {
        if (voiceStateRef.current === "error") {
          updateVoiceState("idle")
          setErrorMsg("")
        }
      }, 3500)
    }
  }, [lang, editor, t, updateVoiceState])

  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  return (
    <div className="border border-[#6a4f79] border-b-4 bg-[#faf8f4]">
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>

      <div className="border-t border-[#6a4f79]/20 px-3 py-2 flex items-center justify-between min-h-[44px]">
        {speechSupported ? (
          <>
            <span
              className={`font-serif text-sm transition-opacity duration-200 ${
                voiceState === "listening"
                  ? "opacity-100 text-[#6a4f79] animate-pulse"
                  : voiceState === "error"
                  ? "opacity-100 text-red-500"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {voiceState === "listening" ? t("voice.listening") : errorMsg || " "}
            </span>

            <button
              type="button"
              onClick={voiceState === "listening" ? stopListening : startListening}
              disabled={voiceState === "error"}
              aria-label={voiceState === "listening" ? t("voice.stop") : t("voice.start")}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors touch-manipulation ${
                voiceState === "listening"
                  ? "bg-red-500 border-red-500 text-white"
                  : "border-[#6a4f79] text-[#6a4f79] hover:bg-[#6a4f79] hover:text-white active:bg-[#6a4f79] active:text-white"
              }`}
            >
              {voiceState === "listening" ? <StopIcon /> : <MicIcon />}
            </button>
          </>
        ) : (
          <p className="font-serif text-xs text-gray-400 italic">{t("voice.notSupported")}</p>
        )}
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}
