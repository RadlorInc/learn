/**
 * THE CONSENT WORDING, VERBATIM, IN ONE PLACE.
 *
 * ⚠️ EVERY `en` STRING BELOW IS COPIED FROM `docs/legal/02-coppa-direct-notice-to-parents.md` OR
 * `docs/legal/03-consent-and-checkout-screen-copy.md` AND MUST NOT BE EDITED HERE. Small changes to
 * consent wording can invalidate the consent, and the screen has to say what the policy says.
 * `consentCopy.test.ts` compares this file against those two documents in BOTH directions — a doc
 * sentence missing from here is red, and a string here that is not in the doc is red — with the
 * expected text read from the documents, not from this file. To change a word: change the document,
 * then this file, then bump `NOTICE_VERSION` if it is the notice (its text is hash-pinned per version).
 *
 * The one deliberate addition: `[click here](%WITHDRAW%)` in B3 and the %GRANT%/%DECLINE% buttons in
 * B1 carry the link the document describes in words. The test strips link syntax before comparing.
 *
 * ⚠️⚠️ EVERY `es` STRING IS A MACHINE TRANSLATION BY THE ENGINEERING AGENT, 2026-09-23, AND HAS NOT
 * BEEN REVIEWED BY ANYONE WHO SPEAKS SPANISH. A parent's consent is only meaningful if they can read
 * what they agreed to, so this is a known gap waiting on a human reviewer — not a solved problem. The
 * Spanish adds "(en inglés)" after each link to an English-only document, following the precedent the
 * founder set in `ConsentLine` (a Spanish reader should know before clicking). Every consent row
 * records the language it was given in (`parental_consents.lang`), so the ones given against this
 * unreviewed text can be found and re-asked once it is reviewed.
 */
export type Lang = 'en' | 'es'
export type L = Record<Lang, string>

export const SPANISH_REVIEW = 'machine-translated 2026-09-23, NOT reviewed by a Spanish speaker' as const

/** Document 02's version. Its English body is hash-pinned in `consentCopy.test.ts`: change a word of
 *  the notice without bumping this and that test goes red, because every consent row stores this
 *  string as "what the parent was shown". */
export const NOTICE_VERSION = 'notice-v6'

