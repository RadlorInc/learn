// The narration voice: Pocket TTS (Kyutai), made in the viewer's browser on the CPU (WebAssembly, one thread), off the
// page's main thread. Founder's pick for every device, 13 Oct 2026: Kokoro on WebGPU crashed iPhones; this ran on a
// real iPhone at 1.0-1.2x real time (voice lab, PR #5).
//
// Most of this file is KevinAHM's web worker (huggingface.co/spaces/KevinAHM/pocket-tts-web at d0c0c79, Apache-2.0,
// POCKET-WORKER-LICENSE). Our changes, all marked "Radlor:": ONNX Runtime and the tokenizer from our own origin; every
// model file pinned (pocket-files.mjs), hash-checked and kept in OPFS; no voice-cloning encoder; the tokenizer's
// base64 made in pieces (Safari's stack); our message protocol at the end of the file in place of the demo's.
//
// Messages in:  {warm: true}       -> load (first time: download ~166 MB, hash-check, keep) -> {warm:'ok'|'error'}
//               {id, text, voice}  -> {id, wav, secs, ms, bad} or {id, error}
// Messages out while loading: {download, total} (bytes), {stage: 'check' | 'prepare'}.
import { FILES, TOTAL_BYTES, VOICES, DEFAULT_VOICE } from "./pocket-files.mjs";

let ort = null;

const DEFAULT_LANGUAGE = "english_2026-04";
const LANGUAGE_BUNDLES = ["english_2026-04", "german", "italian", "portuguese", "spanish"];
const MODEL_STEMS = {
    mimi_encoder: "mimi_encoder_int8.onnx",
    text_conditioner: "text_conditioner_int8.onnx",
    flow_lm_main: "flow_lm_main_int8.onnx",
    flow_lm_flow: "flow_lm_flow_int8.onnx",
    mimi_decoder: "mimi_decoder_int8.onnx",
};
const DEBUG_LOGS = false;
const CHUNK_GAP_SEC = 0.25;
const MAX_FRAMES = 500;
const LSD_STEPS = 1;
const RESET_FLOW_STATE_EACH_CHUNK = true;
const RESET_MIMI_STATE_EACH_CHUNK = true;

let currentLanguage = DEFAULT_LANGUAGE;
let currentBundleDir = null;
let bundleMetadata = null;
let tokenizerProcessor = null;
let tokenizerModelB64 = null;
let bosBeforeVoice = null;

let mimiEncoderSession = null;
let textConditionerSession = null;
let flowLmMainSession = null;
let flowLmFlowSession = null;
let mimiDecoderSession = null;

let currentSampleRate = 24000;
let currentSamplesPerFrame = 1920;
let currentLatentDim = 32;
let currentConditioningDim = 1024;
let currentMaxTokenPerChunk = 50;

let predefinedVoiceRecords = {};
let customVoiceEmbedding = null;
let currentVoiceName = null;
let voiceConditioningCache = new Map();

let stTensors = [];
let isGenerating = false;
let isReady = false;

function bundleDir(language) {
    return `./onnx/${language}`;
}

function bundlePath(language, filename) {
    return filename;   // Radlor: a pinned file's name; self.fetch below serves it from OPFS
}

function debugLog(...args) {
    if (DEBUG_LOGS) {
        console.log(...args);
    }
}

function makeFilledArray(shape, dtype, fill) {
    const size = shape.reduce((a, b) => a * b, 1);
    let data;

    if (dtype === "int64") {
        data = new BigInt64Array(size);
    } else if (dtype === "bool") {
        data = new Uint8Array(size);
    } else {
        data = new Float32Array(size);
        if (fill === "nan") {
            data.fill(NaN);
        } else if (fill === "ones") {
            data.fill(1);
        }
    }

    return data;
}

function createTensor(dtype, data, dims) {
    return new ort.Tensor(dtype, data, dims);
}

function initStateFromManifest(manifest) {
    const state = {};
    for (const entry of manifest) {
        state[entry.input_name] = createTensor(
            entry.dtype,
            makeFilledArray(entry.shape, entry.dtype, entry.fill),
            entry.shape
        );
    }
    return state;
}

function cloneState(state) {
    return { ...state };
}

function updateStateFromManifestOutputs(state, result, manifest) {
    for (const entry of manifest) {
        state[entry.input_name] = result[entry.output_name];
    }
}

function groupVoiceRecordByModule(record) {
    const grouped = {};
    for (const [key, value] of Object.entries(record)) {
        const slash = key.indexOf("/");
        if (slash === -1) continue;
        const moduleName = key.slice(0, slash);
        const tensorKey = key.slice(slash + 1);
        if (!grouped[moduleName]) {
            grouped[moduleName] = {};
        }
        grouped[moduleName][tensorKey] = value;
    }
    return grouped;
}

