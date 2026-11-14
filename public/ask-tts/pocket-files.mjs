// What the voice worker loads, and the voices users can pick. Shared by pocket-worker.js, src/lib/voice.ts,
// scripts/pocket-voices.mjs and tests/voice/pocket-files.test.ts. No imports: plain data.

// Pocket TTS (Kyutai; weights CC BY 4.0), English checkpoint of April 2026, int8 ONNX as exported by KevinAHM — the
// founder's pick for every device, 13 Oct 2026, after Kokoro crashed iPhones (voice lab, PR #5). Pinned to one
// commit of the Space, every file to its size and SHA-256 (Hugging Face's LFS record; bundle.json hashed by us), so
// an upstream change can never silently change it. The voice-cloning encoder is not loaded: we never clone.
const SPACE = "https://huggingface.co/spaces/KevinAHM/pocket-tts-web/resolve/d0c0c79b7712256a32d691c67f20b8ae2e020d00/onnx/english_2026-04/";
export const MODEL_FILES = [
  ["flow_lm_main_int8.onnx", 76341079, "f9bd8106b79a0192c1c43399ab938fb24900a95c1c599870d75a884e99000116"],
  ["mimi_decoder_int8.onnx", 22684077, "3630450a3297a101792a6ac66619ebc70ab916b265e6220c2afaef8b1673f925"],
  ["text_conditioner_int8.onnx", 16388384, "24c0642bff11a4e1435c004d0c2aa6c68e093fadfa35f0f0dba849ac67f25ac3"],
  ["flow_lm_flow_int8.onnx", 9962530, "3dd781ee5abee9e195320bf0106bebd6372a852b3b36352524ee78b40554635d"],
  ["tokenizer.model", 59339, "d461765ae179566678c93091c5fa6f2984c31bbe990bf1aa62d92c64d91bc3f6"],
  ["bundle.json", 24381, "bab643150f437f37df080a710520ff39ed9ebd9a339f8ebdc739f7eddfc28b3f"],
  ["bos_before_voice.npy", 4224, "f46edf4f7007b7ba4ea58831f49d003e59e167b4641c44bb3addfe9231a780b1"],
].map(([name, bytes, sha256]) => ({ name, url: SPACE + name, bytes, sha256 }));

// The voices, from our own origin: scripts/pocket-voices.mjs copies only the ones below out of the Space's
// voices.bin (POCKET_VOICES_SOURCE), which also holds two non-commercial voices (cosette, jean) we never send.
export const POCKET_VOICES_SOURCE = { url: SPACE + "voices.bin", sha256: "044364b05514d99f72c63830b0675951137c36f836e1e71bb2546e59b8c6d625" };
export const VOICES_FILE = { name: "pocket-voices.bin", url: "/ask-tts/pocket-voices.bin", bytes: 40014153, sha256: "f269c81f58e0da03608ac97528eb6195c0ed195b66ebf7528954ba266add16de" };

export const FILES = [...MODEL_FILES, VOICES_FILE];
export const TOTAL_BYTES = FILES.reduce((n, f) => n + f.bytes, 0);

// The voices offered: those whose source allows commercial use (huggingface.co/kyutai/tts-voices, read 13 Oct
// 2026): Alba MacKenna's recordings (CC BY 4.0), VCTK speakers p303, p262, p244 (CC BY 4.0), two Unmute voice
// donations (CC0). Credited on the Copyright page (src/content/legal.ts).
export const VOICES = [
  ["alba", "Alba", "Alba MacKenna (CC BY 4.0)"],
  ["azelma", "Azelma", "VCTK p303 (CC BY 4.0)"],
  ["eponine", "Eponine", "VCTK p262 (CC BY 4.0)"],
  ["fantine", "Fantine", "VCTK p244 (CC BY 4.0)"],
  ["javert", "Javert", "Unmute voice donation (CC0)"],
  ["marius", "Marius", "Unmute voice donation (CC0)"],
].map(([id, name, source]) => ({ id, name, source }));
export const DEFAULT_VOICE = "alba";
export const SAMPLE_RATE = 24000;