// ─────────────────────────── Document 02 — the direct notice (the screen) ───────────────────────────
export const NOTICE = {
  title: { en: 'Before your child starts: what we collect, and your choice',
           es: 'Antes de que su hijo empiece: qué recopilamos y su decisión' },
  intro: { en: "You are creating a Radlic account for your children. United States law — the Children's Online Privacy Protection Act, which protects children under 13 — requires us to tell you exactly what we collect and to get your permission first. We ask every parent for the same permission, whatever their children's ages. You give it once, for this account, and it covers every child you add to it. Here it is, in plain language.",
           es: 'Está creando una cuenta de Radlic para sus hijos. La ley de los Estados Unidos — la Ley de Protección de la Privacidad Infantil en Línea, que protege a los menores de 13 años — nos exige decirle exactamente qué recopilamos y obtener su permiso primero. Pedimos el mismo permiso a todos los padres, sea cual sea la edad de sus hijos. Lo da una sola vez, para esta cuenta, y cubre a todos los niños que añada a ella. Aquí lo tiene, en lenguaje sencillo.' },
  collectHeading: { en: 'What we collect from your child', es: 'Qué recopilamos de su hijo' },
  columns: [
    { en: 'What', es: 'Qué' },
    { en: 'Why we need it', es: 'Por qué lo necesitamos' },
    { en: 'Is it required?', es: '¿Es obligatorio?' },
  ],
  rows: [
    [{ en: "Your child's first name (or a nickname you choose)", es: 'El nombre de pila de su hijo (o un apodo que usted elija)' },
     { en: "So the app can address your child and so you can tell your children's profiles apart", es: 'Para que la aplicación pueda dirigirse a su hijo y para que usted pueda distinguir los perfiles de sus hijos' },
     { en: 'Required — you may use a nickname instead of a real name', es: 'Obligatorio — puede usar un apodo en lugar de un nombre real' }],
    [{ en: 'The avatar you pick for your child', es: 'El avatar que usted elija para su hijo' },
     { en: 'So your child recognises their own profile', es: 'Para que su hijo reconozca su propio perfil' },
     { en: 'Required — chosen from a set we provide; it is not a photograph', es: 'Obligatorio — se elige de un conjunto que ofrecemos; no es una fotografía' }],
    [{ en: "The lessons you choose for your child, and a grade band worked out from them — grades 3–5 or grades 6–8, stored as the age range 9–11 or 12–14. We do not store your child's exact grade or age", es: 'Las lecciones que usted elija para su hijo y una franja de grados deducida de ellas — grados 3 a 5 o grados 6 a 8, guardada como la franja de edad 9–11 o 12–14. No guardamos el grado exacto ni la edad de su hijo' },
     { en: 'To give your child work at the right level', es: 'Para darle a su hijo trabajo del nivel adecuado' },
     { en: 'Required', es: 'Obligatorio' }],
    [{ en: 'The username your child signs in with', es: 'El nombre de usuario con el que su hijo inicia sesión' },
     { en: 'So your child can sign in without needing an email address of their own', es: 'Para que su hijo pueda iniciar sesión sin necesitar una dirección de correo electrónico propia' },
     { en: 'Required', es: 'Obligatorio' }],
    [{ en: 'Answers to maths questions, scores, points, progress, and anything saved in a game', es: 'Respuestas a preguntas de matemáticas, puntuaciones, puntos, progreso y todo lo que se guarde en un juego' },
     { en: 'This is the product: it is how the app decides what to teach next and how it shows you progress', es: 'Esto es el producto: así decide la aplicación qué enseñar a continuación y cómo le muestra a usted el progreso' },
     { en: 'Required', es: 'Obligatorio' }],
    [{ en: 'Any feedback your child sends us about a lesson', es: 'Cualquier comentario que su hijo nos envíe sobre una lección' },
     { en: 'So we can fix what is not working', es: 'Para poder arreglar lo que no funciona' },
     { en: 'Only if they send it', es: 'Solo si lo envía' }],
    [{ en: "Basic technical information from the device — a sign-in token kept on the device; a per-tab marker of which child's profile is in use; an internal identifier for the child, which appears on every progress and event record; a random identifier per event, used to avoid duplicates; the device's IP address and browser type, and an approximate location — city, region and country — derived from the IP address by our hosting and database providers, who record it for every request; and, if the app crashes, the page being viewed and the browser type. We set no cookies",
       es: 'Información técnica básica del dispositivo — un token de inicio de sesión guardado en el dispositivo; una marca por pestaña que indica qué perfil de niño está en uso; un identificador interno del niño, que aparece en cada registro de progreso y de eventos; un identificador aleatorio por evento, usado para evitar duplicados; la dirección IP y el tipo de navegador del dispositivo, y una ubicación aproximada — ciudad, región y país — derivada de la dirección IP por nuestros proveedores de alojamiento y de base de datos, que la registran en cada solicitud; y, si la aplicación falla, la página que se estaba viendo y el tipo de navegador. No usamos cookies' },
     { en: 'To keep the app working, keep the account secure, and keep your child signed in', es: 'Para que la aplicación funcione, mantener la cuenta segura y mantener a su hijo con la sesión iniciada' },
     { en: 'Required for the app to function', es: 'Obligatorio para que la aplicación funcione' }],
    [{ en: 'A small number of product events, such as a lesson starting', es: 'Un pequeño número de eventos del producto, como el inicio de una lección' },
     { en: 'So we can see which parts of the app are used. Tied to an internal identifier, not a name; deleted after 90 days', es: 'Para ver qué partes de la aplicación se usan. Vinculados a un identificador interno, no a un nombre; se eliminan a los 90 días' },
     { en: 'Required', es: 'Obligatorio' }],
  ] as L[][],
  doNotAsk: { en: '**We do not ask your child for:** a last name, an email address, a phone number, a home address, a photograph, a voice recording, or their exact location.',
              es: '**No le pedimos a su hijo:** apellido, dirección de correo electrónico, número de teléfono, domicilio, fotografía, grabación de voz ni su ubicación exacta.' },
  useHeading: { en: 'What we do with it', es: 'Qué hacemos con ella' },
  use: { en: 'We use this information only to run Radlic for your child: to teach, to track progress, to show you reports, and to keep the service secure and working.',
         es: 'Usamos esta información solo para que Radlic funcione para su hijo: para enseñar, hacer seguimiento del progreso, mostrarle informes y mantener el servicio seguro y en funcionamiento.' },
  thirdParty: { en: "**Nothing about your child is given to any other company for that company's own purposes.** The only outside companies involved at all are the ones that run our systems for us — the database that stores the information and the hosting service that delivers the app — and they act only on our instructions. Every one of them is listed at https://radlic.com/legal/subprocessors. There is no analytics company, no advertising company, and no artificial-intelligence service that receives anything your child types or says.",
                es: '**Nada sobre su hijo se entrega a ninguna otra empresa para los fines propios de esa empresa.** Las únicas empresas externas que intervienen son las que operan nuestros sistemas por nosotros — la base de datos que almacena la información y el servicio de alojamiento que entrega la aplicación — y solo actúan según nuestras instrucciones. Todas figuran en https://radlic.com/legal/subprocessors (en inglés). No hay ninguna empresa de analítica, ninguna empresa de publicidad ni ningún servicio de inteligencia artificial que reciba nada de lo que su hijo escribe o dice.' },
  weDoNot: { en: '**We do not:**', es: '**Nosotros no:**' },
  weDoNotList: [
    { en: "sell your child's information;", es: 'vendemos la información de su hijo;' },
    { en: "use your child's information to show them advertising, or let anyone else do so;", es: 'usamos la información de su hijo para mostrarle publicidad, ni permitimos que otros lo hagan;' },
    { en: 'build an advertising profile of your child;', es: 'creamos un perfil publicitario de su hijo;' },
    { en: "share your child's information with anyone for their own purposes;", es: 'compartimos la información de su hijo con nadie para sus propios fines;' },
    { en: 'ask your child to give us more information than they need to take part.', es: 'le pedimos a su hijo más información de la que necesita para participar.' },
  ] as L[],
  permissionHeading: { en: 'Your permission', es: 'Su permiso' },
  permission: { en: 'Before we collect any of the above, we need your verifiable consent.',
                es: 'Antes de recopilar cualquiera de estos datos, necesitamos su consentimiento verificable.' },
  /** Document 02 follows this with a drafters' placeholder for the card path, which is not built. A placeholder
   *  is a note to the drafters and is never rendered — so there is nothing here for it. */
  permissionHow: { en: "We send a consent request to your email address, you confirm it, and then we send a second confirmation email a day later to the same address. This one permission covers every child you add to this account, now or later: each time you add a child, you confirm in the app that you are that child's parent or legal guardian, and we record when you did. You can withdraw your permission from the second email or in the app, at any time.",
                   es: 'Enviamos una solicitud de consentimiento a su dirección de correo electrónico, usted la confirma y, un día después, enviamos un segundo correo de confirmación a la misma dirección. Este único permiso cubre a todos los niños que añada a esta cuenta, ahora o más adelante: cada vez que añada un niño, usted confirma en la aplicación que es su padre, madre o tutor legal, y registramos cuándo lo hizo. Puede retirar su permiso desde el segundo correo o en la aplicación, en cualquier momento.' },
  rightsHeading: { en: 'Your rights as a parent', es: 'Sus derechos como padre o madre' },
  rightsIntro: { en: 'At any time, you can:', es: 'En cualquier momento, usted puede:' },
  rightsList: [
    { en: '**See** everything we hold about your child;', es: '**Ver** todo lo que tenemos sobre su hijo;' },
    { en: "**Delete** your child's information;", es: '**Eliminar** la información de su hijo;' },
    // The document's line ends in a drafters' placeholder (deletion is to be restored once built) — not rendered.
    { en: "**Withdraw your consent** — for one child, or for every child on the account. We stop any further collection and delete the information of each child it covers. Your account stays open.",
      es: '**Retirar su consentimiento** — para un niño o para todos los niños de la cuenta. Dejamos de recopilar y eliminamos la información de cada niño afectado. Su cuenta sigue abierta.' },
  ] as L[],
  rightsHow: { en: "To do any of these, open your parent dashboard, choose your child's card and then **Login & data** — you can download a copy of everything we hold and delete the profile from there — use **Account → Withdraw permission for all your children** to delete every child's information and keep the account, or use **Account → Close your account** to delete everything at once. You can also simply email support@radlor.com. We will verify that the request comes from you before we act on it, and we will complete the request within 10 days.",
               es: 'Para hacer cualquiera de estas cosas, abra su panel de padres, elija la tarjeta de su hijo y luego **Inicio de sesión y datos** — desde ahí puede descargar una copia de todo lo que tenemos y eliminar el perfil — use **Cuenta → Retirar el permiso para todos sus hijos** para eliminar la información de todos los niños y conservar la cuenta, o use **Cuenta → Cerrar su cuenta** para eliminarlo todo a la vez. También puede simplemente escribir a support@radlor.com. Verificaremos que la solicitud proviene de usted antes de actuar, y completaremos la solicitud en un plazo de 10 días.' },
  keepHeading: { en: 'How long we keep it', es: 'Cuánto tiempo la conservamos' },
  keep: { en: "We keep your child's information only as long as we need it to provide the service, and then we delete it. The full schedule is in our Data Retention Policy at https://radlic.com/legal/retention.",
          es: 'Conservamos la información de su hijo solo mientras la necesitamos para prestar el servicio y después la eliminamos. El calendario completo está en nuestra Política de conservación de datos en https://radlic.com/legal/retention (en inglés).' },
  protectHeading: { en: 'How we protect it', es: 'Cómo la protegemos' },
  protect: { en: "Every connection to Radlic is encrypted, the database enforces rules so that one family's records cannot be read by another, and the keys that would allow broad access are never sent to a browser.",
             es: 'Todas las conexiones con Radlic están cifradas, la base de datos aplica reglas para que los registros de una familia no puedan ser leídos por otra, y las claves que permitirían un acceso amplio nunca se envían a un navegador.' },
  detailsHeading: { en: 'Full details', es: 'Todos los detalles' },
  details: { en: 'Our Privacy Policy at https://radlic.com/legal/privacy has the complete picture, including how to reach us.',
             es: 'Nuestra Política de privacidad en https://radlic.com/legal/privacy (en inglés) ofrece la información completa, incluida la forma de contactarnos.' },
  contactHeading: { en: 'Contact us', es: 'Contáctenos' },
  contact: ['Radlor Inc.', '254 Chapman Rd, Ste 208 #28608, Newark, DE 19702', 'support@radlor.com'],
  primary:   { en: "I'm the parent or legal guardian — continue", es: 'Soy el padre, la madre o el tutor legal — continuar' },
  secondary: { en: 'Read the full Privacy Policy', es: 'Leer la Política de privacidad completa (en inglés)' },
  tertiary:  { en: 'Not now', es: 'Ahora no' },
}

