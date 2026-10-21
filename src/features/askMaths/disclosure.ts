/**
 * What the parent reads and agrees to before Ask maths is turned on for a child (docs/product/ask-maths.md). The
 * version is stored with who agreed and when (ask_maths_settings); `set_ask_maths` accepts only the version below, so
 * changing a word here means a new version string here AND in that function (a migration), and every parent is asked
 * again when they next turn it on.
 *
 * ⚠️ DRAFT FOR THE ATTORNEY (docs/product/ask-maths.md, "Before it is turned on", carries the same text and the open questions).
 * Ask maths stays off (ASK_MATHS / NEXT_PUBLIC_ASK_MATHS) until the founder and the attorney approve this text and the
 * notice, privacy policy and subprocessor changes it needs. The Spanish is a machine draft, like the notice's.
 */
export const DISCLOSURE_VERSION = 'ask-maths-v1'

export const DISCLOSURE: Record<'en' | 'es', { title: string; points: string[]; agree: string; button: string }> = {
  en: {
    title: 'Before you turn on Ask maths for {name}',
    points: [
      '{name} types a maths question, and a whiteboard lesson is drawn and spoken for it.',
      'What {name} types is sent from our server to askRadlor, the whiteboard service of Radlor Inc. (the company behind Radlic). askRadlor uses Anthropic’s Claude model to write the lesson. askRadlor keeps none of it. Anthropic handles it under its commercial terms, which do not let it train its models on it.',
      'Each question is checked first. If it is not about maths, or it has personal details in it (a full name with a school, an address, a phone number, an email), no lesson is made, and a question with personal details is not kept.',
      'We keep each question and its lesson for 30 days, so you can see them here, and then delete them. You can delete them yourself at any time.',
      'The voice is made on {name}’s device. The first time, the device downloads the voice files (about 166 MB), part of them from Hugging Face, which sees only the device’s internet address.',
      '{name} can ask up to the number of questions a day you choose. You can turn Ask maths off at any time.',
    ],
    agree: 'I am {name}’s parent or guardian, and I agree to this.',
    button: 'Turn on Ask maths',
  },
  es: {
    title: 'Antes de activar Ask maths para {name}',
    points: [
      '{name} escribe una pregunta de matemáticas y se dibuja y se narra una lección en una pizarra.',
      'Lo que {name} escribe se envía desde nuestro servidor a askRadlor, el servicio de pizarra de Radlor Inc. (la empresa detrás de Radlic). askRadlor usa el modelo Claude de Anthropic para escribir la lección. askRadlor no guarda nada de ello. Anthropic lo trata según sus condiciones comerciales, que no le permiten entrenar sus modelos con ello.',
      'Primero se revisa cada pregunta. Si no es de matemáticas, o contiene datos personales (un nombre completo con una escuela, una dirección, un teléfono, un correo), no se hace ninguna lección, y una pregunta con datos personales no se guarda.',
      'Guardamos cada pregunta y su lección durante 30 días para que usted pueda verlas aquí, y luego las eliminamos. Usted puede eliminarlas en cualquier momento.',
      'La voz se crea en el dispositivo de {name}. La primera vez, el dispositivo descarga los archivos de voz (unos 166 MB), una parte desde Hugging Face, que solo ve la dirección de internet del dispositivo.',
      '{name} puede hacer hasta el número de preguntas al día que usted elija. Puede desactivar Ask maths en cualquier momento.',
    ],
    agree: 'Soy el padre, la madre o el tutor de {name} y estoy de acuerdo.',
    button: 'Activar Ask maths',
  },
}
