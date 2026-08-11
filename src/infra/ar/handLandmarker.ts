'use client'

export const VERSION = '0.10.35'
export const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`
export const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandLandmarkerInstance = any

/**
 * How many hands to track is the only thing a caller has ever varied.
 *
 * ⚠️ The three confidences stay at MediaPipe's own 0.5 DELIBERATELY. Loosening detection is
 * backwards for a single-hand reading: every marginal claim — a sibling, a face, a cushion —
 * EVICTS the tracked hand from the only slot, and each eviction is exactly the discontinuity
 * an event detector is least able to tell from a real gesture.
 */
export async function createHandLandmarker(numHands: 1 | 2 = 1): Promise<HandLandmarkerInstance> {
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands,
    minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
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