// ─────────────────────── Document 03 · B1 — the consent request email ───────────────────────
export const B1 = {
  subject: { en: 'Please confirm: permission for your children to use Radlic', es: 'Confirme, por favor: permiso para que sus hijos usen Radlic' },
  /** "{name}" is the parent's first name (typed at signup, or from Google); with none, the line is "Hi,". */
  hi: { en: 'Hi {name},', es: 'Hola, {name}:' },
  thanks: { en: 'Thanks for signing up with Radlic.', es: 'Gracias por registrarse en Radlic.' },
  before: { en: 'Before your children can use it, US law requires your permission.', es: 'Antes de que sus hijos puedan usarla, la ley de los EE. UU. exige su permiso.' },
  /** Sits directly on top of `list`, with no gap. */
  store: { en: 'For each child you add, we store:', es: 'Por cada niño que añada, guardamos:' },
  list: [
    { en: 'their first name or nickname, the avatar you pick and their username', es: 'su nombre de pila o apodo, el avatar que usted elija y su nombre de usuario' },
    { en: 'the lessons you choose, and a grade band (grades 3–5 or 6–8) worked out from them', es: 'las lecciones que usted elija y una franja de grados (grados 3 a 5 o 6 a 8) deducida de ellas' },
    { en: 'their answers, points and progress', es: 'sus respuestas, puntos y progreso' },
    { en: 'any feedback they send, a few product events and basic device information', es: 'los comentarios que envíe, algunos eventos del producto e información básica del dispositivo' },
  ] as L[],
  doNot: { en: "We never sell your child's information or use it for advertising.", es: 'Nunca vendemos la información de su hijo ni la usamos para publicidad.' },
  ignore: { en: "Didn't sign up? Ignore this email.", es: '¿No se registró? Ignore este correo.' },
  details: { en: "Here's our detailed Privacy Policy: [Privacy Policy](https://radlic.com/legal/privacy)", es: 'Aquí está nuestra Política de privacidad detallada: [Política de privacidad](https://radlic.com/legal/privacy) (en inglés)' },
  address: 'Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702',
  // ── the tick is the email's checkbox-link AND the page's box (/consent/respond); ticking the page's box IS the grant ──
  covers: { en: "This one permission covers every child you add to this account, now or later. Each time you add a child, we ask you to confirm in the app that you are that child's parent or legal guardian.", es: 'Este único permiso cubre a todos los niños que añada a esta cuenta, ahora o más adelante. Cada vez que añada un niño, le pediremos que confirme en la aplicación que es su padre, madre o tutor legal.' },
  tick: { en: "I’ve Read and I Agree to the Privacy Policy.", es: 'He leído y acepto la Política de privacidad.' },
  decline: { en: 'No — cancel this request', es: 'No — cancelar esta solicitud' },
}

