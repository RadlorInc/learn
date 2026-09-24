# Aviso sobre cookies y seguimiento

> ⚠️ **BORRADOR PREPARADO POR MÁQUINA — NO REVISADO — NO ESTÁ EN VIGOR.**
> MACHINE-PREPARED DRAFT. NOT REVIEWED BY ANY SPANISH READER. NOT IN FORCE. STATUS: DRAFT.
> Translated by the engineering agent on 2026-09-23 from the PUBLIC part of
> `docs/legal/08-cookie-and-tracking-notice.md` (exactly the lines `src/app/legal/registry.ts` would render).
> Every placeholder is kept word for word, in English. Links still point to the English pages.
> Storage names (`milo-auth` and the rest) are technical identifiers and are kept as they are.
> This file counts as a Spanish version only once the REVIEWED-BY line below names the person who
> reviewed it and the date, in the form: name, YYYY-MM-DD. Until then the page cannot be published.

REVIEWED-BY:

---

## Versión sencilla

**Radlic no usa ninguna cookie.** Guarda una pequeña cantidad de información en su propio dispositivo para que la aplicación pueda funcionar sin conexión, recordar su configuración y mantener su sesión iniciada. Esa información se queda en el dispositivo. **No usamos cookies publicitarias, no realizamos ningún tipo de seguimiento por parte de terceros y nadie puede seguir a su hijo desde Radlic hasta otro sitio web o aplicación.**

## Qué guardamos en el dispositivo

| Nombre | Dónde | Para qué sirve | Cuánto dura | Tipo |
|---|---|---|---|---|
| — | Cookies | **No usamos ninguna.** | — | — |
| `milo-kv-migrated` | Almacenamiento local | Recuerda que sus datos guardados ya se trasladaron al formato de almacenamiento más reciente | Hasta que usted lo borre | Estrictamente necesario |
| Base de datos `milo`, almacén `kv` | Base de datos en el dispositivo | El perfil de su hijo, lo último que usó y dónde va en la práctica de cada tema, el trabajo pendiente de sincronizar si usted se queda sin conexión, el día en que se mostró por última vez la sugerencia de "practicar primero el tema anterior", las preferencias de voz y de velocidad, y el idioma elegido | Hasta que usted lo borre | Funcional |
| `milo-shell`, `milo-static`, `milo-assets` | Almacenamiento en caché | La propia aplicación, sus imágenes y su audio, para que las lecciones funcionen sin conexión y usen menos datos. Unos 7 MB después de una lección, y aumenta con el audio de cada lección | Hasta que la aplicación se actualice a una versión nueva | Estrictamente necesario |
| `al-lang` | Almacenamiento local | El idioma que eligió para el panel de padres y las pantallas de consentimiento (inglés o español) *(leído del código, 24 sep 2026)* | Hasta que lo borre | Funcional |
| `al-dash-prefs:<id de la cuenta>` | Almacenamiento local | Sus preferencias del panel: recordatorios pospuestos u ocultos, tipos de recordatorio desactivados, su última visita y qué recorridos guiados ya vio. Nada sobre un niño *(leído del código)* | Hasta que lo borre | Funcional |
| `exercise-done:<id del niño>:<id del ejercicio>` | Almacenamiento local | Que un niño terminó un ejercicio de la clase, para mostrarlo como hecho en este dispositivo *(leído del código)* | Hasta que lo borre | Funcional |
| `exercise-results-pending` | Almacenamiento local | Respuestas de un niño a ejercicios de la clase que aún no se pudieron enviar (por ejemplo, sin conexión), guardadas hasta enviarlas *(leído del código)* | Hasta que se envíen | Estrictamente necesario |
| `milo_active_plan_<id del niño>` | Almacenamiento local | Un registro antiguo del plan de aprendizaje de cada niño que algunas pantallas aún escriben *(leído del código)* | Hasta que lo borre | Funcional |
| `al-text-size` | Almacenamiento local | El tamaño de texto elegido en este dispositivo (Grande o Muy grande; no se guarda nada para Normal) *(leído del código, 24 sep 2026)* | Hasta que lo borre | Funcional |
| `milo-pwa-dismissed` | Almacenamiento local | Que usted cerró el aviso de "instalar la aplicación" *(leído del código)* | Hasta que lo borre | Funcional |
| `milo-auth` | Almacenamiento local | Mantiene su sesión iniciada | Hasta que cierre la sesión o esta caduque | Estrictamente necesario |
| `milo_active_learner` | Almacenamiento de sesión | Qué perfil de niño está usando esta pestaña del navegador | Hasta que se cierre la pestaña | Estrictamente necesario |

> Las dos últimas filas también se observaron en una sesión real de un niño con la sesión iniciada, el 24 de septiembre de 2026.

**Si no ha iniciado sesión, no se guarda nada que nombre o identifique a su hijo y no se nos envía nada, pero el dispositivo sí guarda una nota de la práctica.** Según lo medido el 24 de septiembre de 2026, después de una lección completa y una sesión de práctica sin iniciar sesión, la base de datos del dispositivo tenía dos entradas para el tema practicado: `milo-newflow-standing-device-<tema>` (hasta dónde llegó el dispositivo en la práctica de ese tema: un número de nivel, cuántas respuestas seguidas fueron correctas y si lo dominó) y, una vez terminado el tema, `milo-newflow-done-device-<tema>`; el almacenamiento local tenía `milo-kv-migrated`, y guarda `al-text-size` solo si se eligió un tamaño de texto más grande en este dispositivo. Ninguna contiene un nombre, un correo electrónico ni una cuenta, y permanecen en el dispositivo hasta que usted las borre.

## Lo que no hacemos

- Ninguna cookie.
- Ningún almacenamiento publicitario ni de marketing.
- Ningún script, baliza ni píxel de seguimiento de terceros — **ninguno, en ninguna parte**. La política de seguridad que el sitio envía a su navegador solo permite conexiones con el propio Radlic y con nuestro proveedor de base de datos, por lo que el navegador no puede llegar a una empresa de publicidad o de analítica, ni siquiera en principio.
- Ninguna huella digital del dispositivo, ningún identificador publicitario, ningún identificador entre sitios.
- Ninguna grabación de sesiones.

## Lo que sí registramos, en nuestros propios sistemas

Registramos un pequeño número de eventos del producto — como el inicio de una sesión — para ver qué partes de la aplicación se usan. Se guardan en nuestra propia base de datos, están vinculados al identificador interno de un niño y no a un nombre, y **se eliminan automáticamente a los 90 días**. No se comparten con nadie y no se usan para publicidad.

Nuestros proveedores de base de datos y de alojamiento también conservan sus propios registros de solicitudes, que incluyen la dirección IP y el tipo de navegador de cada visita. Esto se describe en nuestra [Política de privacidad](https://radlic.com/legal/privacy).

## Sus opciones

Todo lo que guardamos en el dispositivo es necesario para que la aplicación funcione o para recordar su configuración, así que no hay nada que desactivar — desactivarlo haría que la aplicación dejara de funcionar. Puede borrar el almacenamiento de su navegador en cualquier momento; si lo hace, se cerrará su sesión y la copia sin conexión de sus lecciones se volverá a descargar la próxima vez.

No añadiremos ningún almacenamiento que la aplicación no necesite sin preguntarle antes, y estará desactivado a menos que usted lo active.

## Preguntas

support@radlor.com
