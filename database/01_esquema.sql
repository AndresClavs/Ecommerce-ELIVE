-- ELIVE ECOMERCE. Instalación NUEVA, no migración de la base anterior.
-- Objetivo: MySQL 8.0.16+ / MariaDB 10.6+. Ejecutar con modo estricto.
-- Si la base ya existe, DETENERSE: no borrar datos ni continuar sobre ella.
CREATE DATABASE elive_ecommerce_mvc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elive_ecommerce_mvc;
SET NAMES utf8mb4;
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE TABLE categorias (
 id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(40) NOT NULL,
 slug VARCHAR(40) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE tipos_prenda (
 id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE productos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 categoria_id SMALLINT UNSIGNED NOT NULL,
 tipo_prenda_id SMALLINT UNSIGNED NOT NULL,
 nombre VARCHAR(120) NOT NULL,
 slug VARCHAR(150) NOT NULL UNIQUE,
 descripcion TEXT NOT NULL,
 precio DECIMAL(10,2) NOT NULL,
 precio_anterior DECIMAL(10,2) NULL,
 es_nuevo BOOLEAN NOT NULL DEFAULT FALSE,
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
 CONSTRAINT fk_producto_tipo FOREIGN KEY (tipo_prenda_id) REFERENCES tipos_prenda(id),
 CONSTRAINT ck_producto_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 2),
 CONSTRAINT ck_producto_precio CHECK (precio > 0),
 CONSTRAINT ck_producto_oferta CHECK (precio_anterior IS NULL OR precio_anterior > precio),
 CONSTRAINT ck_producto_flags CHECK (es_nuevo IN (0,1) AND activo IN (0,1)),
 INDEX ix_producto_catalogo (categoria_id, activo, precio)
) ENGINE=InnoDB;

CREATE TABLE imagenes_producto (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 producto_id BIGINT UNSIGNED NOT NULL,
 ruta VARCHAR(500) NOT NULL,
 texto_alternativo VARCHAR(180) NOT NULL,
 orden SMALLINT UNSIGNED NOT NULL DEFAULT 1,
 UNIQUE KEY uq_imagen_orden (producto_id, orden),
 CONSTRAINT fk_imagen_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
 CONSTRAINT ck_imagen_orden CHECK (orden >= 1),
 CONSTRAINT ck_imagen_ruta CHECK (CHAR_LENGTH(TRIM(ruta)) > 0)
) ENGINE=InnoDB;

CREATE TABLE tallas (
 id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(12) NOT NULL UNIQUE,
 descripcion VARCHAR(80) NOT NULL,
 orden SMALLINT UNSIGNED NOT NULL
) ENGINE=InnoDB;

-- El stock corresponde a una talla concreta, no al producto completo.
CREATE TABLE variantes_producto (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 producto_id BIGINT UNSIGNED NOT NULL,
 talla_id SMALLINT UNSIGNED NOT NULL,
 sku VARCHAR(50) NOT NULL UNIQUE,
 stock INT NOT NULL DEFAULT 0,
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY uq_variante_producto_talla (producto_id, talla_id),
 CONSTRAINT fk_variante_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
 CONSTRAINT fk_variante_talla FOREIGN KEY (talla_id) REFERENCES tallas(id),
 CONSTRAINT ck_variante_stock CHECK (stock >= 0),
 CONSTRAINT ck_variante_activa CHECK (activo IN (0,1))
) ENGINE=InnoDB;

CREATE TABLE clientes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(60) NOT NULL,
 apellido VARCHAR(60) NULL,
 email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_cliente_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) BETWEEN 2 AND 60),
 CONSTRAINT ck_cliente_apellido CHECK (apellido IS NULL OR CHAR_LENGTH(TRIM(apellido)) BETWEEN 2 AND 60),
 CONSTRAINT ck_cliente_hash CHECK (CHAR_LENGTH(password_hash) >= 20),
 CONSTRAINT ck_cliente_activo CHECK (activo IN (0,1))
) ENGINE=InnoDB;

-- Una sesión anónima permite comprar y guardar favoritos sin registrarse.
-- Al autenticar, asociar cliente_id y rotar el token sin perder el carrito.
CREATE TABLE sesiones (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 cliente_id BIGINT UNSIGNED NULL,
 token_hash BINARY(32) NOT NULL UNIQUE,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expira_en DATETIME NOT NULL,
 revocado_en DATETIME NULL,
 CONSTRAINT fk_sesion_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
 CONSTRAINT ck_sesion_expiracion CHECK (expira_en > creado_en),
 INDEX ix_sesion_expiracion (expira_en)
) ENGINE=InnoDB;

CREATE TABLE carritos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 sesion_id BIGINT UNSIGNED NOT NULL UNIQUE,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_carrito_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones(id)
) ENGINE=InnoDB;

CREATE TABLE carrito_items (
 carrito_id BIGINT UNSIGNED NOT NULL,
 variante_id BIGINT UNSIGNED NOT NULL,
 cantidad TINYINT NOT NULL,
 PRIMARY KEY (carrito_id, variante_id),
 CONSTRAINT fk_item_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
 CONSTRAINT fk_item_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto(id),
 CONSTRAINT ck_carrito_cantidad CHECK (cantidad BETWEEN 1 AND 10)
) ENGINE=InnoDB;