function adaptTypedArray(source, entry) {
    const targetShape = entry.shape;
    const targetSize = targetShape.reduce((a, b) => a * b, 1);
    const target = makeFilledArray(targetShape, entry.dtype, entry.fill);

    if (source.shape.length === targetShape.length) {
        const exactShape = source.shape.every((dim, idx) => dim === targetShape[idx]);
        if (exactShape) {
            if (entry.dtype === "int64") {
                return new BigInt64Array(source.data);
            }
            if (entry.dtype === "bool") {
                return new Uint8Array(source.data);
            }
            return new Float32Array(source.data);
        }
    }

    if (source.data.length === targetSize) {
        if (entry.dtype === "int64") {
            return new BigInt64Array(source.data);
        }
        if (entry.dtype === "bool") {
            return new Uint8Array(source.data);
        }
        return new Float32Array(source.data);
    }

    if (source.shape.length !== targetShape.length) {
        return target;
    }

    const strides = [];
    let stride = 1;
    for (let i = source.shape.length - 1; i >= 0; i--) {
        strides[i] = stride;
        stride *= source.shape[i];
    }

    const indices = new Array(source.shape.length).fill(0);
    const maxIndices = source.shape.map((dim, idx) => Math.min(dim, targetShape[idx]));

    function targetIndex(coords) {
        let idx = 0;
        let tStride = 1;
        for (let i = targetShape.length - 1; i >= 0; i--) {
            idx += coords[i] * tStride;
            tStride *= targetShape[i];
        }
        return idx;
    }

    let done = false;
    while (!done) {
        let sourceIdx = 0;
        for (let i = 0; i < indices.length; i++) {
            sourceIdx += indices[i] * strides[i];
        }
        target[targetIndex(indices)] = source.data[sourceIdx];

        for (let dim = indices.length - 1; dim >= 0; dim--) {
            indices[dim] += 1;
            if (indices[dim] < maxIndices[dim]) {
                break;
            }
            indices[dim] = 0;
            if (dim === 0) {
                done = true;
            }
        }
    }

    return target;
}

function deriveStep(moduleState) {
    if (moduleState.step) {
        return { data: BigInt64Array.from([BigInt(moduleState.step.data[0])]), shape: [1], dtype: "int64" };
    }
    if (moduleState.offset && !moduleState.end_offset) {
        return { data: BigInt64Array.from([BigInt(moduleState.offset.data[0])]), shape: [1], dtype: "int64" };
    }
    if (moduleState.current_end) {
        return { data: BigInt64Array.from([BigInt(moduleState.current_end.shape[0])]), shape: [1], dtype: "int64" };
    }
    return { data: BigInt64Array.from([0n]), shape: [1], dtype: "int64" };
}

function stateFromVoiceRecord(record) {
    const grouped = groupVoiceRecordByModule(record);
    const state = initStateFromManifest(bundleMetadata.flow_lm_state_manifest);

    for (const entry of bundleMetadata.flow_lm_state_manifest) {
        const moduleState = grouped[entry.module] || {};
        let source = moduleState[entry.key];
        if (!source && entry.key === "step") {
            source = deriveStep(moduleState);
        }
        if (!source) {
            continue;
        }

        const data = adaptTypedArray(source, entry);
        state[entry.input_name] = createTensor(entry.dtype, data, entry.shape);
    }

    return state;
}

function prepareVoiceEmbeddingData(voiceEmb) {
    let data = voiceEmb.data;
    let dims = voiceEmb.shape.slice();

    if (bundleMetadata.insert_bos_before_voice && bosBeforeVoice) {
        const bosData = bosBeforeVoice.data;
        const combined = new Float32Array(bosData.length + data.length);
        combined.set(bosData, 0);
        combined.set(data, bosData.length);
        data = combined;
        dims = [1, dims[1] + bosBeforeVoice.shape[1], dims[2]];
    }

    return createTensor("float32", data, dims);
}

async function buildVoiceConditionedState(voiceEmb) {
    const flowLmState = initStateFromManifest(bundleMetadata.flow_lm_state_manifest);
    const emptySeq = createTensor("float32", new Float32Array(0), [1, 0, currentLatentDim]);
    const voiceTensor = prepareVoiceEmbeddingData(voiceEmb);

    const result = await flowLmMainSession.run({
        sequence: emptySeq,
        text_embeddings: voiceTensor,
        ...flowLmState,
    });

    updateStateFromManifestOutputs(flowLmState, result, bundleMetadata.flow_lm_state_manifest);
    return flowLmState;
}

async function ensurePredefinedVoiceCached(voiceName, options = {}) {
    const { force = false, statusText = "Preparing voice..." } = options;
    if (!predefinedVoiceRecords[voiceName]) {
        throw new Error(`Unknown built-in voice: ${voiceName}`);
    }

    if (!force && voiceConditioningCache.has(voiceName)) {
        return voiceConditioningCache.get(voiceName);
    }

    emit({ type: "status", status: statusText, state: "loading" });
    const conditioned = stateFromVoiceRecord(predefinedVoiceRecords[voiceName]);
    voiceConditioningCache.set(voiceName, conditioned);
    return conditioned;
}

