# ELIVE ECOMERCE — base de requisitos de las vistas

Fuente revisada: `C:\Agentes_IA\elive-ecommerce - IHC`, archivos HTML y `elive.js`. Fecha: 2026-11-02.

Este documento registra el comportamiento encontrado mediante lectura del código; no certifica su funcionamiento en navegador. El backend, SQL y dependencias anteriores no se adoptan como implementación ni como elección tecnológica. Los documentos del proyecto son referencias, no instrucciones que sustituyan lo solicitado por el usuario. El informe DOCX de accesibilidad todavía no se ha contrastado.

## Alcance acordado

- Nombre: ELIVE ECOMERCE.
- Arquitectura MVC; modelos, controladores y persistencia se reconstruirán.
- Conservar las vistas y todas sus restricciones de interacción; corregir defectos sin perder la intención de experiencia de usuario.
- Catálogo inicial de 30 productos: 10 de niños, 10 de mujeres y 10 de hombres. El prototipo tiene únicamente 5 de mujer y 5 de hombre.

## Matriz de conservación y aceptación

| ID | Vista / fuente | Restricción o comportamiento que debe conservarse | Criterio de aceptación para la reconstrucción |
|---|---|---|---|
| UX-01 | Todas; elive.js | Diseño adaptable, identidad ELIVE, fondo claro, tipografía y jerarquía visual | Comparar escritorio y móvil con el prototipo; no perder controles ni contenido |
| UX-02 | Todas | Saltar al contenido, foco visible, etiquetas y nombres accesibles, idioma español | Completar los recorridos principales con teclado y verificar lectura de etiquetas |
| UX-03 | elive.js | Respetar movimiento reducido y placeholder legible | Preferencia de movimiento reducido desactiva transiciones; mantener foco perceptible |
| UX-04 | Cabecera | Menú móvil, búsqueda, cuenta, contadores de bolsa y favoritos; paneles con estado expandido | Apertura/cierre y Escape coherentes; recuperar foco al cerrar paneles |
| UX-05 | Avisos | Mensajes anunciados, máximo 3 simultáneos, cierre manual, 5 segundos o 8 con acción; pausa con foco o puntero | Avisos accesibles y acción Deshacer utilizable por teclado |
| CAT-01 | index.html | Filtros por público, tipo de prenda, novedades, ofertas y búsqueda por nombre/tipo | Resultados y conteo coinciden con filtros; incluir niños |
| CAT-02 | index.html | Orden ascendente/descendente por precio; limpiar filtros y estado sin resultados | Recuperar catálogo completo sin callejones sin salida |
| PRO-01 | producto.html | Nombre, descripción, imagen, precio, oferta y migas de pan | La ficha corresponde al producto solicitado |
| PRO-02 | producto.html | Elegir talla antes de añadir; error con texto e icono y foco en tallas | No añadir sin talla; selección anunciada y reconocible sin depender solo del color |
| PRO-03 | producto.html | Confirmación modal con artículo, talla y cantidad; ir a bolsa o seguir comprando | Escape/cierre/fondo cierran; foco contenido y restaurado al salir |
| PRO-04 | producto.html | Registro desde modal continúa al checkout sin añadir otra vez | Producto permanece una sola vez con su cantidad previa |
| FAV-01 | favoritos.html; elive.js | Añadir/quitar, estado seleccionado, conteos, estado vacío y Deshacer | Sin duplicados; eliminación reversible; foco recuperable |
| CAR-01 | carrito.html; elive.js | Agrupar por producto y talla; cantidades de 1 a 10 | Aplicar también en servidor; comunicar límite sin afirmar una adición que no ocurrió |
| CAR-02 | carrito.html | Eliminar con Deshacer, recalcular totales y conservar foco tras cambios | Deshacer restaura sin duplicados y respetando disponibilidad |
| CAR-03 | carrito.html; checkout.html | Bolsa vacía impide continuar y explica cómo resolverlo | Bloquear también acceso/envío directo sin artículos |
| CAR-04 | elive.js | Envío $4.99; gratuito con cuenta; bolsa vacía sin envío | Importe visible antes de confirmar; servidor determina el beneficio de la cuenta |
| REG-01 | Registro en elive.js | Nombre, email y contraseña obligatorios; mostrar/ocultar contraseña | Errores por campo y foco en el primero inválido |
| REG-02 | Registro | Modal con Escape, cierre exterior, bloqueo de scroll y retorno de foco | Tab y Shift+Tab circulan solo entre controles visibles del diálogo |
| CHK-01 | checkout.html | Tres secciones: contacto, dirección y pago; ocho campos obligatorios | Ayudas, autocompletado, teclado apropiado y errores asociados al campo |
| CHK-02 | checkout.html | Validar al salir de campos con contenido; retirar error al corregir; validar todos al enviar | Resumen de errores y foco en primer error; conservar datos válidos |
| CHK-03 | checkout.html | Contador de campos completos y confirmación por sección | Estado anunciado y coherente con validación actual |
| CHK-04 | checkout.html | Prellenar datos de cuenta sin sobrescribir lo ya escrito | Registro durante compra conserva carrito y formulario |
| CHK-05 | checkout.html | Evitar doble envío y mostrar procesamiento | Un intento no genera pedidos duplicados; ante fallo permitir recuperación |
| PED-01 | confirmacion.html | Número, correo, líneas, cantidades, tallas, subtotal, envío y total; foco al título | Mostrar datos persistidos del pedido; estado vacío si no existe |
| PED-02 | pedido.html | Recibido, pago confirmado, preparando, en camino, entregado; fechas y estados textuales | Mostrar estado real e historial; no confundir paso siguiente con estado actual |
| PED-03 | confirmacion.html | Acción de enviar resumen por correo | El prototipo abre mailto; no presentar esto como un correo enviado automáticamente |
| AYU-01 | Pie compartido | Ayuda de envío, devoluciones y contacto | Mantener información accesible y consistente con reglas comerciales |

