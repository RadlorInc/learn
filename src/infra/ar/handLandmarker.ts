'use client'

export const VERSION = '0.10.35'
export const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`
export const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandLandmarkerInstance = any

export interface CreateHandLandmarkerOptions {
  numHands?: number
  minHandDetectionConfidence?: number
  minHandPresenceConfidence?: number
  minTrackingConfidence?: number
}

export async function createHandLandmarker(
  opts: CreateHandLandmarkerOptions = {},
): Promise<HandLandmarkerInstance> {
  const {
    numHands = 1,
    minHandDetectionConfidence = 0.5,
    minHandPresenceConfidence = 0.3,
    minTrackingConfidence = 0.3,
  } = opts
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands,
    ...(minHandDetectionConfidence !== undefined ? { minHandDetectionConfidence } : {}),
    ...(minHandPresenceConfidence !== undefined ? { minHandPresenceConfidence } : {}),
    ...(minTrackingConfidence !== undefined ? { minTrackingConfidence } : {}),
  })
}

export async function openCamera(video: HTMLVideoElement): Promise<MediaStream> {
  // ⚠️ The caller must already have the <video> MOUNTED. Gating its render on "the camera
  // started" is a chicken-and-egg that grants the camera and then throws on a null element —
  // which reads to the user as "the camera did not start" while Chrome says "Using now".
  if (!video) throw new Error('NoVideoElement')
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  })
  try {
    video.srcObject = stream
    await video.play()
  } catch (e) {
    // Never leave a GRANTED camera running behind a failure — the light stays on and the browser
    // keeps reporting the site as using it.
    stream.getTracks().forEach(t => t.stop())
    throw e
  }
  return stream
}