async function ensureCustomVoiceCached(options = {}) {
    const { force = false, statusText = "Preparing custom voice..." } = options;
    if (!customVoiceEmbedding) {
        throw new Error("No custom voice loaded.");
    }

    if (!force && voiceConditioningCache.has("custom")) {
        return voiceConditioningCache.get("custom");
    }

    emit({ type: "status", status: statusText, state: "loading" });
    const conditioned = await buildVoiceConditionedState(customVoiceEmbedding);
    voiceConditioningCache.set("custom", conditioned);
    return conditioned;
}

function parseNpyFloat32(buffer) {
    const view = new DataView(buffer);
    const magic = new Uint8Array(buffer, 0, 6);
    const expected = [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59];
    for (let i = 0; i < expected.length; i++) {
        if (magic[i] !== expected[i]) {
            throw new Error("Invalid NPY file");
        }
    }

    const major = view.getUint8(6);
    const headerLen = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
    const headerOffset = major === 1 ? 10 : 12;
    const headerText = new TextDecoder().decode(new Uint8Array(buffer, headerOffset, headerLen));
    const shapeMatch = headerText.match(/\(\s*([0-9,\s]+)\)/);
    if (!shapeMatch) {
        throw new Error("Could not parse NPY shape");
    }
    const shape = shapeMatch[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => Number.parseInt(part, 10));
    const dataOffset = headerOffset + headerLen;
    const data = new Float32Array(buffer, dataOffset);
    return { data: new Float32Array(data), shape };
}

function parseVoiceStatesBin(buffer) {
    const view = new DataView(buffer);
    let offset = 0;
    const magic = new TextDecoder().decode(new Uint8Array(buffer, offset, 5));
    offset += 5;
    if (magic !== "PTVB1") {
        throw new Error("Invalid voices.bin header");
    }

    const voices = {};
    const voiceCount = view.getUint32(offset, true);
    offset += 4;

    for (let voiceIndex = 0; voiceIndex < voiceCount; voiceIndex++) {
        const nameLen = view.getUint16(offset, true);
        offset += 2;
        const name = new TextDecoder().decode(new Uint8Array(buffer, offset, nameLen));
        offset += nameLen;

        const tensorCount = view.getUint16(offset, true);
        offset += 2;
        const tensors = {};

        for (let tensorIndex = 0; tensorIndex < tensorCount; tensorIndex++) {
            const keyLen = view.getUint16(offset, true);
            offset += 2;
            const key = new TextDecoder().decode(new Uint8Array(buffer, offset, keyLen));
            offset += keyLen;

            const dtypeCode = view.getUint8(offset);
            offset += 1;
            const rank = view.getUint8(offset);
            offset += 1;

            const shape = [];
            for (let dimIndex = 0; dimIndex < rank; dimIndex++) {
                shape.push(view.getUint32(offset, true));
                offset += 4;
            }

            const byteLength = view.getUint32(offset, true);
            offset += 4;

            let data;
            if (dtypeCode === 0) {
                data = new Float32Array(buffer.slice(offset, offset + byteLength));
            } else if (dtypeCode === 1) {
                data = new BigInt64Array(buffer.slice(offset, offset + byteLength));
            } else if (dtypeCode === 2) {
                data = new Uint8Array(buffer.slice(offset, offset + byteLength));
            } else {
                throw new Error(`Unsupported voices.bin dtype code: ${dtypeCode}`);
            }
            offset += byteLength;

            tensors[key] = {
                data,
                shape,
                dtype: dtypeCode === 0 ? "float32" : dtypeCode === 1 ? "int64" : "bool",
            };
        }

        voices[name] = tensors;
    }

    return voices;
}

async function encodeVoiceAudio(audioData) {
    const input = createTensor("float32", audioData, [1, 1, audioData.length]);
    const outputs = await mimiEncoderSession.run({ audio: input });
    const embeddings = outputs[mimiEncoderSession.outputNames[0]];

    let dims = embeddings.dims.slice();
    let data = new Float32Array(embeddings.data);
    while (dims.length > 3) {
        if (dims[0] !== 1) break;
        dims = dims.slice(1);
    }
    if (dims.length < 3) {
        dims = [1, dims[0], dims[1]];
    }

    return { data, shape: dims };
}

function prepareTextPrompt(text) {
    let prompt = text.trim();
    if (!prompt) {
        return { text: "", framesAfterEos: 1 };
    }

    prompt = prompt.replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ");
    if (bundleMetadata.remove_semicolons) {
        prompt = prompt.replace(/;/g, ",");
    }

    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    let framesAfterEos = wordCount <= 4 ? 3 : 1;
    if (bundleMetadata.model_recommended_frames_after_eos != null) {
        framesAfterEos = Number(bundleMetadata.model_recommended_frames_after_eos);
    }

    if (prompt && !/[A-ZÀ-Þ]/.test(prompt[0])) {
        prompt = prompt[0].toUpperCase() + prompt.slice(1);
    }
    if (prompt && /[0-9A-Za-zÀ-ÿ]/.test(prompt[prompt.length - 1])) {
        prompt += ".";
    }
    if (bundleMetadata.pad_with_spaces_for_short_inputs && wordCount < 5) {
        prompt = "        " + prompt;
    }

    return { text: prompt, framesAfterEos };
}