// ─────────── Document 03 · B0 / B0t — the sign-up email (email-and-password sign-ups, 2026-09-25) ───────────
/** B0: the parent's sign-up email — B1's body word for word, its own subject, and `confirms` above the button. */
export const SIGNUP = {
  subject: { en: 'Confirm your email and give permission for your children', es: 'Confirme su correo y dé permiso para sus hijos' },
  confirms: { en: 'Clicking the button also confirms your email address.', es: 'Al hacer clic en el botón también confirma su dirección de correo electrónico.' },
}
/** B0t: a teacher's sign-up email — confirms the address, asks nothing. `ignore` and the address are B1's. */
export const CONFIRM_EMAIL = {
  subject: { en: 'Confirm your email for Radlic', es: 'Confirme su correo para Radlic' },
  thanks: { en: 'Thanks for signing up with Radlic.', es: 'Gracias por registrarse en Radlic.' },
  please: { en: 'Please confirm your email address.', es: 'Confirme su dirección de correo electrónico, por favor.' },
  button: { en: 'Confirm my email', es: 'Confirmar mi correo' },
}

// ─────────────────────── Document 03 · B2 — the screen after "I give permission" ───────────────────────
export const B2 = {
  heading: { en: 'Thank you — permission recorded', es: 'Gracias — permiso registrado' },
  body: [
    { en: 'We have recorded your permission. You can add your children now.', es: 'Hemos registrado su permiso. Ya puede añadir a sus hijos.' },
    { en: "We will send you one more email in a little while to confirm it was really you. If it wasn't, that email will let you cancel immediately and we will delete everything we hold about any child on the account.",
      es: 'Dentro de un rato le enviaremos un correo más para confirmar que realmente fue usted. Si no lo fue, ese correo le permitirá cancelar de inmediato y eliminaremos todo lo que tenemos sobre cualquier niño de la cuenta.' },
  ] as L[],
}

