-- Migración aditiva: conserva favoritos anteriores y recupera los de sesiones con cuenta.
CREATE TABLE IF NOT EXISTS favoritos_cuenta (
 cliente_id BIGINT UNSIGNED NOT NULL,
 producto_id BIGINT UNSIGNED NOT NULL,
 creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (cliente_id,producto_id),
 CONSTRAINT fk_fav_cuenta_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
 CONSTRAINT fk_fav_cuenta_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;
INSERT IGNORE INTO favoritos_cuenta(cliente_id,producto_id,creado_en)
SELECT s.cliente_id,f.producto_id,f.creado_en
FROM favoritos f JOIN sesiones s ON s.id=f.sesion_id WHERE s.cliente_id IS NOT NULL;
