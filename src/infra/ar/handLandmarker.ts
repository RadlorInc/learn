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
/**
 * ⚠️ THE LOAD IS TIMED OUT, AND THAT IS NOT BELT-AND-BRACES — IT IS THE ONLY WAY OUT.
 * This pulls ~7.8 MB of model from storage.googleapis.com and ~11 MB of wasm from jsDelivr. On a
 * slow 3G phone, or with either host blocked, those fetches do not REJECT — they hang, so a bare
 * `await` never settles, `useFingerCounter`'s try/catch never fires, `status` stays 'loading' for
 * ever and `CamGate` sits on the screen. A promise that never settles is not an error path anyone
 * can catch; it has to be raced. Rejecting turns the hang into the denial case the gate already
 * handles, which offers the tap door that works with no camera at all.
 */
export const LOAD_TIMEOUT_MS = 20_000

export async function createHandLandmarker(numHands: 1 | 2 = 1): Promise<HandLandmarkerInstance> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const load = (async () => {
    const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
    return HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands,
      minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    })
  })()
  try {
    return await Promise.race([
      load,
      new Promise<never>((_, rej) => {
        // `name` is what CamGate matches on, so give it one that reads as "not denied, not missing"
        // and falls through to its generic "have another go, or tap instead".
        timer = setTimeout(() => rej(Object.assign(new Error('camera model download timed out'), { name: 'ModelTimeout' })), LOAD_TIMEOUT_MS)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
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
