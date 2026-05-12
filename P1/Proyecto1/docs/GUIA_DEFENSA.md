# Guia de defensa y monologo tecnico

## Veredicto de cumplimiento

El proyecto cumple con los requisitos funcionales RF01 a RF05 y con la exigencia de documentar un Plan Estrategico de Seguridad. La aplicacion implementa autenticacion robusta, control de acceso por roles, flujo de aprobacion de albums, validacion y analisis de imagenes con deteccion de esteganografia, cuarentena y revision manual, y una galeria publica segura con cabeceras de seguridad. La documentacion del plan estrategico y la matriz de amenazas estan en la carpeta docs.

## Monologo sugerido (para exponer)

Buenos dias. Este proyecto se llama SecureFrame Gallery y responde al tema de desarrollo seguro de una galeria multimedia publica con deteccion de esteganografia y gestion de riesgos en el SDLC. El objetivo fue construir una aplicacion funcional, pero con controles de seguridad en cada fase: requisitos, diseno, desarrollo, pruebas y despliegue.

La arquitectura es Node.js con Express, plantillas EJS y base de datos PostgreSQL. Elegi este stack porque permite un servidor simple, control total del flujo y una integracion clara con medidas de seguridad. La aplicacion separa roles entre usuario y supervisor y aplica acceso basado en roles para evitar que un usuario regular ejecute acciones de supervision.

En autenticacion, el sistema usa Argon2id para hashing de contrasenas. Esta eleccion es intencional porque Argon2id es resistente a GPU y ataques por fuerza bruta al exigir costo de memoria y tiempo. Se agrego rate limiting en rutas de autenticacion para reducir intentos repetidos y se evita la enumeracion de usuarios con mensajes genericos de error.

Las sesiones se manejan con express-session y se almacenan en PostgreSQL mediante connect-pg-simple. Esto evita sesiones en memoria y permite escalar manteniendo la seguridad. Las cookies de sesion son HttpOnly y con misma politica de sitio para mitigar robo de sesion y CSRF.

En el flujo de albums, el usuario crea una solicitud que queda en estado pendiente. El supervisor revisa y aprueba o rechaza. Esto cumple el requisito RF02 y garantiza que solo se suba contenido a albums aprobados. La entrada de titulo y descripcion se valida y se escapa para prevenir XSS almacenado.

En la subida de imagenes, el control critico es analizar el archivo antes de publicarlo. No se confia en la extension ni en el MIME del cliente. Se valida el tipo real con file-type usando magic numbers. Luego se re-encoda con Sharp para eliminar metadatos EXIF y normalizar el archivo. Esta decision evita vectores de ocultamiento en metadatos y reduce riesgos de XSS en EXIF.

El analisis esteganografico es heuristico y combina dos indicadores. Primero, se detecta trailing data al final de JPEG o PNG. Segundo, se evalua la estadistica de LSB midiendo la proporcion de bits y la variacion entre bits consecutivos. Este enfoque es coherente con el requisito de analizar estructura y contenido real del archivo.

El sistema asigna un score de sospecha entre 0 y 100. Si el score es 50 o mas, la imagen entra en cuarentena. Si es menor, se publica. El score se calcula asi:

- Si hay datos extra al final del archivo, se suman 65 puntos porque es un indicador fuerte de payload oculto.
- Si la distribucion de LSB esta demasiado cercana a aleatoriedad ideal, se suman 20 puntos, porque ese patron puede indicar insercion de datos.
- Si la variacion de LSB es alta, se suman 15 puntos por comportamiento atipico.
- Si el archivo es muy grande, se suman 10 puntos como recomendacion de revision manual.

Con esto se generan razones textuales que el supervisor puede revisar. El analisis no pretende ser forense definitivo, pero es adecuado para defensa en profundidad en un contexto academico.

En la revision manual, el supervisor ve las imagenes en cuarentena, puede aprobarlas o rechazarlas, y el sistema registra el estado y el revisor. Esto cumple RF04 y asegura trazabilidad.

En la visualizacion publica, se limita a albums aprobados y se agregan cabeceras de seguridad con Helmet, incluyendo CSP y X-Content-Type-Options. Esto reduce XSS y ataques por MIME sniffing. Ademas, se usa CSRF para proteger acciones sensibles.

En cuanto a la gestion de riesgos, se documentaron amenazas a nivel de hardware, codigo, diseno y arquitectura en el plan estrategico. La aplicacion incorpora mitigaciones puntuales como validacion de entradas, consultas parametrizadas, control de sesiones y roles, y limites de carga.

Las limitaciones reconocidas son que el analisis esteganografico es heuristico y puede tener falsos positivos o negativos, y no se incluye un escaneo antimalware externo ni una cola asincrona distribuida. Aun asi, cumple el alcance de la actividad y demuestra un flujo completo seguro.

## Resumen de librerias y por que se eligieron

- express: framework minimalista y estable para rutas y middlewares.
- ejs: renderizado simple del lado servidor.
- pg: cliente confiable para PostgreSQL.
- express-session y connect-pg-simple: sesiones seguras persistidas en base de datos.
- argon2: hashing moderno de contrasenas con resistencia a fuerza bruta.
- csurf: proteccion contra CSRF en formularios.
- express-rate-limit: mitigacion de fuerza bruta y abuso.
- helmet: cabeceras de seguridad, CSP y nosniff.
- file-type: validacion real de tipo de archivo por firma binaria.
- multer: manejo de carga de archivos.
- sharp: re-encoding y limpieza de metadatos EXIF.
- uuid: nombres unicos para archivos almacenados.

## Mapa rapido de requisitos y evidencias

- RF01 Registro y autenticacion segura: validaciones, Argon2id, rate limiting, sesiones seguras.
- RF02 Gestion de albums: solicitud, aprobacion, validacion de entradas.
- RF03 Subida y deteccion de esteganografia: magic numbers, re-encoding sin EXIF, score de sospecha, cuarentena.
- RF04 Revision manual: bandeja de cuarentena y aprobacion o rechazo.
- RF05 Visualizacion publica segura: solo albums aprobados, CSP y nosniff.

## Preguntas tipicas y respuestas cortas

- Por que Argon2id y no bcrypt: Argon2id es mas resistente a ataques de GPU por su costo de memoria.
- Por que no confiar en MIME: porque el cliente puede falsificarlo; se valida el tipo real con magic numbers.
- Por que re-encoding: elimina EXIF y normaliza la imagen, reduciendo vectores de ataque ocultos.
- Por que score heuristico: es una defensa en profundidad que cumple el requisito sin pretender forensica completa.
- Por que cuarentena: permite revision manual y reduce el riesgo de publicar contenido sospechoso.

## Referencias internas

- Plan estrategico y documentos finales en la carpeta docs.
- Esquema de base de datos en sql/schema.sql.
- Analisis esteganografico en src/services/stegAnalysis.js.