const SENTENCE_SPLIT_RE = /[^.!?]+[.!?]+|[^.!?]+$/g;

function splitTextIntoSentences(text) {
    const matches = text.match(SENTENCE_SPLIT_RE);
    if (!matches) return [];
    return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

function splitTokenIdsIntoChunks(tokenIds, maxTokens) {
    const chunks = [];
    for (let i = 0; i < tokenIds.length; i += maxTokens) {
        const chunkText = tokenizerProcessor.decodeIds(tokenIds.slice(i, i + maxTokens)).trim();
        if (chunkText) {
            chunks.push(chunkText);
        }
    }
    return chunks;
}

function splitIntoBestSentences(text) {
    const prepared = prepareTextPrompt(text);
    if (!prepared.text) {
        return { chunks: [], framesAfterEos: prepared.framesAfterEos };
    }

    const sentences = splitTextIntoSentences(prepared.text);
    if (!sentences.length) {
        return { chunks: [prepared.text], framesAfterEos: prepared.framesAfterEos };
    }

    const chunks = [];
    let currentChunk = "";

    for (const sentenceText of sentences) {
        const sentenceTokenIds = tokenizerProcessor.encodeIds(sentenceText);
        const sentenceTokens = sentenceTokenIds.length;

        if (sentenceTokens > currentMaxTokenPerChunk) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }
            const splitChunks = splitTokenIdsIntoChunks(sentenceTokenIds, currentMaxTokenPerChunk);
            for (const splitChunk of splitChunks) {
                if (splitChunk) {
                    chunks.push(splitChunk.trim());
                }
            }
            continue;
        }

        if (!currentChunk) {
            currentChunk = sentenceText;
            continue;
        }

        const combined = `${currentChunk} ${sentenceText}`;
        const combinedTokens = tokenizerProcessor.encodeIds(combined).length;
        if (combinedTokens > currentMaxTokenPerChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentenceText;
        } else {
            currentChunk = combined;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return { chunks, framesAfterEos: prepared.framesAfterEos };
}

function precomputeFlowBuffers() {
    stTensors = [];
    const dt = 1.0 / LSD_STEPS;
    for (let step = 0; step < LSD_STEPS; step++) {
        const s = step / LSD_STEPS;
        const t = s + dt;
        stTensors.push({
            s: createTensor("float32", new Float32Array([s]), [1, 1]),
            t: createTensor("float32", new Float32Array([t]), [1, 1]),
        });
    }
}

async function loadOrt() {
    if (ort) {
        return;
    }

    emit({ type: "status", status: "Loading ONNX Runtime...", state: "loading" });
    // Radlor: ONNX Runtime 1.20.0 from our own origin (scripts/vendor-tts.mjs), not jsDelivr.
    const ortModule = await import("./vendor/ort.wasm.min.mjs");
    ort = ortModule.default || ortModule;
    ort.env.wasm.wasmPaths = new URL("./vendor/", import.meta.url).href;
    ort.env.wasm.simd = true;
    ort.env.wasm.numThreads = self.crossOriginIsolated
        ? Math.min(navigator.hardwareConcurrency || 4, 8)
        : 1;
    precomputeFlowBuffers();
}

async function releaseSession(session) {
    if (!session) {
        return;
    }
    if (typeof session.release === "function") {
        await session.release();
    }
}

async function loadBundle(language, { initialLoad = false } = {}) {
    if (!LANGUAGE_BUNDLES.includes(language)) {
        throw new Error(`Unsupported language bundle: ${language}`);
    }

    await loadOrt();

    emit({ type: "status", status: `Loading ${language} bundle...`, state: "loading" });
    currentLanguage = language;
    currentBundleDir = bundleDir(language);

    const metadataResponse = await fetch(bundlePath(language, "bundle.json"));
    if (!metadataResponse.ok) {
        throw new Error(`Failed to load bundle metadata for ${language}`);
    }
    bundleMetadata = await metadataResponse.json();

    currentSampleRate = Number(bundleMetadata.sample_rate);
    currentSamplesPerFrame = Number(bundleMetadata.samples_per_frame);
    currentLatentDim = Number(bundleMetadata.latent_dim);
    currentConditioningDim = Number(bundleMetadata.conditioning_dim);
    currentMaxTokenPerChunk = Number(bundleMetadata.max_token_per_chunk || 50);
    isReady = false;

    await Promise.all([
        releaseSession(mimiEncoderSession),
        releaseSession(textConditionerSession),
        releaseSession(flowLmMainSession),
        releaseSession(flowLmFlowSession),
        releaseSession(mimiDecoderSession),
    ]);

    const sessionOptions = {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
    };

    const [encoderRes, textCondRes, flowMainRes, flowFlowRes, decoderRes] = await Promise.all([
        Promise.resolve(null),   // Radlor: the voice-cloning encoder is never used, so never downloaded
        ort.InferenceSession.create(bundlePath(language, MODEL_STEMS.text_conditioner), sessionOptions),
        ort.InferenceSession.create(bundlePath(language, MODEL_STEMS.flow_lm_main), sessionOptions),
        ort.InferenceSession.create(bundlePath(language, MODEL_STEMS.flow_lm_flow), sessionOptions),
        ort.InferenceSession.create(bundlePath(language, MODEL_STEMS.mimi_decoder), sessionOptions),
    ]);

    mimiEncoderSession = encoderRes;
    textConditionerSession = textCondRes;
    flowLmMainSession = flowMainRes;
    flowLmFlowSession = flowFlowRes;
    mimiDecoderSession = decoderRes;

    const tokenizerResponse = await fetch(bundlePath(language, bundleMetadata.tokenizer_file));
    if (!tokenizerResponse.ok) {
        throw new Error(`Failed to load tokenizer for ${language}`);
    }
    const tokenizerBuffer = await tokenizerResponse.arrayBuffer();
    // Radlor: spreading 59 KB into one call overflows Safari's stack ("Maximum call stack size exceeded").
    const tokBytes = new Uint8Array(tokenizerBuffer);
    let tokBin = "";
    for (let i = 0; i < tokBytes.length; i += 8192) tokBin += String.fromCharCode(...tokBytes.subarray(i, i + 8192));
    tokenizerModelB64 = btoa(tokBin);
    const spModule = await import("./vendor/sentencepiece.js");   // Radlor: our origin
    tokenizerProcessor = new spModule.SentencePieceProcessor();
    await tokenizerProcessor.loadFromB64StringModel(tokenizerModelB64);

    bosBeforeVoice = null;
    if (bundleMetadata.bos_before_voice_file) {
        const bosResponse = await fetch(bundlePath(language, bundleMetadata.bos_before_voice_file));
        if (bosResponse.ok) {
            bosBeforeVoice = parseNpyFloat32(await bosResponse.arrayBuffer());
        }
    }

    predefinedVoiceRecords = {};
    const voicesResponse = await fetch(bundlePath(language, "voices.bin"));
    if (voicesResponse.ok) {
        predefinedVoiceRecords = parseVoiceStatesBin(await voicesResponse.arrayBuffer());
    }

    voiceConditioningCache = new Map();
    let defaultVoice = bundleMetadata.predefined_voices?.includes("alba") ? "alba" : null;
    if (!defaultVoice) {
        defaultVoice = Object.keys(predefinedVoiceRecords)[0] || null;
    }
    currentVoiceName = defaultVoice;

    if (defaultVoice) {
        await ensurePredefinedVoiceCached(defaultVoice, {
            force: true,
            statusText: `Preparing voice (${defaultVoice})...`,
        });
    }

    if (customVoiceEmbedding) {
        voiceConditioningCache.delete("custom");
    }

    isReady = true;

    emit({
        type: "voices_loaded",
        voices: bundleMetadata.predefined_voices || Object.keys(predefinedVoiceRecords),
        defaultVoice,
        language,
    });
    emit({
        type: "bundle_loaded",
        language,
        sampleRate: currentSampleRate,
        initialLoad,
    });
    emit({ type: "status", status: "Ready", state: "idle" });
    emit({ type: "model_status", status: "ready", text: `Ready (${language})` });
    if (initialLoad) {
        emit({ type: "loaded" });
    }
}

async function runGenerationPipeline(voiceName, chunks, framesAfterEos) {
    let mimiState = initStateFromManifest(bundleMetadata.mimi_state_manifest);
    const emptySeq = createTensor("float32", new Float32Array(0), [1, 0, currentLatentDim]);
    const emptyTextEmb = createTensor("float32", new Float32Array(0), [1, 0, currentConditioningDim]);
    const baseFlowState = voiceConditioningCache.get(voiceName);
    if (!baseFlowState) {
        throw new Error(`Voice conditioning cache missing for '${voiceName}'.`);
    }
    let flowLmState = cloneState(baseFlowState);

    const firstChunkFrames = 3;
    const normalChunkFrames = 12;
    const allGeneratedLatents = [];
    let isFirstAudioChunk = true;
    let totalFlowLmTime = 0;
    let totalDecodeTime = 0;
    const generationStart = performance.now();

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        if (!isGenerating) break;

        if (RESET_FLOW_STATE_EACH_CHUNK && chunkIdx > 0) {
            flowLmState = cloneState(baseFlowState);
        }
        if (RESET_MIMI_STATE_EACH_CHUNK && chunkIdx > 0) {
            mimiState = initStateFromManifest(bundleMetadata.mimi_state_manifest);
        }

        const chunkText = chunks[chunkIdx];
        let isFirstAudioChunkOfTextChunk = true;
        const tokenIds = tokenizerProcessor.encodeIds(chunkText);
        const textInput = createTensor(
            "int64",
            BigInt64Array.from(tokenIds.map((token) => BigInt(token))),
            [1, tokenIds.length]
        );

        let textEmb = (await textConditionerSession.run({ token_ids: textInput }))[textConditionerSession.outputNames[0]];
        if (textEmb.dims.length === 2) {
            textEmb = createTensor("float32", new Float32Array(textEmb.data), [1, textEmb.dims[0], textEmb.dims[1]]);
        }

        const condResult = await flowLmMainSession.run({
            sequence: emptySeq,
            text_embeddings: textEmb,
            ...flowLmState,
        });
        updateStateFromManifestOutputs(flowLmState, condResult, bundleMetadata.flow_lm_state_manifest);

        const chunkLatents = [];
        let chunkDecodedFrames = 0;
        let currentLatent = createTensor("float32", new Float32Array(currentLatentDim).fill(NaN), [1, 1, currentLatentDim]);
        let eosStep = null;
        let chunkEnded = false;
        let chunkGenTimeMs = 0;

        for (let step = 0; step < MAX_FRAMES; step++) {
            if (!isGenerating) break;
            if (step > 0 && step % 4 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }

            const stepStart = performance.now();
            const arResult = await flowLmMainSession.run({
                sequence: currentLatent,
                text_embeddings: emptyTextEmb,
                ...flowLmState,
            });
            const stepElapsed = performance.now() - stepStart;
            chunkGenTimeMs += stepElapsed;
            totalFlowLmTime += stepElapsed;

            const conditioning = arResult.conditioning;
            const eosLogit = arResult.eos_logit.data[0];
            const isEos = eosLogit > -4.0;
            if (isEos && eosStep == null) {
                eosStep = step;
            }
            const shouldStop = eosStep != null && step >= eosStep + framesAfterEos;

            const temperature = 0.7;
            const std = Math.sqrt(temperature);
            const latentData = new Float32Array(currentLatentDim);
            for (let i = 0; i < currentLatentDim; i++) {
                let u = 0;
                let v = 0;
                while (u === 0) u = Math.random();
                while (v === 0) v = Math.random();
                latentData[i] = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
            }

            const dt = 1.0 / LSD_STEPS;
            for (let lsdIndex = 0; lsdIndex < LSD_STEPS; lsdIndex++) {
                const flowResult = await flowLmFlowSession.run({
                    c: conditioning,
                    s: stTensors[lsdIndex].s,
                    t: stTensors[lsdIndex].t,
                    x: createTensor("float32", latentData, [1, currentLatentDim]),
                });
                const flowDir = flowResult.flow_dir.data;
                for (let i = 0; i < currentLatentDim; i++) {
                    latentData[i] += flowDir[i] * dt;
                }
            }

            chunkLatents.push(new Float32Array(latentData));
            allGeneratedLatents.push(new Float32Array(latentData));
            currentLatent = createTensor("float32", latentData, [1, 1, currentLatentDim]);
            updateStateFromManifestOutputs(flowLmState, arResult, bundleMetadata.flow_lm_state_manifest);

            const pending = chunkLatents.length - chunkDecodedFrames;
            let decodeSize = 0;
            if (shouldStop) {
                decodeSize = pending;
            } else if (isFirstAudioChunk && pending >= firstChunkFrames) {
                decodeSize = firstChunkFrames;
            } else if (pending >= normalChunkFrames) {
                decodeSize = normalChunkFrames;
            }

            if (decodeSize > 0) {
                const decodeLatents = new Float32Array(decodeSize * currentLatentDim);
                for (let frame = 0; frame < decodeSize; frame++) {
                    decodeLatents.set(chunkLatents[chunkDecodedFrames + frame], frame * currentLatentDim);
                }

                const decoderStart = performance.now();
                const decodeResult = await mimiDecoderSession.run({
                    latent: createTensor("float32", decodeLatents, [1, decodeSize, currentLatentDim]),
                    ...mimiState,
                });
                const decoderElapsed = performance.now() - decoderStart;
                chunkGenTimeMs += decoderElapsed;
                totalDecodeTime += decoderElapsed;

                for (const entry of bundleMetadata.mimi_state_manifest) {
                    mimiState[entry.input_name] = decodeResult[entry.output_name];
                }

                chunkDecodedFrames += decodeSize;
                const audioFloat32 = new Float32Array(decodeResult[mimiDecoderSession.outputNames[0]].data);
                const isLastChunk = shouldStop && chunkIdx === chunks.length - 1;

                emit({
                    type: "audio_chunk",
                    data: audioFloat32,
                    metrics: {
                        bbTime: 0,
                        decTime: 0,
                        chunkDuration: audioFloat32.length / currentSampleRate,
                        genTimeSec: chunkGenTimeMs / 1000,
                        isFirst: isFirstAudioChunk,
                        isLast: isLastChunk,
                        chunkStart: isFirstAudioChunkOfTextChunk,
                    },
                }, [audioFloat32.buffer]);

                isFirstAudioChunk = false;
                isFirstAudioChunkOfTextChunk = false;
                chunkGenTimeMs = 0;
            }

            if (shouldStop) {
                chunkEnded = true;
                break;
            }
        }

        if (chunkEnded && isGenerating && chunkIdx < chunks.length - 1) {
            const gapSamples = Math.max(1, Math.floor(CHUNK_GAP_SEC * currentSampleRate));
            const silence = new Float32Array(gapSamples);
            emit({
                type: "audio_chunk",
                data: silence,
                metrics: {
                    bbTime: 0,
                    decTime: 0,
                    chunkDuration: gapSamples / currentSampleRate,
                    isFirst: false,
                    isLast: false,
                    isSilence: true,
                },
            }, [silence.buffer]);
        }
    }

    const totalTime = (performance.now() - generationStart) / 1000;
    const audioSeconds = allGeneratedLatents.length * currentSamplesPerFrame / currentSampleRate;
    const genTime = (totalFlowLmTime + totalDecodeTime) / 1000;
    const rtfx = genTime > 0 ? audioSeconds / genTime : 0;

    debugLog(`Generation complete for ${voiceName} in ${totalTime.toFixed(2)}s (RTFx ${rtfx.toFixed(2)}x)`);
    emit({
        type: "status",
        status: `Finished (RTFx: ${rtfx.toFixed(2)}x)`,
        state: "idle",
        metrics: { rtfx, genTime, totalTime, audioDuration: audioSeconds },
    });
}