// ─────────────────────── Document 03 · B3 — the second email, a day later ───────────────────────
export const B3 = {
  subject: { en: 'Confirming the permission you gave for your children', es: 'Confirmación del permiso que dio para sus hijos' },
  hi: { en: 'Hi,', es: 'Hola:' },
  /** ⚠️ "Yesterday" is only true if B3 goes out a day later. `config.ts` refuses, in production, a
   *  delay that would make it false — the wording and the timer are bound, not merely adjacent. */
  yesterday: { en: "Yesterday you gave permission for your children to use Radlic, and for us to collect each child's first name, grade band, and maths progress. It covers every child you add to this account.",
               es: 'Ayer usted dio permiso para que sus hijos usen Radlic y para que recopilemos el nombre de pila, la franja de grados y el progreso en matemáticas de cada niño. Cubre a todos los niños que añada a esta cuenta.' },
  ifYou: { en: "**If that was you, you don't need to do anything.**", es: '**Si fue usted, no tiene que hacer nada.**' },
  ifNot: { en: "**If it wasn't you, [click here](%WITHDRAW%) to withdraw permission.** We will immediately stop collecting and delete everything we hold about every child on the account. Your account stays open.",
           es: '**Si no fue usted, [haga clic aquí](%WITHDRAW%) para retirar el permiso.** Dejaremos de recopilar de inmediato y eliminaremos todo lo que tenemos sobre todos los niños de la cuenta. Su cuenta sigue abierta.' },
  anyTime: { en: 'You can withdraw permission at any time in future, too: https://radlic.com/legal/parent-rights.',
             es: 'También puede retirar el permiso en cualquier momento en el futuro: https://radlic.com/legal/parent-rights (en inglés).' },
  address: 'Radlor Inc., 254 Chapman Rd, Ste 208 #28608, Newark, DE 19702',
}

