"use client";

import React, { useState } from "react";
import { Check, Copy, X, Terminal, FileCode, Layers } from "lucide-react";
import type { SupportedLanguage } from "@natlas/sdk";

export type FeatureType = "chat" | "transcribe" | "pipeline";
export type SnippetLanguage = "python" | "typescript" | "curl";

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  toneEnforcement: boolean;
}

export function CodeExportModal({
  isOpen,
  onClose,
  language,
  toneEnforcement,
}: CodeExportModalProps) {
  const [activeTab, setActiveTab] = useState<SnippetLanguage>("python");
  const [activeFeature, setActiveFeature] = useState<FeatureType>("pipeline");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCodeSnippet = (): string => {
    if (activeFeature === "chat") {
      if (activeTab === "python") {
        return `# Install: pip install natlas
from natlas import Natlas

client = Natlas(base_url="http://127.0.0.1:8000/v1")

response = client.chat.completions.create(
    model="NCAIR1/N-ATLaS",
    messages=[
        {"role": "user", "content": "Bawo ni mo se le da ile-ise mi sile ni Nigeria?"}
    ],
    language="${language}",
    tone_enforcement=${toneEnforcement ? "True" : "False"},
    temperature=0.1,
)

print(response.choices[0].message.content)
`;
      }
      if (activeTab === "typescript") {
        return `// Install: npm install @natlas/sdk
import { Natlas } from "@natlas/sdk";

const client = new Natlas({
  baseURL: "http://127.0.0.1:8000/v1",
});

async function run() {
  const stream = client.chat.stream({
    model: "NCAIR1/N-ATLaS",
    messages: [
      { role: "user", content: "Bawo ni mo se le da ile-ise mi sile ni Nigeria?" }
    ],
    language: "${language}",
    toneEnforcement: ${toneEnforcement},
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
  }
}

run();
`;
      }
      return `curl -X POST http://127.0.0.1:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "NCAIR1/N-ATLaS",
    "language": "${language}",
    "tone_enforcement": ${toneEnforcement},
    "messages": [
      {"role": "user", "content": "Bawo ni mo se le da ile-ise mi sile ni Nigeria?"}
    ]
  }'
`;
    }

    if (activeFeature === "transcribe") {
      if (activeTab === "python") {
        return `# Install: pip install "natlas[audio]"
from natlas import Natlas

client = Natlas(base_url="http://127.0.0.1:8000/v1")

# Transcodes WhatsApp (.opus/.ogg) or browser (.webm) in-memory to 16kHz mono WAV
with open("voice_note.webm", "rb") as audio_file:
    transcription = client.audio.transcribe(
        file=audio_file,
        language="${language}",
    )

print(f"Transcribed [{transcription.language}]: {transcription.text}")
print(f"NCAIR1 Model: {transcription.model}")
`;
      }
      if (activeTab === "typescript") {
        return `// Install: npm install @natlas/sdk
import { Natlas } from "@natlas/sdk";
import fs from "fs";

const client = new Natlas({
  baseURL: "http://127.0.0.1:8000/v1",
});

async function run() {
  const audioBuffer = fs.readFileSync("voice_note.webm");
  const file = new File([audioBuffer], "voice_note.webm", { type: "audio/webm" });

  const transcription = await client.audio.transcribe({
    file,
    language: "${language}",
  });

  console.log("Transcribed:", transcription.text);
  console.log("Model:", transcription.model);
}

run();
`;
      }
      return `curl -X POST http://127.0.0.1:8000/v1/audio/transcriptions \\
  -F "file=@voice_note.webm" \\
  -F "language=${language}"
`;
    }

    // Full Pipeline
    if (activeTab === "python") {
      return `# Complete Sovereign AI Pipeline: Audio In -> NCAIR1 ASR -> Tone Guard -> N-ATLAS LLM
# Install: pip install "natlas[audio]"
from natlas import Natlas

client = Natlas(base_url="http://127.0.0.1:8000/v1")

# Step 1: Transcribe voice note using sovereign NCAIR1 Whisper checkpoint
with open("voice_note.webm", "rb") as audio_file:
    asr_res = client.audio.transcribe(file=audio_file, language="${language}")

print(f"Transcribed ({asr_res.language}): {asr_res.text}")

# Step 2: Feed speech text into N-ATLAS with tone guards and dialect priming
response = client.chat.completions.create(
    model="NCAIR1/N-ATLaS",
    messages=[
        {"role": "user", "content": asr_res.text}
    ],
    language="${language}",
    tone_enforcement=${toneEnforcement ? "True" : "False"},
)

print(f"N-ATLAS Response: {response.choices[0].message.content}")
`;
    }
    if (activeTab === "typescript") {
      return `// Complete Sovereign AI Pipeline: Audio In -> NCAIR1 ASR -> Tone Guard -> N-ATLAS LLM
// Install: npm install @natlas/sdk
import { Natlas } from "@natlas/sdk";

const client = new Natlas({ baseURL: "http://127.0.0.1:8000/v1" });

async function runPipeline(audioFile: File) {
  // 1. Transcribe audio input using NCAIR1 Whisper checkpoint
  const asr = await client.audio.transcribe({
    file: audioFile,
    language: "${language}",
  });
  console.log("Transcribed:", asr.text);

  // 2. Stream generation through N-ATLAS sovereign model
  const stream = client.chat.stream({
    model: "NCAIR1/N-ATLaS",
    messages: [{ role: "user", content: asr.text }],
    language: "${language}",
    toneEnforcement: ${toneEnforcement},
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
  }
}
`;
    }
    return `# 1. Transcribe audio with NCAIR1 ASR
ASR_TEXT=$(curl -s -X POST http://127.0.0.1:8000/v1/audio/transcriptions \\
  -F "file=@voice_note.webm" \\
  -F "language=${language}" | jq -r '.text')

# 2. Complete with N-ATLAS LLM
curl -X POST http://127.0.0.1:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"model\\": \\"NCAIR1/N-ATLaS\\",
    \\"language\\": \\"${language}\\",
    \\"tone_enforcement\\": ${toneEnforcement},
    \\"messages\\": [{\\"role\\": \\"user\\", \\"content\\": \\"$ASR_TEXT\\"}]
  }"
`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Developer Code Snippet Export</h2>
              <p className="text-xs text-slate-500">
                Ready-to-use production snippets in Python, TypeScript SDK, and cURL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feature Selector Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/60 px-6 py-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Feature:</span>
            <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveFeature("pipeline")}
                className={`flex items-center space-x-1.5 rounded-md px-3 py-1 transition-all ${
                  activeFeature === "pipeline"
                    ? "bg-white text-emerald-800 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Full Pipeline</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFeature("chat")}
                className={`rounded-md px-3 py-1 transition-all ${
                  activeFeature === "chat"
                    ? "bg-white text-emerald-800 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                LLM Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveFeature("transcribe")}
                className={`rounded-md px-3 py-1 transition-all ${
                  activeFeature === "transcribe"
                    ? "bg-white text-emerald-800 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                NCAIR1 ASR
              </button>
            </div>
          </div>

          {/* Language / Client Tab */}
          <div className="flex items-center space-x-1 rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("python")}
              className={`rounded-md px-3 py-1 transition-all ${
                activeTab === "python"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Python
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("typescript")}
              className={`rounded-md px-3 py-1 transition-all ${
                activeTab === "typescript"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              TypeScript
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("curl")}
              className={`rounded-md px-3 py-1 transition-all ${
                activeTab === "curl"
                  ? "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="relative flex-1 bg-slate-950 p-5 overflow-auto font-mono text-xs text-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-4 right-4 flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-sans font-medium text-slate-200 hover:bg-slate-700 shadow-md transition-all border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-300" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          <pre className="pr-24 overflow-x-auto leading-relaxed">
            <code>{getCodeSnippet()}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Terminal className="h-3.5 w-3.5 text-emerald-600" />
            <span>Targeting language: <strong className="text-slate-800 uppercase">{language}</strong> | Tone Guard: <strong className="text-slate-800">{toneEnforcement ? "ON" : "OFF"}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
