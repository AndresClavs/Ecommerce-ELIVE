# Base de datos de ELIVE ECOMERCE

HeidiSQL es el cliente con el que administras la base. Este diseño requiere un servidor **MySQL 8.0.16 o posterior, o MariaDB 10.6 o posterior**. Las restricciones CHECK requieren un motor que las aplique; no utilizar MySQL 5.7. Referencias: [MySQL CHECK](https://dev.mysql.com/blog-archive/mysql-8-0-16-introducing-check-constraint/) y [MariaDB constraints](https://mariadb.com/docs/server/reference/sql-statements/data-definition/constraint).

## Importación en HeidiSQL

1. Abre tu conexión MySQL/MariaDB y ejecuta `SELECT VERSION();` en una pestaña de consulta para comprobar el motor. La conexión debe tener permisos de creación de base, tablas y vistas.
2. Abre `01_esquema.sql` como UTF-8 y ejecuta el archivo completo. Crea **elive_ecommerce_mvc**, separada de la base anterior. Si ya existe o aparece cualquier error, detente y no continúes con el siguiente archivo. El script no elimina ni reemplaza tablas. Los cambios DDL no se revierten como una transacción: si falla a mitad, revisa el error antes de reintentar.
3. Ejecuta `02_catalogo_inicial.sql` completo UNA VEZ. Si ocurre un error antes de COMMIT, ejecuta `ROLLBACK;` y revisa la causa. No continuar hasta COMMIT después de un error ni repetir la carga en una base con datos.
4. Ejecuta `03_verificar.sql`. Debes obtener 10 productos por categoría, 30 productos en total, 120 variantes y 1800 unidades iniciales.
5. Actualiza el árbol de bases en HeidiSQL para ver las tablas.

Se cargan datos de demostración editables en la base, no productos fijos en JavaScript. Los 15 artículos por talla son stock de ejemplo. No se crean clientes, contraseñas, pedidos ni pagos ficticios. Las fotografías quedan pendientes; el catálogo devuelve imagen NULL y la interfaz debe mostrar un marcador informativo.

## Relación con las interfaces

| Interfaz | Tablas principales |
|---|---|
| Inicio, categorías, filtros y ofertas | categorias, tipos_prenda, productos, imagenes_producto; vista_catalogo |
| Ficha y selección de talla | productos, tallas, variantes_producto |
| Registro y cuenta | clientes, sesiones |
| Bolsa | carritos, carrito_items, variantes_producto, configuracion_tienda |
| Favoritos | favoritos, sesiones, productos |
| Datos de entrega y confirmación | pedidos, pedido_items |
| Seguimiento | estados_pedido, historial_pedido |
| Pago | pagos; referencias y estados, nunca tarjeta completa ni CVV |

Las tres categorías son niños, mujeres y hombres; los tipos de prenda son una clasificación independiente (camisetas, pantalones, etc.). Los slugs nuevos son `ninos`, `mujeres`, `hombres`: el controlador deberá adaptar los parámetros antiguos `mujer` y `hombre` o actualizar sus enlaces.

Se admiten invitados: una sesión tiene cliente opcional, un carrito y favoritos sin duplicados. Al registrarse o iniciar sesión, el servidor debe asociar la cuenta a la sesión y rotar el token conservando su ID. Los favoritos y el carrito son por sesión; sincronizarlos entre dispositivos requerirá lógica explícita de combinación. Al cerrar sesión, revocar y crear una sesión anónima nueva para evitar acceso a la cuenta anterior.

## Responsabilidad de cada capa

La base asegura claves foráneas, correo único, talla obligatoria en el carrito, ausencia de líneas duplicadas, cantidades de 1 a 10, stock no negativo, precios positivos, oferta inferior al precio anterior y total aritmético. Usa DECIMAL para dinero y utf8mb4 para tildes y ñ. Una baja de producto debe hacerse con `activo=0` para conservar pedidos históricos.

El backend debe repetir TODAS las validaciones de `docs/requisitos-vistas.md`: formato de nombres y correo, teléfono, dirección, contraseña de 6–128 caracteres, autenticación y autorizaciones. Las longitudes del esquema no sustituyen esas reglas. Guardar hash seguro de contraseña, nunca texto plano; `token_hash` guarda SHA-256 binario de un token aleatorio de alta entropía, no el token entregado al navegador. Usar consultas parametrizadas y modo SQL estricto en cada conexión.

La interfaz mantiene los mensajes, el foco, Deshacer, estados vacíos, navegación por teclado y retroalimentación. Una base de datos no implementa estas interacciones. La API debe devolver errores por campo y errores de stock para que las vistas puedan explicarlos sin borrar lo escrito.

## Contrato obligatorio al crear un pedido

Esta entrega prepara la persistencia; aún hay que implementar esta transacción en el modelo MVC. No crear pedidos mediante INSERT independientes desde el navegador.

1. Validar sesión no revocada ni vencida y cliente activo si está asociado. Comprobar propiedad del carrito. Obtener una clave de idempotencia por intento de compra (mínimo 16 caracteres), reutilizada al reintentar.
2. Iniciar transacción y bloquear el carrito (`SELECT ... FOR UPDATE`). Todas las mutaciones de ese carrito deben adquirir el mismo bloqueo. Si ya existe el pedido para sesión/clave, devolver ese pedido sin descontar stock nuevamente. Si se reutiliza la clave con datos distintos, devolver conflicto.
3. Leer líneas; rechazar carrito vacío. Bloquear variantes en orden de ID y productos necesarios; verificar activos, talla, cantidad 1–10 y stock suficiente. La disponibilidad mostrada antes de comprar puede haber cambiado.
4. Calcular precios desde productos y envío desde configuracion_tienda: $4.99 por defecto, gratis para cuenta autenticada según configuración. No aceptar precios, totales o el beneficio de envío que envíe el navegador. Una bolsa vacía no genera pedido ni envío.
5. Insertar pedido en estado `recibido`, copiar datos de entrega y líneas con nombre, SKU, talla y precio. Verificar que el subtotal del pedido coincide con la suma de las líneas: este agregado entre tablas no lo impone un CHECK.
6. Descontar stock con `UPDATE variantes_producto SET stock=stock-? WHERE id=? AND stock>=?`; comprobar una fila afectada por variante. Insertar historial inicial, vaciar carrito y confirmar con COMMIT. Ante cualquier fallo, ROLLBACK; permitir reintento con la misma clave. Resolver interbloqueos con reintento acotado.
7. No llamar a la pasarela mientras se mantienen bloqueos SQL. Crear intento de pago idempotente después de confirmar la transacción. Confirmar pago solo desde respuesta confiable del proveedor, verificando referencia, importe, moneda y firma. En demostración usar `es_simulado=1` y etiquetarlo en la interfaz.

El stock se descuenta al crear pedido; si un pago falla o vence, el backend deberá cancelar y devolver stock exactamente una vez dentro de otra transacción. Bloquear pedido y verificar su estado antes de restituirlo. Las transiciones, el historial y el estado actual deben actualizarse juntos; no están automatizados mediante triggers. Los callbacks duplicados no deben duplicar cambios. Un comprador no puede avanzar estados desde la interfaz pública.

Flujo normal: recibido → pago_confirmado → preparando → en_camino → entregado. Cancelación antes del despacho; devolución/reembolso posterior necesita definir su flujo antes de habilitarlo. No afirmar que un pedido está pagado por el mero hecho de existir. Un pedido solo se consulta por una sesión propietaria o una cuenta autorizada, nunca únicamente con su número y correo.

## Comprobaciones

Verificado el 2026-11-02 en una instancia temporal aislada de **MariaDB 12.1.2**: creación de las 17 tablas y la vista, carga de 30 productos (10 por categoría), 120 variantes y 1800 unidades. `04_probar_restricciones.sql` pasó el flujo de inserción de cliente/sesión/carrito/pedido/historial, cálculo de totales y nueve rechazos esperados. Los datos de prueba se revirtieron. No se ejecutó contra MySQL ni se modificaron bases existentes del usuario. El archivo 04 es opcional, solo para una base de prueba, y requiere permiso para crear rutinas.

`03_verificar.sql` permite revisar conteos y diferencias entre subtotal y detalle. Las restricciones estructurales deben probarse también con cantidades 0/11, stock negativo, correo duplicado, variante inexistente y duplicado de intento de compra. Las pruebas de concurrencia de compra, doble envío, pago y UX corresponderán a la integración MVC.

Los modelos y controladores ya están implementados en `src/` y las vistas conectadas están en `public/`. Consulta el README de la raíz para ejecutar ELIVE. Los datos de catálogo, carrito, favoritos y pedidos proceden de la API; el pago se registra expresamente como simulado, sin cobro real.
