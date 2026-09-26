# Política de conservación y eliminación de datos

> ⚠️ **BORRADOR PREPARADO POR MÁQUINA — NO REVISADO — NO ESTÁ EN VIGOR.**
> MACHINE-PREPARED DRAFT. NOT REVIEWED BY ANY SPANISH READER. NOT IN FORCE. STATUS: DRAFT.
> Translated by the engineering agent on 2026-09-23 from the PUBLIC part of
> `docs/legal/04-data-retention-policy.md` (exactly the lines `src/app/legal/registry.ts` would render).
> Every placeholder is kept word for word, in English. Links still point to the English pages.
> Table names, job names and the like (`learner_events`, `purge-old-learner-events`) are kept as they are.
> This file counts as a Spanish version only once the REVIEWED-BY line below names the person who
> reviewed it and the date, in the form: name, YYYY-MM-DD. Until then the page cannot be published.

REVIEWED-BY:

---

## 1. Principio

Conservamos la información personal de los niños solo durante el tiempo razonablemente necesario para prestar el servicio para el que se recopiló. No la conservamos indefinidamente ni la guardamos para ningún fin secundario.

## 2. Calendario de conservación

| Datos | Dónde están | Se conservan | ¿Se aplica automáticamente? |
|---|---|---|---|
| Eventos del producto — inicios de sesión de uso y similares | `learner_events` | **90 días**, de forma continua | **Sí.** Proceso nocturno `purge-old-learner-events`, 03:17. Se le ha visto eliminar filas reales |
| Respuestas de diagnóstico antiguas | tablas de elementos de diagnóstico | **90 días** | Sí. Proceso `prune-diagnostic-items`, 03:22. Todavía no ha tenido una fila lo bastante antigua para eliminarla |
| Registros de fallos | `error_events` | **90 días** | Sí. Proceso `prune-error-events`, 03:27. Todavía no se ha ejercido sobre una fila real |
| Direcciones de correo electrónico de adultos recogidas antes del registro | `diagnostic_leads` | **24 meses** | Sí. Proceso `prune-diagnostic-leads`, 03:32. La primera eliminación corresponde a 2028 |
| Perfil del niño — nombre de pila, avatar, franja de edad, grado | `learners`, `learner_access` | Hasta que se elimine la cuenta o el perfil | **Ningún proceso programado.** La eliminación se hace solo a petición del padre o la madre |
| Progreso en las lecciones, puntos, estadísticas, comentarios | `lesson_progress`, `point_events`, `learner_stats`, `lesson_feedback`, `game_settings` | Hasta que se elimine la cuenta o el perfil | **Ningún proceso programado** |
| Cuenta del padre o la madre | `auth.users`, `profiles`, `parent_pins` | Hasta que se elimine la cuenta | **Ningún proceso programado** |
| Cuenta cuya dirección de correo electrónico nunca se confirmó, sin ningún niño | `auth.users` (desde la migración `20260923180000`, solo se crea un perfil cuando se confirma la dirección) | **3 días** desde el registro | **Sí, una vez que las migraciones `20260923180000` y `20260923180100` se apliquen en producción.** Proceso nocturno `prune-unconfirmed-users`, 03:37, además de un barrido único al aplicarlas. Probado en una copia local del esquema; todavía no se ha ejercido en producción |
| Eventos de inicio de sesión | `auth_events` | Actualmente se conservan indefinidamente | **Ningún proceso programado** |
| Sesiones activas, incluidas la dirección IP y el navegador | `auth.sessions` | Hasta que la sesión caduque | Gestionado por el proveedor |
| Registros de solicitudes del proveedor — dirección IP, navegador, ciudad/región/país derivados de la IP, identificador de cuenta | Los registros de plataforma propios de nuestro proveedor de base de datos | **Desconocido.** El proyecto tiene 20 días y todavía no ha caducado nada, así que "se conserva indefinidamente" aún no puede distinguirse de "se conserva al menos 20 días" | **Totalmente fuera de nuestros procesos** |
| Registros de solicitudes y de consola del alojamiento | Proveedor de alojamiento | Disponibles para nosotros durante 1 hora en nuestro plan (Hobby), según el panel del proveedor, 24 de septiembre de 2026 | Gestionado por el proveedor |
| Copias de seguridad | Artefacto de compilación cifrado, con caducidad de 30 días por diseño | 30 días | **Funciona — restauración comprobada el 23 de septiembre de 2026.** Consulte la sección 6 |
| Correspondencia de soporte con los padres | Correo electrónico | 12 meses | No automatizado |