// ─────────────────────── Document 03 · the withdrawal screen (where B3's link lands) ───────────────────────
export const WITHDRAW = {
  heading: { en: 'Withdraw permission', es: 'Retirar el permiso' },
  body: [
    { en: 'If you withdraw permission, we will stop collecting information from your child, delete what we already hold about them, and close their profile. This cannot be undone.',
      es: 'Si retira el permiso, dejaremos de recopilar información de su hijo, eliminaremos lo que ya tenemos sobre él y cerraremos su perfil. Esto no se puede deshacer.' },
    // The document's refund paragraph is WITHHELD: its own ⛔ table says it "must not be said" until
    // billing is live. `consentCopy.test.ts` names it in WITHHELD, so it cannot silently return or vanish.
    { en: '**This applies only to this child.** Your account stays open, and any other children on it are not affected.',
      es: '**Esto se aplica solo a este hijo.** Su cuenta sigue abierta y los demás hijos que tenga en ella no se ven afectados.' },
  ] as L[],
  confirm: { en: "Withdraw permission and delete my child's data", es: 'Retirar el permiso y eliminar los datos de mi hijo' },
  keep:    { en: 'Keep my settings', es: 'Mantener mi configuración' },
}


// ─────────────────────── Consent-once (2026-09-24): document 03, the new screens ───────────────────────
export const WITHDRAW_ALL = {
  heading: { en: "Withdraw permission for all your children", es: 'Retirar el permiso para todos sus hijos' },
  body0: { en: "If you withdraw permission, we will stop collecting information from every child on your account, delete everything we hold about each of them — including their own sign-ins — and close their profiles. This cannot be undone.", es: 'Si retira el permiso, dejaremos de recopilar información de todos los niños de su cuenta, eliminaremos todo lo que tenemos sobre cada uno de ellos — incluidos sus propios inicios de sesión — y cerraremos sus perfiles. Esto no se puede deshacer.' },
  body1: { en: "**Your account stays open.** If you add a child again later, we will ask for your permission again first.", es: '**Su cuenta sigue abierta.** Si más adelante vuelve a añadir un niño, primero le pediremos su permiso de nuevo.' },
  confirm: { en: "Withdraw permission and delete my children's data", es: 'Retirar el permiso y eliminar los datos de mis hijos' },
}
export const WAITING = {
  heading: { en: "Waiting for your permission", es: 'Esperando su permiso' },
  body: { en: "We have emailed {email}. Open that email and choose \"I give permission\" — then you can add your children. The link works for {days} days.", es: 'Le hemos enviado un correo a {email}. Ábralo y elija "Doy mi permiso" — después podrá añadir a sus hijos. El enlace funciona durante {days} días.' },
  resend: { en: "Send the email again", es: 'Enviar el correo de nuevo' },
}
export const ATTEST = {
  tick: { en: "I'm this child's parent or legal guardian. The permission I gave on {date} applies to this child too.", es: 'Soy el padre, la madre o el tutor legal de este niño. El permiso que di el {date} también se aplica a este niño.' },
  link: { en: "Read the notice you agreed to", es: 'Leer el aviso que aceptó' },
}
export const REASK = {
  heading: { en: "We've changed what we collect", es: 'Hemos cambiado lo que recopilamos' },
  body: { en: "Please read the updated notice and give your permission again before your children continue.", es: 'Lea el aviso actualizado y vuelva a dar su permiso antes de que sus hijos continúen.' },
}

