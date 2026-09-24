# Proveedores de servicios y subencargados del tratamiento

> ⚠️ **BORRADOR PREPARADO POR MÁQUINA — NO REVISADO — NO ESTÁ EN VIGOR.**
> MACHINE-PREPARED DRAFT. NOT REVIEWED BY ANY SPANISH READER. NOT IN FORCE. STATUS: DRAFT.
> Translated by the engineering agent on 2026-09-23 from the PUBLIC part of
> `docs/legal/07-subprocessors.md` (exactly the lines `src/app/legal/registry.ts` would render).
> Every placeholder is kept word for word, in English. Links still point to the English pages.
> Vendor names, region codes (us-east-1, iad1) and technical names (`sendBeacon`) are kept as they are.
> This file counts as a Spanish version only once the REVIEWED-BY line below names the person who
> reviewed it and the date, in the form: name, YYYY-MM-DD. Until then the page cannot be published.

REVIEWED-BY:

---

## Cómo leer esta página

Un **proveedor de servicios** trata datos siguiendo nuestras instrucciones y sin ningún fin propio. Según la COPPA, entregar información personal de niños a un tercero para los fines *propios* de ese tercero es una **divulgación**, y la divulgación requiere un consentimiento separado de los padres. Por eso la columna que importa es la de la derecha.

## La lista

| Proveedor | Qué hace para nosotros | ¿Recibe información sobre un niño? | Exactamente qué | Dónde | Fundamento |
|---|---|---|---|---|---|
| **Supabase** | Todo el sistema de servidor — base de datos, autenticación, almacenamiento de archivos. El navegador se comunica con él directamente. | **Sí.** Es el único servicio que contiene información de un niño. | Nombre de pila, número de avatar, franja de edad, grado, lecciones elegidas; progreso en las lecciones, puntos, ajustes del tiempo de juego; los toques en "no lo entendí"; eventos del producto; registros de fallos; las credenciales de inicio de sesión del niño | us-east-1 (leído de la API del proveedor) | Proveedor de servicios — esencial para prestar el servicio |
| **Registros de la plataforma Supabase** (el mismo proveedor, un asunto distinto) | El registro de solicitudes propio del proveedor, fuera del esquema de nuestra base de datos | **Sí, de forma incidental.** Cada solicitud que hace el dispositivo de un niño | Dirección IP, agente de usuario y una ubicación aproximada derivada de la IP — ciudad, región y país — en cada solicitud muestreada, además del identificador de la cuenta con sesión iniciada en la mayoría | El mismo | Proveedor de servicios. **Fuera de nuestros propios procesos de conservación — consulte la Política de conservación** |
| **Vercel** | Alojamiento y distribución de contenido | **Sí, de forma incidental.** Registros de solicitudes y líneas de fallos escritas en la consola | Dirección IP, ruta de la solicitud, agente de usuario; una línea de fallo puede incluir el identificador interno de un niño y la página que se estaba viendo | Las funciones se ejecutan en iad1, Washington D. C., EE. UU. (confirmado en el panel de Vercel el 24 de septiembre de 2026) | Proveedor de servicios — esencial |
| **Stripe** | Pago y facturación de las suscripciones — **no se usa durante la beta**: la facturación está desactivada y no se envía ningún dato a Stripe | **No.** | Ninguno durante la beta | — | Proveedor de servicios, solo datos del padre o la madre, cuando empiece la facturación |
| **Resend** | Entrega todos los correos electrónicos que envía el servicio. Está configurado como el relé SMTP detrás del sistema de correo del servicio de autenticación, así que, aunque la aplicación no contiene código de correo electrónico propio, **todos los mensajes que recibe un padre o una madre los entrega Resend** | **No**, salvo que algún día se cree un correo de progreso que nombre a un niño — no existe ninguno | La dirección de correo electrónico del padre o la madre y el contenido del mensaje | Estados Unidos: Virginia del Norte, us-east-1 (confirmado en el panel de Resend el 24 de septiembre de 2026) | Proveedor de servicios |
| **Inicio de sesión con Google** | Inicio de sesión opcional para adultos | **No.** Solo adultos, mediante una redirección de nivel superior; no enviamos nada | — | — | No recibe nuestros datos |
| **GitHub Actions** | Copias de seguridad cifradas de la base de datos, guardadas como un artefacto de compilación durante 30 días | **Lo haría** — una copia de seguridad lo contiene todo | La base de datos completa, cifrada | GitHub (github.com), Estados Unidos; se conservan 30 días, según nuestro proceso de copia de seguridad | Proveedor de servicios. Las copias de seguridad vuelven a funcionar desde el 23 de septiembre de 2026; ese día se comprobó una restauración completa. Consulte el Programa de seguridad. |
| **Google Fonts** | Nada durante el uso de la aplicación | **No.** Las fuentes se descargan al compilar la aplicación y se sirven desde nuestro propio dominio. Verificado: 212 archivos de fuentes generados, cero referencias al servidor de fuentes de Google en la hoja de estilos compilada | — | — | No recibe nada durante el uso |

## Servicios que no reciben nada sobre un niño

Ningún proveedor de analítica. Ningún proveedor de supervisión de errores o fallos. Ningún servicio de publicidad o de seguimiento. Ningún proveedor de IA ni de conversión de texto a voz durante el uso de la aplicación — cada clip de audio que oye un niño es un archivo estático servido desde nuestro propio dominio y, cuando falta un clip, la alternativa es la voz del propio navegador, generada en el dispositivo. **Nunca se envía nada de lo que introduce un niño a un proveedor de IA o de audio.**

**Cómo se estableció esta ausencia**, para que pueda volver a comprobarse en lugar de darse por cierta: no hay instalado ningún paquete de analítica; no existe en el código fuente ningún script externo, baliza, `sendBeacon`, WebSocket ni píxel de seguimiento; la Política de Seguridad de Contenido (Content-Security-Policy) que sirve producción limita las conexiones a nuestro propio origen y a Supabase, por lo que el navegador no puede, por su propia estructura, llegar a un servidor de analítica; y una sesión real de un niño realizada en producción — lista de módulos, una lección completa con audio, problemas de práctica — generó 56 solicitudes a exactamente un origen, el nuestro, y cero solicitudes a terceros. La misma captura muestra las cargas de audio y de páginas, lo que demuestra que la captura estaba activa y no vacía.