**Registros de consentimiento — `parental_consents`, creado el 23 de septiembre de 2026.** Contiene el adulto, el niño, el método, las marcas de tiempo, la versión de cada documento mostrado y el estado. ~~Está vinculado a la cuenta del adulto y se elimina en cascada al eliminar la cuenta.~~ **Desde 20260926100900 (N11, 26 de septiembre de 2026, pendiente de revisión legal): cerrar la cuenta CONSERVA el registro** — un consentimiento otorgado se marca como retirado y después el `parent_id` de la fila pasa a null (no nombra ninguna cuenta; conserva la dirección de correo a la que se envió, que es lo que lo hace prueba). Los registros respondidos se conservan sin eliminación programada; las solicitudes sin responder (pendientes, caducadas) se eliminan con la cuenta.

Se trata de una tensión real, no de un descuido: es lo que exige "eliminamos todo lo que tenemos sobre usted", y es lo contrario de lo que suele requerir el mantenimiento de registros del consentimiento para niños. Resolverla requiere un registro de consentimiento anonimizado que sobreviva a la eliminación, además de una frase en la Política de privacidad que lo describa — no existe ninguno de los dos. **Decidido por el fundador para la beta el 24 de septiembre de 2026, pendiente de revisión por un abogado:** la eliminación en cascada se mantiene hasta que exista un registro de consentimiento anonimizado, y la Política de privacidad y los Términos lo indican.

## 3. Eliminación a petición

Un padre o una madre puede pedirnos que eliminemos la información de su hijo en cualquier momento, y puede retirar su consentimiento en cualquier momento. Cualquiera de las dos solicitudes activa la eliminación conforme al procedimiento de Derechos de los padres, antes del calendario anterior. Objetivo: completarla en un plazo de 10 días desde que verifiquemos a quien la solicita.

**Defecto conocido — la eliminación todavía no es completa.** Los registros de fallos llevan el identificador interno de un niño sin ningún vínculo en la base de datos que los una al niño, por lo que no desaparecen cuando se elimina al niño. Tres de esos registros ya apuntan a niños que ya no existen, y cada uno contiene la página en la que estaban y el tipo de navegador. Hasta que se añada ese vínculo, "eliminamos los datos de su hijo" no es del todo cierto, y a un padre o una madre que pidiera la eliminación se le atendería en todas partes excepto aquí. Esto debe corregirse antes de publicar la página de Derechos de los padres.

> **Resuelto el 23 de septiembre de 2026 (medido en producción).** Los registros de fallos ahora llevan un vínculo en la base de datos con el niño que **los elimina junto con el niño** (`error_events.learner_id` → `learners`, con eliminación en cascada — leído del catálogo de producción). Los tres registros huérfanos se eliminaron al añadir ese vínculo (registros de fallos: de 9 a 6) y, después de eliminar a los niños de prueba, **ningún registro de fallos apunta a un niño que ya no exista** (0 huérfanos). Ese mismo día se comprobó con filas reales la eliminación de un niño desde la aplicación: todas las filas de ese niño, y su propio inicio de sesión, habían desaparecido después, y otro niño de la misma cuenta no se vio afectado. Ese niño no tenía registros de fallos, por lo que la eliminación en cascada de los registros de fallos está comprobada por el catálogo y por la eliminación de los niños de prueba, no por esa única eliminación.

## 4. Cuándo conservamos algo durante más tiempo