// ── Radlor ───────────────────────────────────────────────────────────────────────────────────────────────────────
// The demo's own messages (status text, voices list…) are of no use to the app, so they are dropped; while a line is
// made its audio chunks are collected instead.
let collecting = null;
function emit(msg) {
    if (collecting && msg?.type === "audio_chunk") collecting.push(msg.data);
}

const hex = async (buf) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))].map((b) => b.toString(16).padStart(2, "0")).join("");
const BY_NAME = new Map(FILES.map((f) => [f.name, f]));
BY_NAME.set("voices.bin", BY_NAME.get("pocket-voices.bin"));   // the demo asks for "voices.bin"

// Download progress across all files (they come in parallel).
const got = new Map();
const progress = (f, n) => { got.set(f.name, n); self.postMessage({ download: [...got.values()].reduce((a, b) => a + b, 0), total: TOTAL_BYTES }); };

// A file is kept in OPFS under its hash, and only after the hash matched: what is stored is always right. The download
// is written into "<name>.part" as it arrives (a sync access handle commits each write), so a reload carries on with
// an HTTP Range request instead of starting again. (From the Kokoro worker, 13 Oct 2026.)
async function kept(f) {
    // Some WebKit browsers have no OPFS: getDirectory() throws UnknownError ("unknown transient reason") in a private
    // window, and Chrome on an iPhone turned the voice off with it (13 Oct 2026). Those keep files in Cache Storage.
    let dir = null;
    try { dir = await navigator.storage.getDirectory(); } catch { return cached(f); }
    const name = `pocket-${f.sha256}`;
    try { const file = await (await dir.getFileHandle(name)).getFile(); if (file.size === f.bytes) { got.set(f.name, f.bytes); return file; } } catch {}   // kept: counts, no bar
    let part = null, sync = null, have = 0, chunks = [];
    try {
        part = await dir.getFileHandle(name + ".part", { create: true });
        sync = await part.createSyncAccessHandle();                    // one writer: another tab gets the in-memory way
        have = sync.getSize();
        if (have > f.bytes) { sync.truncate(0); have = 0; }
    } catch { sync?.close(); part = sync = null; have = 0; }
    try {
        if (have < f.bytes) {
            const res = await realFetch(f.url, have ? { headers: { Range: `bytes=${have}-` } } : undefined);
            if (!res.ok) throw new Error(`${f.name}: HTTP ${res.status}`);
            if (have && res.status !== 206) { sync.truncate(0); have = 0; }   // the server sent it all: start again
            const reader = res.body.getReader();
            for (;;) {
                const { done, value } = await reader.read(); if (done) break;
                if (have + value.length > f.bytes) throw new Error(`${f.name}: longer than ${f.bytes} bytes`);
                if (sync) sync.write(value, { at: have }); else chunks.push(value);   // no OPFS: in memory this once
                have += value.length;
                progress(f, have);
            }
            if (have !== f.bytes) throw new Error(`${f.name}: ${have} bytes, expected ${f.bytes}`);
        }
    } finally { sync?.flush(); sync?.close(); }
    const blob = part ? await part.getFile() : new Blob(chunks);
    const hash = await hex(await blob.arrayBuffer());
    if (hash !== f.sha256) {
        if (part) await dir.removeEntry(name + ".part").catch(() => {});   // a bad piece: the next try starts clean
        throw new Error(`${f.name}: hash ${hash.slice(0, 12)}… is not ${f.sha256.slice(0, 12)}…`);
    }
    if (part) try { await part.move(name); return await (await dir.getFileHandle(name)).getFile(); } catch {}
    return blob;
}

