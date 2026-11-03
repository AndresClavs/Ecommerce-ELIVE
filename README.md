# ELIVE ECOMERCE

Tienda de ropa para niños, mujeres y hombres. Reconstrucción MVC basada en las vistas del prototipo.

- [Base de datos e instrucciones para HeidiSQL](database/README.md)
- [Restricciones de las vistas y experiencia de usuario](docs/requisitos-vistas.md)

Estado: las siete vistas están conectadas a MariaDB/MySQL mediante una API MVC en Node.js y Express. Pagos exclusivamente de demostración, sin cobros reales.

## Ejecutar en Windows

Requiere Node.js 22 o posterior y tu servidor MySQL/MariaDB iniciado, con los scripts 01 y 02 ya importados. No vuelvas a importar ni borrar la base existente.

```powershell
npm.cmd install
npm.cmd run build:css
npm.cmd start
```

Abrir **http://localhost:3000**. No abrir los HTML con doble clic: necesitan la API. `public/styles.css` ya está generado; recompilarlo cuando cambien las clases de las vistas.

La conexión local está en `.env`, excluido de Git. En otro equipo, copiar `.env.example` a `.env` y completar los datos de conexión. Nunca introducir credenciales de la base en el JavaScript público. La dirección usada en el navegador debe coincidir con `APP_ORIGIN`; por defecto es `http://localhost:3000`.

## Publicar una demo gratuita en Render y TiDB Cloud

Esta combinación tiene límites de uso: Render suspende el servicio web tras 15 minutos sin tráfico y puede tardar alrededor de un minuto en reactivarlo. TiDB Cloud Starter incluye una cuota gratuita mensual con límites de almacenamiento y consultas; al agotarla, las conexiones se limitan hasta el siguiente mes. Revisa las [condiciones de Render Free](https://render.com/docs/free) y la [cuota actual de TiDB Cloud](https://www.pingcap.com/pricing/). No uses esta configuración para producción.

1. Crea una cuenta en [TiDB Cloud](https://tidbcloud.com/) y un clúster **Starter**. En **Connect**, selecciona conexión pública y guarda los datos de host, puerto, usuario y contraseña en un lugar seguro. TiDB requiere TLS.
2. Desde el botón **Connect** de TiDB, utiliza sus datos de conexión en un cliente MySQL, como HeidiSQL. Conéctate a la instancia y ejecuta `database/01_esquema.sql` y luego `database/02_catalogo_inicial.sql`, una sola vez y en ese orden. Comprueba los resultados descritos en [database/README.md](database/README.md).
3. Crea una cuenta en [Render](https://render.com/) y elige **New > Web Service**. Conecta el repositorio `AndresClavs/Ecommerce-ELIVE` y la rama `main`; selecciona Node y el plan **Free**. El comando de inicio es `npm start`.
4. En **Environment** del servicio, agrega `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los datos de TiDB, además de `DB_SSL=true`, `COOKIE_SECURE=true` y `PAYMENT_MODE=demo`. Después de generar el dominio `onrender.com`, configura también `APP_ORIGIN` con la URL completa, por ejemplo `https://tu-app.onrender.com`.
5. Espera a que termine el despliegue y abre `https://tu-app.onrender.com/api/health`. Debe responder `{"database":"connected"}`. Luego comparte el dominio base con tu profesora.

No escribas las credenciales de TiDB en Git ni las compartas por el chat. La tienda funciona con pagos de demostración: no ingreses datos de tarjetas reales. El servicio gratuito puede tardar en despertar después de estar inactivo.

## Arquitectura MVC

```text
server.js                  Inicio del servidor
src/config/database.js     Pool SQL y transacciones con reintentos acotados
src/models/                Sesiones/cuentas, catálogo/bolsa/favoritos, pedidos
src/controllers/api.js     Validación y coordinación de solicitudes/respuestas
src/routes/api.js          Rutas de la API y límite de intentos de acceso
src/validation.js          Restricciones de campos, cantidades e identificadores
public/*.html              Siete vistas conservadas del prototipo
public/pages/*.js          Interacciones específicas de cada vista
public/api.js              Comunicación HTTP; no almacena credenciales SQL
public/elive.js             Componentes compartidos y adaptación del estado
```

## Qué funciona

- Catálogo de 30 productos desde la base, filtros, búsqueda, orden y tallas infantiles/adultas.
- Bolsa persistente por sesión, cantidades de 1 a 10, control de stock, eliminación y Deshacer.
- Favoritos persistentes y Deshacer al quitar.
- Registro, inicio/cierre de sesión y contraseñas con scrypt sin truncamiento. Cookie HttpOnly y SameSite; token rotado al autenticar.
- Checkout con las validaciones originales y su retroalimentación; revalidación en servidor de datos personales. Tarjeta/CVV de demostración solo se validan en la página: **no se envían ni se guardan**.
- Creación transaccional de pedido, detalle histórico, pago marcado como simulado, historial, descuento de stock y vaciado de bolsa.
- Idempotencia al reintentar la compra; totales calculados por el servidor; envío $4.99 o gratis con cuenta.
- Confirmación, listado de pedidos propios y seguimiento. Sin botón público para cambiar estados.
- Controles de origen, consultas parametrizadas y errores sin revelar detalles de la conexión.

## Pruebas

```powershell
npm.cmd test
npm.cmd run test:integration
```

La integración crea una base `elive_test_<identificador>` y la elimina al finalizar, usando las credenciales locales. Necesita permisos de creación/eliminación de esa base temporal. No altera `elive_ecommerce_mvc`. Comprueba carrito, favoritos, autenticación, envío gratis, pedidos, acceso ajeno, doble envío, stock concurrente, rechazo de datos de tarjeta y entrega de las siete vistas.

Pruebas ejecutadas en el servidor MariaDB local: unitarias e integración correctas. Revisión en navegador: catálogo, ficha infantil, error de talla, adición a bolsa, persistencia al navegar, subtotal/envío y errores de los ocho campos del checkout. Las pruebas automatizadas de compras usaron exclusivamente bases temporales.

## Límites de esta etapa

No hay pasarela de cobro real, envío automático de correos ni panel administrativo. El enlace de resumen abre la aplicación de correo. El historial se consulta desde la base, pero todavía no hay interfaz administrativa para avanzarlo, cancelar o devolver inventario. Las fotos están pendientes: se muestra «Imagen no disponible» en lugar de imágenes ajenas al producto. Los favoritos y el carrito pertenecen a la sesión del navegador; los pedidos de una cuenta sí se recuperan al iniciar sesión en otra sesión.

Esta configuración está preparada para uso local. Antes de publicar se requiere HTTPS, `COOKIE_SECURE=true`, un usuario SQL de aplicación y la integración real de pagos. `PAYMENT_MODE=demo` es la única modalidad implementada; otra configuración bloquea la creación de compras.

Referencias técnicas usadas: [consultas preparadas mysql2](https://github.com/sidorares/node-mysql2/blob/master/website/docs/documentation/prepared-statements.mdx) y [conflicto de lectura MariaDB 1020](https://mariadb.com/docs/server/reference/error-codes/mariadb-error-codes-1000-to-1099/e1020).
