"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  GripVertical,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Languages,
  Wand2,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Plus,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import type { SupportedLanguage } from "@natlas/sdk";

interface AudioPlayerWidgetProps {
  blob: Blob;
  fileName?: string | null;
}

function AudioPlayerWidget({ blob, fileName }: AudioPlayerWidgetProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 shadow-2xs">
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[10px] font-semibold text-emerald-800 truncate max-w-[160px]"
          title={fileName ?? "Audio"}
        >
          🎵 {fileName || "Audio Track"}
        </span>
        <span className="text-[10px] font-mono text-emerald-700">
          {formatSeconds(currentTime)} / {formatSeconds(duration)}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-white" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setCurrentTime(val);
            if (audioRef.current) audioRef.current.currentTime = val;
          }}
          className="h-1.5 flex-1 accent-emerald-600 cursor-pointer"
        />
      </div>
    </div>
  );
}

export type CardType =
  | "audio-input"
  | "voice-to-text"
  | "text-chat"
  | "translate"
  | "tone-fixer"
  | "summarize";

export interface StudioCard {
  instanceId: string;
  type: CardType;
  title: string;
  description: string;
  status: "idle" | "running" | "completed" | "error";
  language: SupportedLanguage;
  targetLanguage?: SupportedLanguage;
  inputText: string;
  outputText: string;
  toneEnforcement?: boolean;
  audioBlob?: Blob | null;
  audioFileName?: string | null;
}

interface PaletteItem {
  type: CardType;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLang: SupportedLanguage;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: "audio-input",
    title: "Audio Input",
    shortDesc: "Record your voice or upload audio (.opus, .ogg, .webm, .wav)",
    icon: Mic,
    defaultLang: "yoruba",
  },
  {
    type: "voice-to-text",
    title: "Voice to Text",
    shortDesc: "Transcribe spoken audio into written Nigerian language",
    icon: Volume2,
    defaultLang: "yoruba",
  },
  {
    type: "text-chat",
    title: "Text Chat",
    shortDesc: "Ask questions or generate AI answers in any dialect",
    icon: Sparkles,
    defaultLang: "yoruba",
  },
  {
    type: "translate",
    title: "Translate Language",
    shortDesc: "Translate between English, Yorùbá, Hausa, Igbo, and Pidgin",
    icon: Languages,
    defaultLang: "yoruba",
  },
  {
    type: "tone-fixer",
    title: "Tone & Accent Fixer",
    shortDesc: "Add accurate Nigerian tone marks, accents, and diacritics",
    icon: Wand2,
    defaultLang: "yoruba",
  },
  {
    type: "summarize",
    title: "Summarize Text",
    shortDesc: "Condense long text or transcripts into clear bullet points",
    icon: FileText,
    defaultLang: "english",
  },
];

const INITIAL_STUDIO_CARDS: StudioCard[] = [
  {
    instanceId: "card-1",
    type: "audio-input",
    title: "Audio Input",
    description: "Record voice with mic or upload a voice note",
    status: "idle",
    language: "yoruba",
    inputText: "",
    outputText: "",
  },
  {
    instanceId: "card-2",
    type: "voice-to-text",
    title: "Voice to Text",
    description: "Convert speech to text with NCAIR1 Whisper",
    status: "idle",
    language: "yoruba",
    inputText: "",
    outputText: "",
  },
  {
    instanceId: "card-3",
    type: "tone-fixer",
    title: "Tone & Accent Fixer",
    description: "Enforce accurate Yoruba/Igbo tone accents",
    status: "idle",
    language: "yoruba",
    toneEnforcement: true,
    inputText: "",
    outputText: "",
  },
  {
    instanceId: "card-4",
    type: "text-chat",
    title: "Text Chat",
    description: "Generate sovereign response with N-ATLAS",
    status: "idle",
    language: "yoruba",
    inputText: "Bawo ni mo se le da ile-ise mi sile ni Nigeria?",
    outputText: "",
  },
];

interface PipelineCanvasProps {
  currentLanguage: SupportedLanguage;
  toneEnforcement: boolean;
}