// Without OPFS: Cache Storage under the file's hash (checked before it is kept), or memory only when that fails too.
async function cached(f) {
    const key = `/ask-tts/kept/${f.sha256}`;
    let cache = null;
    try { cache = await caches.open("pocket"); } catch {}
    try { const hit = await cache?.match(key); if (hit) { const b = await hit.blob(); if (b.size === f.bytes) { got.set(f.name, f.bytes); return b; } } } catch {}
    const res = await realFetch(f.url);
    if (!res.ok) throw new Error(`${f.name}: HTTP ${res.status}`);
    const chunks = [], reader = res.body.getReader();
    let have = 0;
    for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        if (have + value.length > f.bytes) throw new Error(`${f.name}: longer than ${f.bytes} bytes`);
        chunks.push(value); have += value.length; progress(f, have);
    }
    if (have !== f.bytes) throw new Error(`${f.name}: ${have} bytes, expected ${f.bytes}`);
    const blob = new Blob(chunks), hash = await hex(await blob.arrayBuffer());
    if (hash !== f.sha256) throw new Error(`${f.name}: hash ${hash.slice(0, 12)}… is not ${f.sha256.slice(0, 12)}…`);
    try { await cache?.put(key, new Response(blob)); } catch {}   // a full quota: this visit only
    return blob;
}