Conservamos información más allá de su eliminación programada solo cuando debemos hacerlo: para cumplir una obligación legal, incluido el mantenimiento de registros fiscales y contables; para establecer, ejercer o defender una reclamación legal; para resolver una controversia o hacer cumplir nuestros acuerdos; o para mantener la seguridad, cuando sea necesario un registro limitado. Cuando lo hacemos, conservamos el registro mínimo necesario y lo eliminamos en cuanto desaparece el motivo. Cada una de esas retenciones se registra con su motivo y su fecha de finalización prevista.

## 5. Las copias de seguridad y los registros propios del proveedor

Hay dos cosas que quedan fuera de nuestros procesos de eliminación, y ambas deben describirse a los padres con honestidad, en lugar de pasarlas por alto:

**Copias de seguridad.** Eliminar un registro de la base de datos activa no lo elimina de una copia de seguridad. Las copias de seguridad están diseñadas para caducar a los 30 días, así que un registro eliminado puede seguir existiendo en una copia de seguridad durante ese tiempo como máximo. Nunca restauramos desde una copia de seguridad el registro de un niño que haya sido eliminado. Una copia de seguridad contiene todo lo que hay en la base de datos, incluidos los tokens de las sesiones de inicio de sesión de los padres, por lo que está cifrada y la frase de contraseña solo se guarda en el gestor de contraseñas y en el almacén de secretos del servicio que aloja el código.

**Los registros de plataforma del proveedor de base de datos.** Registran la dirección IP, el tipo de navegador y una ubicación aproximada derivada de la IP en cada solicitud, incluidas las solicitudes que hacen los dispositivos de los niños. Son registros propios del proveedor, no tablas nuestras, y ninguno de nuestros procesos de eliminación llega a ellos. En nuestro plan, el proveedor pone estos registros a nuestra disposición durante 7 días (según su panel, 24 de septiembre de 2026).

## 6. Cómo se hace cumplir

| Control | Mecanismo | Prueba de que funciona |
|---|---|---|
| Eliminación de los eventos del producto caducados | `purge-old-learner-events`, cada noche a las 03:17 | **Comprobado** — una ejecución informó de la eliminación de filas reales. 19 ejecuciones desde el 4 de septiembre, sin fallos |
| Eliminación de respuestas de diagnóstico, filas de fallos y correos de contacto caducados | Otros tres procesos nocturnos | Activos, sin fallos, pero ninguno ha tenido todavía una fila lo bastante antigua para eliminarla — así que cada uno está *programado* en lugar de *comprobado* |
| Eliminación a petición de los padres | Procedimiento de Derechos de los padres | El registro de solicitudes de los padres en Radlor Ops |
| Copias de seguridad | Artefacto cifrado cada noche | **Restauración comprobada el 23 de septiembre de 2026.** El proceso había fallado 13 noches seguidas (del 10 al 22 de septiembre, por falta de secretos). Se corrigieron los secretos; la ejecución n.º 39 (manual, volcado de 06:48:17 a 06:48:50 UTC) generó un artefacto cifrado de 87.248 bytes. Se descifró, se restauró en una base de datos local desechable y las **32 tablas públicas** coincidieron exactamente con producción, tabla por tabla (968 filas en total) — comprobado frente a producción y, por separado, frente al número de filas registrado en el propio volcado. La copia descifrada se destruyó después. **Queda por vigilar:** que la primera ejecución nocturna *programada* se complete correctamente por sí sola. La restauración requiere versiones de los servicios de autenticación y almacenamiento que coincidan con las de producción y el rol `supabase_admin`; la nota de restauración de `backup.yml` lo indica, incluido cómo comprobar primero las versiones de producción |
| Revisión anual de esta política | El responsable indicado arriba | Registrado en Radlor Ops, junto con el registro de solicitudes de los padres |

**Requisito de verificación.** Antes de confiar en cualquier proceso de eliminación, hay que verlo eliminar un registro de prueba sembrado, y verlo *no* eliminar un registro que todavía esté dentro de plazo. Un proceso que informa "0 filas eliminadas" no significa nada hasta que se le haya visto eliminar algo primero.
