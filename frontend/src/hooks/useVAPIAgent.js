/* eslint-disable no-empty */
import { useCallback, useEffect, useRef, useState } from "react"
import Vapi from "@vapi-ai/web"
import { sendVAPIMessage, getVAPIGreeting } from "@/apis/vapiAPI"

/**
 * Hook VAPI Agent - Hybrid Mode
 * VAPI handles voice I/O, Backend handles AI response with database knowledge
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
  
  // Flag to track if we sent backend greeting (to ignore VAPI's greeting)
  const backendGreetingSentRef = useRef(false)

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

  // Get AI response from backend (with database + route knowledge)
  const getBackendResponse = useCallback(async (userText, currentHistory) => {
    try {
      bumpActiveSpeaker("assistant")
      
      // Show live turn
      setLiveTurn({ role: "assistant", text: "" })

      // Call OUR backend (has database knowledge)
      const historyForBackend = currentHistory.map(h => ({
        role: h.role,
        content: h.text
      }))

      const response = await sendVAPIMessage(userText, historyForBackend)

      if (response.success) {
        const aiText = response.response || "Xin lỗi, tôi không hiểu."
        
        // Simulate streaming for better UX
        const words = aiText.split(" ")
        for (let i = 0; i < words.length; i++) {
          const partial = words.slice(0, i + 1).join(" ")
          setLiveTurn({ role: "assistant", text: partial })
          await new Promise(resolve => setTimeout(resolve, 30))
        }

        // Finalize
        setLiveTurn(null)
        setHistory((prev) => [...prev, {
          role: "assistant",
          text: aiText,
          at: Date.now(),
        }])

        // Use VAPI to SPEAK the response (but don't use VAPI AI)
        if (vapiRef.current) {
          try {
            // VAPI say() method to speak custom text
            vapiRef.current.say(aiText)
          } catch (err) {
            console.error("[VAPI] say() error:", err)
            // Fallback to browser TTS
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel()
              const utterance = new SpeechSynthesisUtterance(aiText)
              utterance.lang = 'vi-VN'
              window.speechSynthesis.speak(utterance)
            }
          }
        }
      }
    } catch (error) {
      console.error("[Backend] Error getting AI response:", error)
      setLiveTurn(null)
    }
  }, [bumpActiveSpeaker])

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

      // Add user message to history
      const newMessage = {
        role,
        text,
        at: Date.now(),
      }

      setHistory((prev) => {
        // Prevent duplicate messages
        const last = prev[prev.length - 1]
        if (last && last.role === role && last.text === text) {
          return prev
        }
        return [...prev, newMessage]
      })

      // If user spoke, get AI response from OUR backend (with database knowledge)
      if (role === "user") {
        // Pass updated history (including the new user message)
        const updatedHistory = [...history, newMessage]
        await getBackendResponse(text, updatedHistory)
      }
    },
    [bumpActiveSpeaker, history, getBackendResponse]
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
    client.on("call-start", async () => {
      console.log("[VAPI] call-start")
      setCallStatus("active")
      setHistory([])
      setLiveTurn(null)
      setActiveSpeaker(null)

      // Reset greeting flag
      backendGreetingSentRef.current = false

      // Get greeting from OUR backend (with ESTAGEGO AI identity)
      try {
        const greetingResponse = await getVAPIGreeting()
        if (greetingResponse.success && greetingResponse.greeting) {
          const greetingText = greetingResponse.greeting
          
          console.log("[EstageGo] Backend greeting:", greetingText)
          
          // Mark that we sent backend greeting
          backendGreetingSentRef.current = true
          
          // Add greeting to history
          setHistory([{
            role: "assistant",
            text: greetingText,
            at: Date.now(),
          }])

          // Use VAPI to SPEAK the greeting (but greeting text is from OUR backend)
          if (client) {
            try {
              // VAPI say() method to speak our custom greeting
              client.say(greetingText)
              bumpActiveSpeaker("assistant")
            } catch (err) {
              console.error("[VAPI] say() error:", err)
              // Fallback to browser TTS
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()
                const utterance = new SpeechSynthesisUtterance(greetingText)
                utterance.lang = 'vi-VN'
                window.speechSynthesis.speak(utterance)
              }
            }
          }
        }
      } catch (error) {
        console.error("[Backend] Error getting greeting:", error)
        // Fallback greeting if backend fails
        const fallbackGreeting = "Xin chào! Tôi là EstageGo AI Assistant. Tôi có thể giúp gì cho bạn?"
        backendGreetingSentRef.current = true
        setHistory([{
          role: "assistant",
          text: fallbackGreeting,
          at: Date.now(),
        }])
        if (client) {
          try {
            client.say(fallbackGreeting)
          } catch (err) {
            console.error("[VAPI] say() fallback error:", err)
          }
        }
      }
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
        
        // Ignore assistant transcripts from VAPI (we use backend only)
        if (role === "assistant") {
          console.log("[VAPI] Ignoring assistant transcript from VAPI, using backend AI instead")
          return
        }
        
        return final
          ? handleFinal({ role, text })
          : handlePartial({ role, text })
      }

      // Model output (assistant response) - DISABLED
      // We handle AI response from our backend instead
      if (t === "model-output") {
        // Ignore VAPI's AI response, we use our own backend
        console.log("[VAPI] Ignoring model-output, using backend AI instead")
        return
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