// Each file once per worker: load() and then the demo's fetches ask for the same files (without OPFS, a second ask
// would download again). A failure is not kept, so the next warm tries again.
const once = new Map();
const keptOnce = (f) => {
    if (!once.has(f.name)) once.set(f.name, kept(f).catch((e) => { once.delete(f.name); throw e; }));
    return once.get(f.name);
};

// Stored voice files nothing pinned names go: the earlier Kokoro (325 MB) and Kitten models, an older Pocket file.
async function sweep() {
    const keep = new Set(FILES.flatMap((f) => [`pocket-${f.sha256}`, `pocket-${f.sha256}.part`]));
    const dir = await navigator.storage.getDirectory();
    for await (const n of dir.keys()) if (/^(pocket|kokoro|kitten)-/.test(n) && !keep.has(n)) await dir.removeEntry(n).catch(() => {});
}

// The demo fetches its files (and ONNX Runtime its models) by name: those come from OPFS; nothing else is fetched.
const realFetch = self.fetch.bind(self);
self.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const f = BY_NAME.get(url);
    if (!f) return realFetch(input, init);
    return new Response(await keptOnce(f), { headers: { "content-type": "application/octet-stream" } });
};

let loading = null;
const load = () => loading ||= (async () => {
    await sweep().catch(() => {});
    await Promise.all(FILES.map(keptOnce));          // download + check everything first, so the bar means something
    self.postMessage({ stage: "prepare" });
    await loadBundle(DEFAULT_LANGUAGE, { initialLoad: true });
})().catch((e) => { loading = null; throw e; });