CREATE TABLE favoritos (
 sesion_id BIGINT UNSIGNED NOT NULL,
 producto_id BIGINT UNSIGNED NOT NULL,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (sesion_id, producto_id),
 CONSTRAINT fk_favorito_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE,
 CONSTRAINT fk_favorito_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE configuracion_tienda (
 id TINYINT PRIMARY KEY,
 moneda CHAR(3) NOT NULL DEFAULT 'USD',
 costo_envio DECIMAL(10,2) NOT NULL DEFAULT 4.99,
 envio_gratis_con_cuenta BOOLEAN NOT NULL DEFAULT TRUE,
 entrega_min_dias TINYINT NOT NULL DEFAULT 3,
 entrega_max_dias TINYINT NOT NULL DEFAULT 5,
 plazo_devolucion_dias SMALLINT NOT NULL DEFAULT 30,
 CONSTRAINT ck_config_unica CHECK (id = 1),
 CONSTRAINT ck_config_importes CHECK (costo_envio >= 0 AND envio_gratis_con_cuenta IN (0,1)),
 CONSTRAINT ck_config_plazos CHECK (entrega_min_dias > 0 AND entrega_max_dias >= entrega_min_dias AND plazo_devolucion_dias > 0)
) ENGINE=InnoDB;

CREATE TABLE estados_pedido (
 codigo VARCHAR(24) PRIMARY KEY,
 nombre VARCHAR(60) NOT NULL,
 orden TINYINT UNSIGNED NOT NULL
) ENGINE=InnoDB;

-- Datos de entrega y precios se COPIAN al pedido para conservar su historia.
CREATE TABLE pedidos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 numero VARCHAR(40) NOT NULL UNIQUE,
 sesion_id BIGINT UNSIGNED NOT NULL,
 cliente_id BIGINT UNSIGNED NULL,
 clave_idempotencia VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 estado_codigo VARCHAR(24) NOT NULL DEFAULT 'recibido',
 nombre VARCHAR(60) NOT NULL,
 apellido VARCHAR(60) NOT NULL,
 email VARCHAR(254) NOT NULL,
 telefono VARCHAR(20) NOT NULL,
 direccion VARCHAR(120) NOT NULL,
 moneda CHAR(3) NOT NULL DEFAULT 'USD',
 subtotal DECIMAL(12,2) NOT NULL,
 envio DECIMAL(10,2) NOT NULL,
 total DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + envio) STORED,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_pedido_intento (sesion_id, clave_idempotencia),
 CONSTRAINT fk_pedido_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones(id),
 CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
 CONSTRAINT fk_pedido_estado FOREIGN KEY (estado_codigo) REFERENCES estados_pedido(codigo),
 CONSTRAINT ck_pedido_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) BETWEEN 2 AND 60 AND CHAR_LENGTH(TRIM(apellido)) BETWEEN 2 AND 60),
 CONSTRAINT ck_pedido_direccion CHECK (CHAR_LENGTH(TRIM(direccion)) BETWEEN 8 AND 120),
 CONSTRAINT ck_pedido_telefono CHECK (CHAR_LENGTH(TRIM(telefono)) BETWEEN 7 AND 20),
 CONSTRAINT ck_pedido_importes CHECK (subtotal > 0 AND envio >= 0),
 CONSTRAINT ck_pedido_clave CHECK (CHAR_LENGTH(clave_idempotencia) >= 16),
 INDEX ix_pedido_cliente_fecha (cliente_id, creado_en)
) ENGINE=InnoDB;

CREATE TABLE pedido_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL,
 variante_id BIGINT UNSIGNED NOT NULL,
 nombre_producto VARCHAR(120) NOT NULL,
 sku VARCHAR(50) NOT NULL,
 talla VARCHAR(12) NOT NULL,
 cantidad TINYINT NOT NULL,
 precio_unitario DECIMAL(10,2) NOT NULL,
 subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
 UNIQUE KEY uq_pedido_variante (pedido_id, variante_id),
 CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
 CONSTRAINT fk_detalle_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto(id),
 CONSTRAINT ck_detalle_cantidad CHECK (cantidad BETWEEN 1 AND 10),
 CONSTRAINT ck_detalle_precio CHECK (precio_unitario > 0)
) ENGINE=InnoDB;

CREATE TABLE historial_pedido (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL,
 estado_codigo VARCHAR(24) NOT NULL,
 nota VARCHAR(255) NULL,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
 CONSTRAINT fk_historial_estado FOREIGN KEY (estado_codigo) REFERENCES estados_pedido(codigo),
 INDEX ix_historial_pedido_fecha (pedido_id, creado_en)
) ENGINE=InnoDB;

-- Nunca guardar PAN completo, CVV ni fecha de tarjeta aquí.
CREATE TABLE pagos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL,
 proveedor VARCHAR(50) NOT NULL,
 referencia VARCHAR(190) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 estado ENUM('pendiente','aprobado','rechazado','reembolsado') NOT NULL DEFAULT 'pendiente',
 es_simulado BOOLEAN NOT NULL DEFAULT TRUE,
 importe DECIMAL(12,2) NOT NULL,
 moneda CHAR(3) NOT NULL DEFAULT 'USD',
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_pago_referencia (proveedor, referencia),
 CONSTRAINT fk_pago_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
 CONSTRAINT ck_pago_importe CHECK (importe > 0),
 CONSTRAINT ck_pago_simulado CHECK (es_simulado IN (0,1))
) ENGINE=InnoDB;

CREATE VIEW vista_catalogo AS
SELECT p.id, p.nombre, p.slug, p.descripcion, p.precio, p.precio_anterior,
 p.es_nuevo, c.slug AS categoria, tp.nombre AS tipo_prenda,
 (SELECT im.ruta FROM imagenes_producto im WHERE im.producto_id = p.id ORDER BY im.orden LIMIT 1) AS imagen,
 COALESCE((SELECT SUM(v.stock) FROM variantes_producto v WHERE v.producto_id = p.id AND v.activo = 1),0) AS stock_total
FROM productos p JOIN categorias c ON c.id = p.categoria_id
JOIN tipos_prenda tp ON tp.id = p.tipo_prenda_id
WHERE p.activo = 1;
