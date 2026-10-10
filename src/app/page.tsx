"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Upload,
  Send,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Layers,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import type { SupportedLanguage } from "@natlas/sdk";
import { CodeExportModal } from "../components/CodeExportModal";
import { PipelineCanvas } from "../components/PipelineCanvas";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Playground() {
  const [activeView, setActiveView] = useState<"chat" | "pipeline">("chat");
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("yoruba");
  const [toneEnforcement, setToneEnforcement] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // Audio recording state for Chat view
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll refs and handlers
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (chatContainerRef.current && isAtBottomRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages]);

  // 1. Send chat message
  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput("");
    setIsStreaming(true);

    // Ensure screen scrolls to bottom when user sends
    isAtBottomRef.current = true;
    scrollToBottom("smooth");

    // Placeholder for streaming reply
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          language,
          toneEnforcement,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let incomingBuffer = "";
      let renderedReply = "";
      let isStreamDone = false;

      // Smooth conversational typewriter drain loop
      await new Promise<void>((resolve, reject) => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        intervalId = setInterval(() => {
          if (incomingBuffer.length > 0) {
            // Adaptive drain rate: outputs tokens smoothly at human reading cadence
            const drainCount =
              incomingBuffer.length > 80
                ? 6
                : incomingBuffer.length > 30
                ? 3
                : 1;

            const slice = incomingBuffer.slice(0, drainCount);
            incomingBuffer = incomingBuffer.slice(drainCount);
            renderedReply += slice;

            setMessages((prev) => {
              const clone = [...prev];
              clone[clone.length - 1] = { role: "assistant", content: renderedReply };
              return clone;
            });
            scrollToBottom("auto");
          } else if (isStreamDone) {
            if (intervalId) clearInterval(intervalId);
            resolve();
          }
        }, 16);

        // Network reader consuming chunks
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                isStreamDone = true;
                break;
              }
              const chunk = decoder.decode(value, { stream: true });
              incomingBuffer += chunk;
            }
          } catch (readErr: unknown) {
            isStreamDone = true;
            if (intervalId) clearInterval(intervalId);
            reject(readErr);
          }
        })();
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error streaming response";
      setMessages((prev) => {
        const clone = [...prev];
        clone[clone.length - 1] = {
          role: "assistant",
          content: `[Connection error: ${errorMsg}. Make sure 'natlas serve' is running.]`,
        };
        return clone;
      });
      scrollToBottom("auto");
    } finally {
      setIsStreaming(false);
    }
  };

  // 2. Start microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied or not supported.");
    }
  };

  // 3. Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 4. Send audio to ASR endpoint
  const handleTranscribe = async (audioBlob: Blob): Promise<string | null> => {
    setIsTranscribing(true);
    setTranscribedText(null);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice_note.webm");
      formData.append("language", language);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as {
        text?: string;
        error?: string;
        traceback?: string;
      };
      if (data.text) {
        setTranscribedText(data.text);
        setInput(data.text);
        return data.text;
      }
      const errDetail = data.traceback
        ? `${data.error || "Transcription failed"}\n\nTraceback:\n${data.traceback}`
        : data.error || "Transcription failed";
      alert(errDetail);
      return null;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error sending audio to N-ATLAS ASR";
      alert(msg);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  // 5. Handle file upload in chat view
  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleTranscribe(file);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Hidden file input for chat view */}
      <input
        ref={chatFileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleChatFileUpload}
        className="hidden"
      />

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        language={language}
        toneEnforcement={toneEnforcement}
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* LEFT NAVIGATION SIDEBAR (Slide-over drawer on mobile, static on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 shrink-0 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
              ₦
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-bold text-slate-900">N-ATLAS Studio</h1>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  NAIC 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Nigeria&apos;s Sovereign AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="p-4 border-b border-slate-100">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Workspaces
          </label>
          <div className="flex flex-col space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveView("chat");
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                activeView === "chat"
                  ? "bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>Chat Stream</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("pipeline");
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                activeView === "pipeline"
                  ? "bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Visual Studio</span>
            </button>
          </div>
        </div>

        {/* Prompt Starters */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 px-1">
            Sample Prompts
          </label>

          <button
            type="button"
            onClick={() => {
              setLanguage("yoruba");
              setInput("Bawo ni mo se le da ile-iṣẹ mi silẹ ni Nigeria?");
              if (activeView !== "chat") setActiveView("chat");
              setIsMobileSidebarOpen(false);
            }}
            className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-all"
          >
            <p className="font-semibold text-emerald-800 text-[11px]">Yorùbá: Business</p>
            <p className="text-slate-500 mt-0.5 truncate text-[11px]">
              &ldquo;Bawo ni mo se le da ile-iṣẹ mi silẹ...&rdquo;
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage("hausa");
              setInput("Yaya ake shuka masara a lokacin damina?");
              if (activeView !== "chat") setActiveView("chat");
              setIsMobileSidebarOpen(false);
            }}
            className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-all"
          >
            <p className="font-semibold text-emerald-800 text-[11px]">Hausa: Agriculture</p>
            <p className="text-slate-500 mt-0.5 truncate text-[11px]">
              &ldquo;Yaya ake shuka masara a lokacin...&rdquo;
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage("igbo");
              setInput("Kọwaara m uru agụmakwụkwọ bara nye ụmụaka.");
              if (activeView !== "chat") setActiveView("chat");
              setIsMobileSidebarOpen(false);
            }}
            className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-all"
          >
            <p className="font-semibold text-emerald-800 text-[11px]">Igbo: Education</p>
            <p className="text-slate-500 mt-0.5 truncate text-[11px]">
              &ldquo;Kọwaara m uru agụmakwụkwọ bara...&rdquo;
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage("pidgin");
              setInput("How I fit start tech career for Lagos?");
              if (activeView !== "chat") setActiveView("chat");
              setIsMobileSidebarOpen(false);
            }}
            className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-all"
          >
            <p className="font-semibold text-emerald-800 text-[11px]">Pidgin: Career</p>
            <p className="text-slate-500 mt-0.5 truncate text-[11px]">
              &ldquo;How I fit start tech career for Lagos?&rdquo;
            </p>
          </button>
        </div>

        {/* SYSTEM DIAGNOSTICS AT BOTTOM OF SIDEBAR */}
        <div className="border-t border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System Diagnostics
            </span>
            <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between rounded-lg bg-white p-2 border border-slate-100 shadow-2xs">
              <span className="text-slate-500">LLM Model</span>
              <span className="font-semibold text-slate-800">Llama-3 8B</span>
            </div>
            <div className="flex justify-between rounded-lg bg-white p-2 border border-slate-100 shadow-2xs">
              <span className="text-slate-500">Voice ASR</span>
              <span className="font-semibold text-slate-800">NCAIR1 Whisper</span>
            </div>
            <div className="flex justify-between rounded-lg bg-white p-2 border border-slate-100 shadow-2xs">
              <span className="text-slate-500">SDK Target</span>
              <span className="font-semibold text-slate-800">@natlas/sdk</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE AREA */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 py-3 shadow-2xs">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 md:hidden shrink-0 shadow-2xs"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {activeView === "chat" ? "Multilingual Chat Stream" : "Visual Studio"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate">
                {activeView === "chat"
                  ? "Talk to N-ATLAS with real-time text and voice input"
                  : "Assemble task cards to chain speech, translation, and AI chat"}
              </p>
            </div>
          </div>

          {/* Top Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Export Code Button */}
            <button
              type="button"
              onClick={() => setIsCodeModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Export ready-to-run Python, TypeScript, and cURL code"
            >
              <Code2 className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Export Code</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center space-x-1">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="yoruba">Yorùbá</option>
                <option value="hausa">Hausa</option>
                <option value="igbo">Igbo</option>
                <option value="pidgin">Pidgin</option>
                <option value="english">English</option>
              </select>
            </div>

            {/* Tone Guard Toggle */}
            <button
              type="button"
              onClick={() => setToneEnforcement(!toneEnforcement)}
              className={`flex items-center space-x-1 rounded-xl border px-2 py-1.5 text-xs font-semibold transition-colors shadow-2xs ${
                toneEnforcement
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
              title="Toggle Dialect Tone Guard"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Tone: </span>
              <span>{toneEnforcement ? "ON" : "OFF"}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        {activeView === "pipeline" ? (
          <PipelineCanvas
            currentLanguage={language}
            toneEnforcement={toneEnforcement}
          />
        ) : (
          <main className="flex flex-1 flex-col overflow-hidden bg-slate-50/50">
            {/* Message Stream or Center Hero Greeting */}
            <div
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
                  <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white text-3xl sm:text-4xl font-black shadow-xl ring-8 ring-emerald-500/10 mb-5">
                    ₦
                  </div>

                  <div className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-100/90 px-3.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-800 border border-emerald-200/80 mb-3.5 shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Nigeria&apos;s Sovereign Multilingual AI • NAIC 2026</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3 max-w-2xl leading-tight">
                    <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 bg-clip-text text-transparent">
                      Ẹ n lẹ o! Sannu da zuwa! Nnọọ!
                    </span>
                  </h1>

                  <p className="max-w-lg text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                    I am <strong className="text-slate-900">N-ATLAS</strong>. Ask me anything in{" "}
                    <span className="text-emerald-700 font-semibold">Yorùbá</span>,{" "}
                    <span className="text-teal-700 font-semibold">Hausa</span>,{" "}
                    <span className="text-emerald-800 font-semibold">Igbo</span>,{" "}
                    <span className="text-amber-700 font-semibold">Nigerian Pidgin</span>, or{" "}
                    <span className="text-slate-800 font-semibold">English</span>, or record a voice note below.
                  </p>

                  {/* Dialect Highlights */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("yoruba");
                        setInput("Bawo ni mo se le da ile-iṣẹ mi silẹ ni Nigeria?");
                      }}
                      className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100/80 transition-colors shadow-2xs cursor-pointer"
                    >
                      🟢 Yorùbá: Tones & Accents
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("hausa");
                        setInput("Yaya ake shuka masara a lokacin damina?");
                      }}
                      className="rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-[11px] font-semibold text-teal-800 hover:bg-teal-100/80 transition-colors shadow-2xs cursor-pointer"
                    >
                      🟢 Hausa: Agriculture & Trade
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("igbo");
                        setInput("Kọwaara m uru agụmakwụkwọ bara nye ụmụaka.");
                      }}
                      className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100/80 transition-colors shadow-2xs cursor-pointer"
                    >
                      🟢 Igbo: Culture & Education
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage("pidgin");
                        setInput("How I fit start tech career for Lagos?");
                      }}
                      className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100/80 transition-colors shadow-2xs cursor-pointer"
                    >
                      🟢 Pidgin: Lagos Tech & Street
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[88%] sm:max-w-2xl rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">
                          {msg.content || (isStreaming ? "Thinking..." : "")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Voice Transcribed Banner */}
            {transcribedText && (
              <div className="mx-3 sm:mx-6 mb-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 shadow-2xs">
                <div className="flex items-center space-x-2 truncate mr-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Transcribed: <strong>{transcribedText}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSend(transcribedText)}
                    disabled={isStreaming}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscribedText(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="border-t border-slate-200 bg-white p-2.5 sm:p-4">
              <div className="mx-auto flex max-w-4xl items-center space-x-2 sm:space-x-3">
                {/* Record Mic */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-all shadow-sm ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  title={isRecording ? "Stop Recording" : "Record Voice Note"}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>

                {/* Upload Audio File */}
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-sm transition-colors"
                  title="Upload Audio File (.ogg, .opus, .wav, .webm)"
                >
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    isRecording
                      ? "Recording voice note..."
                      : isTranscribing
                      ? "Transcribing with NCAIR1..."
                      : `Ask N-ATLAS in ${
                          language.charAt(0).toUpperCase() + language.slice(1)
                        }...`
                  }
                  disabled={isStreaming || isRecording || isTranscribing}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="flex h-10 sm:h-11 shrink-0 items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 sm:px-5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <span className="hidden sm:inline">Send</span>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
