"use client";

import React, { useState, useRef } from "react";
import { Mic, MicOff, Upload, Send, Volume2, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import type { SupportedLanguage } from "@natlas/sdk";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Playground() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ẹ n lẹ o! Sannu da zuwa! Nnọọ! I am N-ATLAS, Nigeria's Sovereign Multilingual AI. Ask me anything in Yorùbá, Hausa, Igbo, Nigerian Pidgin, or English, or record a voice note below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("yoruba");
  const [toneEnforcement, setToneEnforcement] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Send chat message
  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput("");
    setIsStreaming(true);

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
      let streamedReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedReply += chunk;

        setMessages((prev) => {
          const clone = [...prev];
          clone[clone.length - 1] = { role: "assistant", content: streamedReply };
          return clone;
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error streaming response";
      setMessages((prev) => {
        const clone = [...prev];
        clone[clone.length - 1] = {
          role: "assistant",
          content: `[Connection error: ${errorMsg}. Make sure 'natlas serve' is running.]`,
        };
        return clone;
      });
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
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
  const handleTranscribe = async (audioBlob: Blob) => {
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

      const data = await res.json();
      if (data.text) {
        setTranscribedText(data.text);
        setInput(data.text);
      } else {
        alert(data.error || "Transcription failed");
      }
    } catch (err) {
      alert("Error sending audio to N-ATLAS ASR");
    } finally {
      setIsTranscribing(false);
    }
  };

  // 5. Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleTranscribe(file);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md">
            ₦
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">N-ATLAS Developer Playground</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                NAIC 2026
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Nigeria&apos;s Sovereign Multilingual LLM (Llama-3 8B) & Whisper ASR Suite
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-slate-600">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="yoruba">Yorùbá</option>
              <option value="hausa">Hausa</option>
              <option value="igbo">Igbo</option>
              <option value="pidgin">Nigerian Pidgin</option>
              <option value="english">Nigerian English</option>
            </select>
          </div>

          {/* Tone Guard Toggle */}
          <button
            type="button"
            onClick={() => setToneEnforcement(!toneEnforcement)}
            className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              toneEnforcement
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Tone Guard: {toneEnforcement ? "ON" : "OFF"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Stream View */}
        <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content || (isStreaming ? "Thinking..." : "")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Voice ASR Banner (if transcribed) */}
          {transcribedText && (
            <div className="mx-6 mb-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Transcribed ({language.toUpperCase()}): <strong>{transcribedText}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTranscribedText(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input & Voice Controls */}
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mx-auto flex max-w-4xl items-center space-x-3">
              {/* Record Mic */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all shadow-sm ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
                title={isRecording ? "Stop Recording" : "Record Voice Note"}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Upload Audio File */}
              <label
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-sm"
                title="Upload Audio File (.ogg, .opus, .wav, .webm)"
              >
                <Upload className="h-5 w-5" />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

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
                    ? "Transcribing with NCAIR1 Whisper..."
                    : `Ask N-ATLAS in ${language.charAt(0).toUpperCase() + language.slice(1)}...`
                }
                disabled={isStreaming || isRecording || isTranscribing}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="flex h-11 items-center space-x-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <span>Send</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar: Diagnostics & Presets */}
        <aside className="hidden w-80 flex-col border-l border-slate-200 bg-white p-5 lg:flex">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                System Diagnostics
              </h2>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500">LLM Base</span>
                  <span className="font-semibold text-slate-800">Llama-3 8B (N-ATLaS)</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500">ASR Checkpoint</span>
                  <span className="font-semibold text-slate-800">NCAIR1 Whisper</span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500">SDK Target</span>
                  <span className="font-semibold text-slate-800">@natlas/sdk (v0.1.0)</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Prompt Starters
              </h2>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage("yoruba");
                    setInput("Bawo ni mo se le da ile-iṣẹ mi silẹ ni Nigeria?");
                  }}
                  className="w-full text-left rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                >
                  <p className="font-medium text-emerald-800">Yorùbá: Business Registration</p>
                  <p className="text-slate-500 mt-0.5 truncate">&ldquo;Bawo ni mo se le da ile-iṣẹ mi silẹ ni Nigeria?&rdquo;</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLanguage("hausa");
                    setInput("Yaya ake shuka masara a lokacin damina?");
                  }}
                  className="w-full text-left rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                >
                  <p className="font-medium text-emerald-800">Hausa: Agriculture Advice</p>
                  <p className="text-slate-500 mt-0.5 truncate">&ldquo;Yaya ake shuka masara a lokacin damina?&rdquo;</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLanguage("igbo");
                    setInput("Kọwaara m uru agụmakwụkwọ bara nye ụmụaka.");
                  }}
                  className="w-full text-left rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                >
                  <p className="font-medium text-emerald-800">Igbo: Education</p>
                  <p className="text-slate-500 mt-0.5 truncate">&ldquo;Kọwaara m uru agụmakwụkwọ bara...&rdquo;</p>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
