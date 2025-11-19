/* eslint-disable no-empty */
import { useCallback, useEffect, useRef, useState } from "react"
import Vapi from "@vapi-ai/web"

/**
 * Hook VAPI Agent - Realtime Voice Chat
 * Giống Konnect, dùng VAPI SDK thật
 * ------------------------------------------------
 * EXPOSE:
 * - callStatus      : "idle" | "connecting" | "active" | "ended"
 * - activeSpeaker   : "user" | "assistant" | null
 * - history         : [{ role, text, at }]
 * - liveTurn        : { role, text } | null
 * - startCall()     : () => void
 * - stopCall()      : () => void
 */

export function useVAPIAgent() {
  const vapiRef = useRef(null)

  // Core states
  const [callStatus, setCallStatus] = useState("idle")
  const [activeSpeaker, setActiveSpeaker] = useState(null)
  const [history, setHistory] = useState([])
  const [liveTurn, setLiveTurn] = useState(null)

  // Timer for auto-clear speaker
  const clearSpeakerTimeoutRef = useRef(null)

  // Set active speaker and auto-clear after 1s
  const bumpActiveSpeaker = useCallback((role) => {
    setActiveSpeaker(role)
    if (clearSpeakerTimeoutRef.current) {
      clearTimeout(clearSpeakerTimeoutRef.current)
    }
    clearSpeakerTimeoutRef.current = setTimeout(() => {
      setActiveSpeaker(null)
    }, 1000)
  }, [])

  // Handle partial transcript
  const handlePartial = useCallback(
    ({ role, text }) => {
      if (!text?.trim()) return

      bumpActiveSpeaker(role)

      setLiveTurn((prev) => {
        if (prev && prev.role === role) {
          return { role, text }
        }
        return { role, text }
      })
    },
    [bumpActiveSpeaker]
  )

  // Handle final transcript
  const handleFinal = useCallback(
    async ({ role, text }) => {
      if (!text?.trim()) return

      bumpActiveSpeaker(role)

      // Clear live turn if same speaker
      setLiveTurn((prev) => {
        if (prev && prev.role === role) {
          return null
        }
        return prev
      })

      setHistory((prev) => {
        // Prevent duplicate assistant messages
        const last = prev[prev.length - 1]
        if (
          role === "assistant" &&
          last &&
          last.role === "assistant" &&
          last.text === text
        ) {
          return prev
        }

        return [
          ...prev,
          {
            role,
            text,
            at: Date.now(),
          },
        ]
      })
    },
    [bumpActiveSpeaker]
  )

  // Init VAPI client once
  useEffect(() => {
    if (vapiRef.current) return
    
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY
    if (!publicKey) {
      console.error("VITE_VAPI_PUBLIC_KEY is missing")
      return
    }

    console.log("[EstageGo VAPI] Public Key =", publicKey)

    const client = new Vapi(publicKey)
    vapiRef.current = client

    // Call start
    client.on("call-start", () => {
      console.log("[VAPI] call-start")
      setCallStatus("active")
      setHistory([])
      setLiveTurn(null)
      setActiveSpeaker(null)
    })

    // Call end
    client.on("call-end", (payload) => {
      console.log("[VAPI] call-end", payload)
      setCallStatus("ended")
      setLiveTurn(null)
      setActiveSpeaker(null)
    })

    // Message events
    client.on("message", (evt) => {
      console.log("[VAPI] message", evt)
      const t = evt?.type

      // Speech update (who is speaking)
      if (t === "speech-update") {
        const role = evt?.role === "assistant" ? "assistant" : "user"
        if (evt?.status === "started") bumpActiveSpeaker(role)
        return
      }

      // Transcript (user speech)
      if (t === "transcript") {
        const role = evt?.role === "assistant" ? "assistant" : "user"
        const text = evt?.transcript || evt?.text || ""
        const final = evt?.transcriptType === "final" || !!evt?.final
        if (!text) return
        return final
          ? handleFinal({ role, text })
          : handlePartial({ role, text })
      }

      // Model output (assistant response)
      if (t === "model-output") {
        const role = "assistant"
        const text = evt?.content || evt?.text || evt?.message || ""
        const final = !!evt?.final
        if (!text) return
        return final
          ? handleFinal({ role, text })
          : handlePartial({ role, text })
      }

      // Voice input
      if (t === "voice-input") {
        if (typeof evt?.transcript === "string") {
          const role = "user"
          const text = evt.transcript
          const final = !!evt?.final
          if (!text) return
          return final
            ? handleFinal({ role, text })
            : handlePartial({ role, text })
        }
        if (typeof evt?.input === "string") {
          return handleFinal({ role: "assistant", text: evt.input })
        }
        return
      }
    })

    client.on("error", async (err) => {
      console.error("[VAPI error]", err)
      if (err?.error && err.error.json) {
        try {
          const detail = await err.error.json()
          console.error("[VAPI error details]", detail)
        } catch {}
      }
    })
  }, [handleFinal, handlePartial, bumpActiveSpeaker])

  // Start call
  const startCall = useCallback(async () => {
    if (!vapiRef.current) return

    const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID
    console.log("[EstageGo VAPI] Starting call with assistant =", assistantId)

    if (!assistantId) {
      console.error("VITE_VAPI_ASSISTANT_ID is missing")
      return
    }

    try {
      setCallStatus("connecting")
      await vapiRef.current.start(assistantId)
    } catch (err) {
      console.error("[VAPI] startCall error:", err)
      if (err?.error && err.error.json) {
        try {
          const detail = await err.error.json()
          console.error("[VAPI detailed error]", detail)
        } catch {}
      }
      setCallStatus("idle")
    }
  }, [])

  // Stop call
  const stopCall = useCallback(() => {
    if (!vapiRef.current) return
    try {
      vapiRef.current.stop()
    } catch (err) {
      console.error("[VAPI] stopCall error:", err)
    }
  }, [])

  return {
    callStatus,
    activeSpeaker,
    history,
    liveTurn,
    startCall,
    stopCall,
  }
}
