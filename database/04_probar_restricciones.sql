-- SOLO en una base de prueba recién importada. DML revertido al terminar.
USE elive_ecommerce_mvc;
DELIMITER //
CREATE PROCEDURE probar_restricciones_elive()
BEGIN
 DECLARE rechazos INT DEFAULT 0;
 DECLARE prueba_cliente BIGINT UNSIGNED;
 DECLARE prueba_sesion BIGINT UNSIGNED;
 DECLARE prueba_carrito BIGINT UNSIGNED;
 DECLARE prueba_pedido BIGINT UNSIGNED;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 START TRANSACTION;
 INSERT INTO clientes(nombre,email,password_hash) VALUES ('Prueba','prueba@example.invalid',REPEAT('x',60));
 SET prueba_cliente=LAST_INSERT_ID();
 INSERT INTO sesiones(cliente_id,token_hash,expira_en)
 VALUES(prueba_cliente,UNHEX(SHA2(UUID(),256)),DATE_ADD(NOW(),INTERVAL 1 DAY));
 SET prueba_sesion=LAST_INSERT_ID();
 INSERT INTO carritos(sesion_id) VALUES(prueba_sesion);
 SET prueba_carrito=LAST_INSERT_ID();
 INSERT INTO carrito_items VALUES(prueba_carrito,1,1);
 INSERT INTO favoritos(sesion_id,producto_id) VALUES(prueba_sesion,1);
 INSERT INTO pedidos(numero,sesion_id,cliente_id,clave_idempotencia,nombre,apellido,email,telefono,direccion,subtotal,envio)
 VALUES('EL-PRUEBA',prueba_sesion,prueba_cliente,'intento-prueba-0001','Ana','Perez','prueba@example.invalid','0991234567','Calle Uno 123, Quito',12.90,0);
 SET prueba_pedido=LAST_INSERT_ID();
 INSERT INTO pedido_items(pedido_id,variante_id,nombre_producto,sku,talla,cantidad,precio_unitario)
 VALUES(prueba_pedido,1,'Producto de prueba','SKU-PRUEBA','4',1,12.90);
 INSERT INTO historial_pedido(pedido_id,estado_codigo) VALUES(prueba_pedido,'recibido');
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  UPDATE carrito_items SET cantidad=0 WHERE carrito_id=prueba_carrito;
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  UPDATE carrito_items SET cantidad=11 WHERE carrito_id=prueba_carrito;
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  UPDATE variantes_producto SET stock=-1 WHERE id=1;
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  INSERT INTO clientes(nombre,email,password_hash) VALUES('Duplicado','prueba@example.invalid',REPEAT('x',60));
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  INSERT INTO carrito_items VALUES(prueba_carrito,999999999,1);
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  INSERT INTO carrito_items VALUES(prueba_carrito,1,1);
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  INSERT INTO favoritos(sesion_id,producto_id) VALUES(prueba_sesion,1);
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  INSERT INTO pedidos(numero,sesion_id,clave_idempotencia,nombre,apellido,email,telefono,direccion,subtotal,envio)
  VALUES('EL-PRUEBA-2',prueba_sesion,'intento-prueba-0001','Ana','Perez','prueba@example.invalid','0991234567','Calle Uno 123, Quito',12.90,0);
 END;
 BEGIN DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET rechazos=rechazos+1;
  UPDATE productos SET precio_anterior=precio WHERE id=1;
 END;
 IF rechazos <> 9 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fallo: se esperaban 9 restricciones rechazadas';
 END IF;
 IF (SELECT total FROM pedidos WHERE id=prueba_pedido) <> 12.90
 OR (SELECT subtotal FROM pedido_items WHERE pedido_id=prueba_pedido) <> 12.90 THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fallo: totales incorrectos';
 END IF;
 ROLLBACK;
 SELECT 'OK: flujo básico, totales y 9 restricciones; datos de prueba revertidos' AS resultado;
END//
DELIMITER ;
CALL probar_restricciones_elive();
DROP PROCEDURE probar_restricciones_elive;