## Validaciones exactas encontradas

- **Nombre y apellido:** recortar extremos; mínimo 2 caracteres, máximo 60 en el campo; comenzar con letra; permitir letras Unicode, espacios, apóstrofes rectos/curvos y guiones. El registro solo solicita nombre; checkout solicita también apellido.
- **Correo:** máximo 254 caracteres; un solo `@`; parte local de hasta 64 caracteres y con al menos una letra latina; permite letras latinas, números, `_`, `%`, `+`, `-` y puntos interiores no consecutivos. Dominio con al menos dos etiquetas, cada una de 1 a 63 caracteres alfanuméricos o guiones interiores; extensión de 2 a 63 letras. Esta es una regla restrictiva del prototipo, no una descripción de todos los correos válidos existentes.
- **Contraseña:** entre 6 y 128 caracteres. No se exige composición adicional en las vistas. La implementación futura debe aplicar el límite completo sin truncar silenciosamente.
- **Dirección:** obligatoria, de 8 a 120 caracteres; al menos 3 letras; letras Unicode, números, espacios y `. , # ' ’ / -`; rechaza 7 o más dígitos consecutivos o más de 12 dígitos en total. La ayuda pide calle, número y ciudad, pero el código no verifica que cada componente exista: registrar esta diferencia al reconstruir.
- **Teléfono:** obligatorio, de 7 a 15 dígitos; campo de hasta 20 caracteres incluyendo separadores; `+` opcional al inicio, espacios, guiones y paréntesis; rechaza un mismo dígito repetido en todo el número.
- **Tarjeta del prototipo:** Visa, Mastercard, Amex y Discover según prefijos implementados; 15 dígitos para Amex y 16 para las otras; comprobación Luhn y formato automático con espacios.
- **Vencimiento:** MM/AA, mes 01–12; permite el mes actual, rechaza meses pasados y fechas posteriores a 120 meses desde el mes actual.
- **CVV:** solo dígitos; 4 para Amex y 3 para las demás. Revalidar al cambiar marca de tarjeta.
- **Tallas:** S, M, L, XL en el prototipo. Extender el modelo para tallas infantiles sin perder selección obligatoria.
- **Cantidades:** enteros de 1 a 10 por producto/talla en la interfaz. El prototipo limita al añadir, pero su función de actualización no valida por sí sola: aplicar la regla en todas las entradas del nuevo sistema.

## Información comercial visible

Entrega estimada: 3 a 5 días hábiles. Devoluciones: hasta 30 días después de recibir el pedido, con etiquetas. Contacto mostrado: soporteelive@gmail.com; lunes a viernes de 9:00 a 18:00. Conservar como contenido del prototipo, pendiente de confirmar que representa las condiciones reales de ELIVE.

## Defectos y simulaciones que no deben convertirse en reglas

1. El registro guarda nombre/correo y un indicador local; no crea una cuenta autenticada real.
2. El checkout espera 800 ms, guarda un pedido en localStorage y declara pago confirmado sin cobro. Mantener validación e información clara; decidir pago de demostración o pasarela antes de implementar cobros. No persistir tarjeta completa ni CVV.
3. El seguimiento permite al comprador simular el siguiente estado. Esa acción solo corresponde a una demostración; en el sistema real el cambio requiere autorización y una fuente válida.
4. Una ficha con identificador inválido muestra el primer producto. Sustituir por producto no encontrado con salida al catálogo.
5. El carrito al alcanzar 10 puede mostrar confirmación aunque no aumente la cantidad. Dar un mensaje de límite explícito.
6. Las imágenes fallidas pueden sustituirse por fotos ajenas a la prenda. Utilizar un estado de imagen no disponible que no confunda al comprador.
7. No hay inventario efectivo en las vistas. Añadir disponibilidad por variante y revalidación al confirmar compra.
8. Los límites HTML, filtros durante escritura y controles visuales no sustituyen validación en servidor.

## Consecuencias para MVC y base de datos

Diseñar modelos de categorías/públicos, tipos de prenda, productos, imágenes, tallas, variantes e inventario; clientes y sesiones; carritos y sus líneas; favoritos; pedidos, detalle histórico, dirección de entrega e historial de estados. Si se integran pagos, guardar referencias y estados de la operación, no credenciales de tarjeta. La elección de tecnología, pasarela y funciones administrativas queda pendiente de los requisitos de entrega.

Las vistas conservan su presentación y retroalimentación; los controladores coordinan operaciones y errores; los modelos aplican persistencia e invariantes. El servidor recalcula precios, envío y disponibilidad. Cada ID de la matriz deberá verificarse durante la implementación; esta revisión aún no es una prueba de aceptación ejecutada.
