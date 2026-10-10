"use client";

import React, { useState } from "react";
import {
  GripVertical,
  Mic,
  Volume2,
  ShieldCheck,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  FileAudio,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import type { SupportedLanguage } from "@natlas/sdk";

export interface PipelineStep {
  id: "audio-input" | "asr-transcribe" | "dialect-guard" | "llm-generate";
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  status: "idle" | "running" | "completed" | "error";
  output: string | null;
}

const DEFAULT_STEPS: PipelineStep[] = [
  {
    id: "audio-input",
    title: "1. Voice / Audio Ingestion",
    subtitle: "Browser microphone or WhatsApp voice note (.ogg/.opus/.webm)",
    icon: Mic,
    enabled: true,
    status: "idle",
    output: null,
  },
  {
    id: "asr-transcribe",
    title: "2. Sovereign NCAIR1 Whisper ASR",
    subtitle: "Speech-to-text mapped to official Yoruba, Hausa, Igbo, English checkpoints",
    icon: Volume2,
    enabled: true,
    status: "idle",
    output: null,
  },
  {
    id: "dialect-guard",
    title: "3. Dialect Guard & Normalizer",
    subtitle: "Unicode NFC tone orthography & anti-drift Nigerian system prompt priming",
    icon: ShieldCheck,
    enabled: true,
    status: "idle",
    output: null,
  },
  {
    id: "llm-generate",
    title: "4. N-ATLAS Sovereign LLM (8B)",
    subtitle: "Multilingual reasoning and tone-accurate completion generation",
    icon: Sparkles,
    enabled: true,
    status: "idle",
    output: null,
  },
];

interface PipelineCanvasProps {
  language: SupportedLanguage;
  toneEnforcement: boolean;
  onExecutePipeline: (steps: PipelineStep[]) => Promise<void>;
  isExecuting: boolean;
  steps: PipelineStep[];
  setSteps: React.Dispatch<React.SetStateAction<PipelineStep[]>>;
  onUploadAudioClick: () => void;
  onRecordMicClick: () => void;
  isRecording: boolean;
}

export function PipelineCanvas({
  language,
  toneEnforcement,
  onExecutePipeline,
  isExecuting,
  steps,
  setSteps,
  onUploadAudioClick,
  onRecordMicClick,
  isRecording,
}: PipelineCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSteps = [...steps];
    const draggedItem = newSteps[draggedIndex];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setSteps(newSteps);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, enabled: !step.enabled } : step
      )
    );
  };

  const resetPipeline = () => {
    setSteps(DEFAULT_STEPS);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/50 p-6">
      {/* Canvas Top Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900">
              Interactive Sovereign Pipeline Studio
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Drag & Drop Enabled
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Chain task nodes visually: drag to reorder execution stages, toggle components, and trigger end-to-end voice-to-reasoning flows.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={resetPipeline}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
            title="Reset to default pipeline order"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onRecordMicClick}
            disabled={isExecuting}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shadow-sm ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>{isRecording ? "Stop Recording" : "Record Voice"}</span>
          </button>

          <button
            type="button"
            onClick={onUploadAudioClick}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileAudio className="h-3.5 w-3.5 text-emerald-600" />
            <span>Upload Audio</span>
          </button>

          <button
            type="button"
            onClick={() => onExecutePipeline(steps)}
            disabled={isExecuting}
            className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Run Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Node Cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.id} className="relative flex flex-col">
                <div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group relative flex flex-1 flex-col rounded-xl border bg-white p-4 shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing ${
                    !step.enabled
                      ? "border-dashed border-slate-300 opacity-60 bg-slate-50/50"
                      : step.status === "running"
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                      : step.status === "completed"
                      ? "border-emerald-300 bg-emerald-50/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Stage {idx + 1}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">
                          {step.title.split(". ")[1] || step.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(step.id);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          step.enabled
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title={step.enabled ? "Disable this stage" : "Enable this stage"}
                      >
                        {step.enabled ? "Active" : "Bypassed"}
                      </button>
                      <div className="text-slate-300 hover:text-slate-500 cursor-grab">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Card Description */}
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {step.subtitle}
                  </p>

                  {/* Context Configuration Tags */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {step.id === "asr-transcribe" && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        Model: <strong className="text-emerald-700">NCAIR1/{language.toUpperCase()}</strong>
                      </span>
                    )}
                    {step.id === "dialect-guard" && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        Tone Guard: <strong className={toneEnforcement ? "text-emerald-700" : "text-amber-700"}>{toneEnforcement ? "Enforced" : "Off"}</strong>
                      </span>
                    )}
                    {step.id === "llm-generate" && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                        Target: <strong className="text-emerald-700">N-ATLaS (8B)</strong>
                      </span>
                    )}
                  </div>

                  {/* Output Preview Window */}
                  <div className="mt-3 flex-1 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Stage Output
                      </span>
                      {step.status === "running" && (
                        <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600 animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      )}
                      {step.status === "completed" && (
                        <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>

                    <div className="max-h-24 overflow-y-auto text-slate-700 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                      {step.output || (
                        <span className="text-slate-400 font-sans italic">
                          {step.status === "running"
                            ? "Waiting for stream..."
                            : "No execution data yet. Run pipeline or upload audio."}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow Connector to Next Node */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-white">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
                {!isLast && (
                  <div className="lg:hidden flex justify-center my-1.5 text-slate-400">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