// 16-bit mono WAV at the model's rate.
function wavOf(samples, rate) {
    const b = new ArrayBuffer(44 + samples.length * 2), v = new DataView(b);
    const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, "data");
    v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i] || 0)) * 0x7fff, true);
    return b;
}

async function make(text, voice) {
    await load();
    const t = performance.now(), id = VOICES.some((v) => v.id === voice) ? voice : DEFAULT_VOICE;
    const { chunks, framesAfterEos } = splitIntoBestSentences(text);
    if (!chunks.length) throw new Error("no text to speak");
    await ensurePredefinedVoiceCached(id);
    collecting = []; isGenerating = true;
    try { await runGenerationPipeline(id, chunks, framesAfterEos); }
    finally { isGenerating = false; }
    const parts = collecting; collecting = null;
    if (stopped) throw new Error("cancelled");          // Radlor: half a line is no line
    const n = parts.reduce((a, p) => a + p.length, 0), audio = new Float32Array(n);
    let at = 0, bad = 0;
    for (const p of parts) { audio.set(p, at); at += p.length; }
    for (const x of audio) if (!Number.isFinite(x)) bad++;
    return { wav: wavOf(audio, currentSampleRate), secs: n / currentSampleRate, ms: performance.now() - t, bad };
}

// One thing at a time, in the order asked. Radlor: {cancel: id} drops a line: one not started is skipped, the one being
// made stops at its next frame (the generation loop checks isGenerating), so a jump to another step gets its line sooner.
let chain = Promise.resolve(), current = null, stopped = false;
const dropped = new Set();
self.onmessage = ({ data }) => {
    if (data.cancel !== undefined) {
        if (data.cancel === current) { stopped = true; isGenerating = false; } else dropped.add(data.cancel);
        return;
    }
    if (data.warm) {
        chain = chain.then(load)
            .then(() => self.postMessage({ warm: "ok" }), (e) => self.postMessage({ warm: "error", error: String(e?.message || e) }));
        return;
    }
    const { id, text, voice } = data;
    chain = chain.then(() => {
        if (dropped.delete(id)) throw new Error("cancelled");
        current = id; stopped = false;
        return make(text, voice).finally(() => { current = null; });
    })
        .then((r) => self.postMessage({ id, ...r }, [r.wav]), (e) => self.postMessage({ id, error: String(e?.message || e) }));
};