/**
 * ⚠️⚠️ NOT FROM THE DOCUMENTS — PROPOSED WORDING, AWAITING THE FOUNDER'S APPROVAL.
 * Documents 02 and 03 have no text for these moments, and each one is a screen a parent will see.
 * They are kept deliberately flat and factual, and each is checked against what the system does:
 * `withdrawn` says the child's data was deleted: it is only reachable once `20260923140000` is applied,
 * and from then `consent_withdraw` deletes the child (every cascade) and keeps the consent record. The drift test excludes this block by name, and
 * the report lists every string in it.
 */
export const PROPOSED = {
  checkHeading: { en: 'Check your email', es: 'Revise su correo' },
  checkBody: { en: 'We have sent a message to {email}. It explains what we would collect and asks for your permission. The link in it works for {days} days.',
               es: 'Le hemos enviado un mensaje a {email}. Explica qué recopilaríamos y le pide su permiso. El enlace funciona durante {days} días.' },
  checkPending: { en: 'We have already sent you a message asking for your permission. The link in it works until {date}.',
                  es: 'Ya le hemos enviado un mensaje pidiéndole su permiso. El enlace funciona hasta el {date}.' },
  sendAgain: { en: 'Send it again', es: 'Enviarlo de nuevo' },
  stale: { en: 'This page is out of date. Please reload it and read the notice again.', es: 'Esta página está desactualizada. Vuelva a cargarla y lea el aviso de nuevo.' },
  declinedHeading: { en: 'Request cancelled', es: 'Solicitud cancelada' },
  declinedBody: { en: 'Nothing about your child has been collected.', es: 'No se ha recopilado nada sobre su hijo.' },
  withdrawnHeading: { en: 'Permission withdrawn', es: 'Permiso retirado' },
  withdrawnBody: { en: 'We have stopped collecting information about your child and deleted what we held about them. Your account stays open.', es: 'Hemos dejado de recopilar información sobre su hijo y hemos eliminado lo que teníamos sobre él. Su cuenta sigue abierta.' },
  withdrawnAllBody: { en: 'We have stopped collecting information about every child on your account and deleted what we held about them. Your account stays open.', es: 'Hemos dejado de recopilar información sobre todos los niños de su cuenta y hemos eliminado lo que teníamos sobre ellos. Su cuenta sigue abierta.' },
  expiredHeading: { en: 'This link has expired', es: 'Este enlace ha caducado' },
  expiredBody: { en: 'Ask again from your parent dashboard.', es: 'Vuelva a solicitarlo desde su panel de padres.' },
  usedHeading: { en: 'This link has already been used', es: 'Este enlace ya se ha usado' },
  invalidHeading: { en: 'This link is not valid', es: 'Este enlace no es válido' },
  keptBody: { en: 'Nothing has changed.', es: 'No ha cambiado nada.' },
  error: { en: 'Something went wrong. Please try again.', es: 'Algo salió mal. Inténtelo de nuevo.' },
}