export function PipelineCanvas({
  currentLanguage,
  toneEnforcement,
}: PipelineCanvasProps) {
  const [cards, setCards] = useState<StudioCard[]>(INITIAL_STUDIO_CARDS);
  const [isRunningFlow, setIsRunningFlow] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Local recording states per card
  const [recordingCardId, setRecordingCardId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetUploadCardIdRef = useRef<string | null>(null);

  const getIconForType = (type: CardType) => {
    switch (type) {
      case "audio-input":
        return Mic;
      case "voice-to-text":
        return Volume2;
      case "text-chat":
        return Sparkles;
      case "translate":
        return Languages;
      case "tone-fixer":
        return Wand2;
      case "summarize":
        return FileText;
    }
  };

  // Add Card from Top Palette
  const addCard = (paletteItem: PaletteItem) => {
    const newCard: StudioCard = {
      instanceId: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: paletteItem.type,
      title: paletteItem.title,
      description: paletteItem.shortDesc,
      status: "idle",
      language: currentLanguage || paletteItem.defaultLang,
      targetLanguage: paletteItem.type === "translate" ? "english" : undefined,
      inputText: "",
      outputText: "",
      toneEnforcement,
    };
    setCards((prev) => [...prev, newCard]);
  };

  // Remove Card
  const removeCard = (instanceId: string) => {
    setCards((prev) => prev.filter((c) => c.instanceId !== instanceId));
  };

  // Reset Flow
  const resetFlow = () => {
    setCards(INITIAL_STUDIO_CARDS);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCards = [...cards];
    const draggedItem = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setCards(newCards);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Audio recording handlers on card
  const startRecordingOnCard = async (cardId: string) => {
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setCards((prev) =>
          prev.map((c) =>
            c.instanceId === cardId
              ? {
                  ...c,
                  audioBlob,
                  audioFileName: "voice_note.webm",
                  status: "completed",
                  outputText: `Recorded voice note (${(audioBlob.size / 1024).toFixed(1)} KB)`,
                }
              : c
          )
        );
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingCardId(cardId);
    } catch {
      alert("Microphone access denied or not supported.");
    }
  };

  const stopRecordingOnCard = () => {
    if (mediaRecorderRef.current && recordingCardId) {
      mediaRecorderRef.current.stop();
      setRecordingCardId(null);
    }
  };

  // Trigger file upload for specific card
  const triggerFileUpload = (cardId: string) => {
    targetUploadCardIdRef.current = cardId;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const cardId = targetUploadCardIdRef.current;
    if (file && cardId) {
      setCards((prev) =>
        prev.map((c) =>
          c.instanceId === cardId
            ? {
                ...c,
                audioBlob: file,
                audioFileName: file.name,
                status: "completed",
                outputText: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
              }
            : c
        )
      );
    }
  };

  // Update card fields
  const updateCardField = <K extends keyof StudioCard>(
    instanceId: string,
    field: K,
    value: StudioCard[K]
  ) => {
    setCards((prev) =>
      prev.map((c) => (c.instanceId === instanceId ? { ...c, [field]: value } : c))
    );
  };

  // Execute a single card
  const runSingleCard = async (
    targetCard: StudioCard,
    incomingData?: { text?: string; audio?: Blob | null }
  ): Promise<{ text: string; audio?: Blob | null }> => {
    updateCardField(targetCard.instanceId, "status", "running");

    try {
      if (targetCard.type === "audio-input") {
        if (!targetCard.audioBlob && !incomingData?.audio) {
          updateCardField(targetCard.instanceId, "status", "error");
          updateCardField(
            targetCard.instanceId,
            "outputText",
            "Please record audio with the mic or upload an audio file first."
          );
          return { text: "" };
        }
        const blob = targetCard.audioBlob || incomingData?.audio || null;
        updateCardField(targetCard.instanceId, "status", "completed");
        return {
          text: targetCard.outputText || "Audio ready",
          audio: blob,
        };
      }

      if (targetCard.type === "voice-to-text") {
        const audioBlobToTranscribe =
          targetCard.audioBlob || incomingData?.audio;

        if (!audioBlobToTranscribe) {
          updateCardField(targetCard.instanceId, "status", "error");
          updateCardField(
            targetCard.instanceId,
            "outputText",
            "No audio provided. Add an Audio Input step before this or upload an audio file directly."
          );
          return { text: "" };
        }

        const formData = new FormData();
        formData.append("file", audioBlobToTranscribe, "voice_note.webm");
        formData.append("language", targetCard.language);

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
          updateCardField(targetCard.instanceId, "status", "completed");
          updateCardField(targetCard.instanceId, "outputText", data.text);
          return { text: data.text, audio: audioBlobToTranscribe };
        }

        const errDetail = data.traceback
          ? `${data.error || "Transcription failed"}\n\nTraceback:\n${data.traceback}`
          : data.error || "Transcription failed";
        throw new Error(errDetail);
      }

      if (targetCard.type === "text-chat") {
        const prompt = targetCard.inputText || incomingData?.text || "";
        if (!prompt.trim()) {
          updateCardField(targetCard.instanceId, "status", "error");
          updateCardField(
            targetCard.instanceId,
            "outputText",
            "Please enter a question or connect text from a previous step."
          );
          return { text: "" };
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            language: targetCard.language,
            toneEnforcement: targetCard.toneEnforcement ?? true,
          }),
        });

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let streamedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamedText += decoder.decode(value, { stream: true });
          updateCardField(targetCard.instanceId, "outputText", streamedText);
        }

        updateCardField(targetCard.instanceId, "status", "completed");
        return { text: streamedText };
      }

      if (targetCard.type === "translate") {
        const textToTranslate = targetCard.inputText || incomingData?.text || "";
        if (!textToTranslate.trim()) {
          updateCardField(targetCard.instanceId, "status", "error");
          updateCardField(
            targetCard.instanceId,
            "outputText",
            "No text to translate. Type text above or connect an earlier step."
          );
          return { text: "" };
        }

        const targetLang = targetCard.targetLanguage || "english";
        const prompt = `Translate the following text accurately into ${targetLang}. Return ONLY the direct translation:\n\n${textToTranslate}`;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            language: targetLang,
            toneEnforcement: true,
          }),
        });

        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let translatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          translatedText += decoder.decode(value, { stream: true });
          updateCardField(targetCard.instanceId, "outputText", translatedText);
        }

        updateCardField(targetCard.instanceId, "status", "completed");
        return { text: translatedText };
      }

      if (targetCard.type === "tone-fixer") {
        const textToFix = targetCard.inputText || incomingData?.text || "";
        if (!textToFix.trim()) {
          updateCardField(targetCard.instanceId, "status", "error");
          updateCardField(
            targetCard.instanceId,
            "outputText",
            "No text provided. Type text above or connect from an earlier step."
          );
          return { text: "" };
        }

        const prompt = `Correct and enforce proper Nigerian tone marks, diacritics, and NFC orthography for the following ${targetCard.language} text. Return only the corrected text:\n\n${textToFix}`;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            language: targetCard.language,
            toneEnforcement: true,
          }),
        });

        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let polishedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          polishedText += decoder.decode(value, { stream: true });
          updateCardField(targetCard.instanceId, "outputText", polishedText);
        }

        updateCardField(targetCard.instanceId, "status", "completed");
        return { text: polishedText };
      }

      if (targetCard.type === "summarize") {
        const textToSummarize =
          targetCard.inputText || incomingData?.text || "";
        if (!textToSummarize.trim()) {
          updateCardField(targetCard.instanceId, "status", "error");
          updateCardField(
            targetCard.instanceId,
            "outputText",
            "No text to summarize. Type text above or connect from an earlier step."
          );
          return { text: "" };
        }

        const prompt = `Summarize the following text into 3 clear, concise bullet points in ${targetCard.language}:\n\n${textToSummarize}`;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            language: targetCard.language,
            toneEnforcement: true,
          }),
        });

        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let summaryText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          summaryText += decoder.decode(value, { stream: true });
          updateCardField(targetCard.instanceId, "outputText", summaryText);
        }

        updateCardField(targetCard.instanceId, "status", "completed");
        return { text: summaryText };
      }

      return { text: "" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      updateCardField(targetCard.instanceId, "status", "error");
      updateCardField(targetCard.instanceId, "outputText", `Error: ${msg}`);
      return { text: "" };
    }
  };

  // Run all cards chained in sequence
  const runEntireFlow = async () => {
    if (cards.length === 0) return;
    setIsRunningFlow(true);

    let currentPayload: { text?: string; audio?: Blob | null } = {};

    try {
      for (const card of cards) {
        const result = await runSingleCard(card, currentPayload);
        const resolvedAudio = result.audio !== undefined ? result.audio : currentPayload.audio;
        currentPayload = {
          text: result.text || currentPayload.text,
          audio: resolvedAudio,
        };
        if (resolvedAudio && !card.audioBlob && card.type === "voice-to-text") {
          updateCardField(card.instanceId, "audioBlob", resolvedAudio);
          updateCardField(card.instanceId, "audioFileName", "chained_audio.webm");
        }
      }
    } finally {
      setIsRunningFlow(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/70">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOP PALETTE: Available Cards */}
      <div className="border-b border-slate-200 bg-white px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Task Card Library</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Click any card to add it to your flow below. Drag cards to reorder or set custom settings.
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={resetFlow}
              disabled={isRunningFlow}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={runEntireFlow}
              disabled={isRunningFlow || cards.length === 0}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isRunningFlow ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Running Flow...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Run Entire Flow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Palette Card Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PALETTE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => addCard(item)}
                className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left transition-all hover:border-emerald-500 hover:bg-white hover:shadow-sm"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Plus className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="mt-2 text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {item.shortDesc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* CANVAS BELOW: Chained Cards */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {cards.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center bg-white/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Your Flow Canvas is Empty</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Click any card in the library above to add it here. You can chain speech, translation, tone fixing, and AI chat.
            </p>
            <button
              type="button"
              onClick={resetFlow}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Load Default Flow
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Chained Steps ({cards.length})
              </span>
              <span className="text-xs text-slate-400">
                Drag cards by the <GripVertical className="inline h-3.5 w-3.5 -mt-0.5" /> handle to re-order
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {cards.map((card, idx) => {
                const Icon = getIconForType(card.type);
                const isRecordingThis = recordingCardId === card.instanceId;
                const isLast = idx === cards.length - 1;

                return (
                  <div key={card.instanceId} className="relative flex flex-col">
                    <div
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`group flex flex-1 flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                        card.status === "running"
                          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                          : card.status === "completed"
                          ? "border-emerald-300 shadow-sm"
                          : card.status === "error"
                          ? "border-red-300 bg-red-50/20 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Step {idx + 1}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 leading-tight">
                              {card.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => removeCard(card.instanceId)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Remove card"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-0.5">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      {/* Card Settings & Inputs */}
                      <div className="mt-3 flex-1 space-y-3">
                        {/* Audio Input Card Controls */}
                        {card.type === "audio-input" && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={
                                  isRecordingThis
                                    ? stopRecordingOnCard
                                    : () => startRecordingOnCard(card.instanceId)
                                }
                                className={`flex flex-1 items-center justify-center space-x-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                                  isRecordingThis
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {isRecordingThis ? (
                                  <>
                                    <MicOff className="h-3.5 w-3.5" />
                                    <span>Stop Recording</span>
                                  </>
                                ) : (
                                  <>
                                    <Mic className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Record Voice</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => triggerFileUpload(card.instanceId)}
                                className="flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition-all"
                                title="Upload audio file"
                              >
                                <Upload className="h-3.5 w-3.5 text-slate-600" />
                                <span>Upload</span>
                              </button>
                            </div>

                            {card.audioBlob ? (
                              <AudioPlayerWidget
                                blob={card.audioBlob}
                                fileName={card.audioFileName}
                              />
                            ) : card.audioFileName ? (
                              <div className="rounded-lg bg-emerald-50 p-2 text-[11px] text-emerald-800 border border-emerald-100 truncate">
                                🎙️ Ready: <strong>{card.audioFileName}</strong>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {/* Voice to Text Audio Preview & Attach */}
                        {card.type === "voice-to-text" && (
                          <div className="space-y-1.5">
                            {card.audioBlob ? (
                              <div>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                                  Audio Input Track:
                                </span>
                                <AudioPlayerWidget
                                  blob={card.audioBlob}
                                  fileName={card.audioFileName}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-2 text-xs">
                                <span className="text-[11px] text-slate-500">Audio source:</span>
                                <button
                                  type="button"
                                  onClick={() => triggerFileUpload(card.instanceId)}
                                  className="flex items-center space-x-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
                                >
                                  <Upload className="h-3 w-3 text-slate-600" />
                                  <span>Upload Audio</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Language Selection Setting */}
                        {(card.type === "voice-to-text" ||
                          card.type === "text-chat" ||
                          card.type === "tone-fixer" ||
                          card.type === "summarize" ||
                          card.type === "translate") && (
                          <div className="flex items-center justify-between text-xs">
                            <label className="text-[11px] font-medium text-slate-500">
                              {card.type === "translate" ? "From Language:" : "Language:"}
                            </label>
                            <select
                              value={card.language}
                              onChange={(e) =>
                                updateCardField(
                                  card.instanceId,
                                  "language",
                                  e.target.value as SupportedLanguage
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="yoruba">Yorùbá</option>
                              <option value="hausa">Hausa</option>
                              <option value="igbo">Igbo</option>
                              <option value="pidgin">Nigerian Pidgin</option>
                              <option value="english">Nigerian English</option>
                            </select>
                          </div>
                        )}

                        {/* Translate: Target Language */}
                        {card.type === "translate" && (
                          <div className="flex items-center justify-between text-xs">
                            <label className="text-[11px] font-medium text-slate-500">
                              To Language:
                            </label>
                            <select
                              value={card.targetLanguage || "english"}
                              onChange={(e) =>
                                updateCardField(
                                  card.instanceId,
                                  "targetLanguage",
                                  e.target.value as SupportedLanguage
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="yoruba">Yorùbá</option>
                              <option value="hausa">Hausa</option>
                              <option value="igbo">Igbo</option>
                              <option value="pidgin">Nigerian Pidgin</option>
                              <option value="english">Nigerian English</option>
                            </select>
                          </div>
                        )}

                        {/* Tone Fixer Switch */}
                        {card.type === "tone-fixer" && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-medium text-slate-500">
                              Diacritics NFC:
                            </span>
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Enforced
                            </span>
                          </div>
                        )}

                        {/* Text Inputs for Text Chat, Translate, Tone Fixer, Summarize */}
                        {(card.type === "text-chat" ||
                          card.type === "translate" ||
                          card.type === "tone-fixer" ||
                          card.type === "summarize") && (
                          <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                              Input Text (or leave blank to use previous step):
                            </label>
                            <textarea
                              rows={2}
                              value={card.inputText}
                              onChange={(e) =>
                                updateCardField(
                                  card.instanceId,
                                  "inputText",
                                  e.target.value
                                )
                              }
                              placeholder="Type text or connect from previous card..."
                              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Output Preview Box */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Step Output
                            </span>
                            {card.status === "running" && (
                              <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600 animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Running...</span>
                              </div>
                            )}
                            {card.status === "completed" && (
                              <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Done</span>
                              </div>
                            )}
                          </div>
                          <div className="max-h-24 overflow-y-auto text-slate-700 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                            {card.outputText || (
                              <span className="text-slate-400 font-sans italic">
                                {card.status === "running"
                                  ? "Generating..."
                                  : "Click 'Run Step' or run the entire flow."}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Run Step Button */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {card.type === "voice-to-text"
                            ? "NCAIR1 Whisper"
                            : card.type === "text-chat"
                            ? "N-ATLAS 8B"
                            : "Sovereign AI"}
                        </span>
                        <button
                          type="button"
                          onClick={() => void runSingleCard(card)}
                          disabled={card.status === "running" || isRunningFlow}
                          className="flex items-center space-x-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Play className="h-3 w-3 fill-emerald-700" />
                          <span>Run Step</span>
                        </button>
                      </div>
                    </div>

                    {/* Step Connector Arrow */}
                    {!isLast && (
                      <div className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-white">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                    {!isLast && (
                      <div className="xl:hidden flex justify-center my-1 text-slate-300">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
