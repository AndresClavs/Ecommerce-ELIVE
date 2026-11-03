-- Ejecutar UNA VEZ después de 01_esquema.sql sobre la base nueva.
-- Catálogo de demostración persistido. Precios/stock editables, no mercancía verificada.
USE elive_ecommerce_mvc;
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO categorias (id,nombre,slug) VALUES
(1,'Niños','ninos'),(2,'Mujeres','mujeres'),(3,'Hombres','hombres');
INSERT INTO tipos_prenda (id,nombre) VALUES
(1,'Camisetas'),(2,'Camisas'),(3,'Pantalones'),(4,'Jeans'),(5,'Vestidos'),
(6,'Blusas'),(7,'Suéteres'),(8,'Chaquetas'),(9,'Faldas'),(10,'Pijamas');
INSERT INTO tallas (id,codigo,descripcion,orden) VALUES
(1,'S','Adultos: pequeña',1),(2,'M','Adultos: mediana',2),
(3,'L','Adultos: grande',3),(4,'XL','Adultos: extragrande',4),
(5,'4','Infantil: talla 4',5),(6,'6','Infantil: talla 6',6),
(7,'8','Infantil: talla 8',7),(8,'10','Infantil: talla 10',8);
INSERT INTO configuracion_tienda (id) VALUES (1);
INSERT INTO estados_pedido (codigo,nombre,orden) VALUES
('recibido','Pedido recibido',1),('pago_confirmado','Pago confirmado',2),
('preparando','Preparando tu pedido',3),('en_camino','En camino',4),
('entregado','Entregado',5),('cancelado','Cancelado',6);

INSERT INTO productos (id,categoria_id,tipo_prenda_id,nombre,slug,descripcion,precio,precio_anterior,es_nuevo) VALUES
(1,1,1,'Camiseta infantil sol','camiseta-infantil-sol','Camiseta infantil de algodón con estampado de sol.',12.90,NULL,1),
(2,1,1,'Camiseta infantil rayas','camiseta-infantil-rayas','Camiseta de manga corta con rayas azules.',13.90,NULL,0),
(3,1,3,'Pantalón infantil jogger','pantalon-infantil-jogger','Pantalón cómodo con cintura elástica.',19.90,NULL,1),
(4,1,4,'Jean infantil azul','jean-infantil-azul','Jean azul infantil de corte recto.',24.90,29.90,0),
(5,1,5,'Vestido infantil flores','vestido-infantil-flores','Vestido ligero con estampado floral.',22.90,NULL,1),
(6,1,7,'Suéter infantil crema','sueter-infantil-crema','Suéter de punto para días frescos.',21.90,NULL,0),
(7,1,8,'Chaqueta infantil ligera','chaqueta-infantil-ligera','Chaqueta ligera con cierre frontal.',29.90,34.90,0),
(8,1,10,'Pijama infantil estrellas','pijama-infantil-estrellas','Conjunto de pijama con estampado de estrellas.',18.90,NULL,0),
(9,1,2,'Camisa infantil celeste','camisa-infantil-celeste','Camisa celeste de manga larga.',20.90,NULL,0),
(10,1,9,'Falda infantil denim','falda-infantil-denim','Falda denim con cintura ajustable.',17.90,NULL,1),
(11,2,5,'Vestido rojo ligero','vestido-rojo-ligero','Vestido fresco de corte cómodo.',42.90,NULL,1),
(12,2,6,'Blusa blanca de lino','blusa-blanca-lino','Blusa blanca fresca de diseño sencillo.',27.90,NULL,0),
(13,2,4,'Jean azul skinny','jean-azul-skinny','Jean azul de corte ajustado.',49.00,59.00,0),
(14,2,3,'Pantalón palo de rosa','pantalon-palo-rosa','Pantalón de corte cómodo en tono rosa.',29.90,NULL,1),
(15,2,7,'Suéter tejido crema','sueter-tejido-crema','Suéter suave de punto color crema.',39.90,49.90,0),
(16,2,1,'Camiseta mujer básica','camiseta-mujer-basica','Camiseta de algodón y cuello redondo.',16.90,NULL,0),
(17,2,8,'Chaqueta mujer denim','chaqueta-mujer-denim','Chaqueta denim con botones delanteros.',54.90,NULL,1),
(18,2,9,'Falda midi negra','falda-midi-negra','Falda negra de largo midi.',32.90,NULL,0),
(19,2,2,'Camisa mujer rayas','camisa-mujer-rayas','Camisa de manga larga a rayas.',34.90,NULL,0),
(20,2,10,'Pijama mujer algodón','pijama-mujer-algodon','Conjunto de pijama de algodón.',28.90,NULL,1),
(21,3,2,'Camisa Oxford blanca','camisa-oxford-blanca','Camisa de cuello clásico y botones.',34.50,NULL,1),
(22,3,1,'Camiseta básica blanca','camiseta-basica-blanca','Camiseta de algodón sin estampados.',14.90,NULL,0),
(23,3,8,'Chaqueta ligera café','chaqueta-ligera-cafe','Chaqueta casual para días frescos.',64.90,79.90,0),
(24,3,3,'Pantalón azul recto','pantalon-azul-recto','Pantalón azul de corte clásico.',44.90,NULL,1),
(25,3,1,'Camiseta negra estampada','camiseta-negra-estampada','Camiseta negra de cuello redondo.',32.00,NULL,0),
(26,3,4,'Jean hombre índigo','jean-hombre-indigo','Jean índigo de corte recto.',46.90,NULL,0),
(27,3,7,'Suéter hombre gris','sueter-hombre-gris','Suéter gris tejido de manga larga.',38.90,NULL,1),
(28,3,2,'Camisa hombre lino','camisa-hombre-lino','Camisa beige ligera de lino.',39.90,NULL,0),
(29,3,3,'Pantalón hombre beige','pantalon-hombre-beige','Pantalón beige de corte casual.',41.90,48.90,0),
(30,3,10,'Pijama hombre cuadros','pijama-hombre-cuadros','Conjunto de pijama a cuadros.',29.90,NULL,1);

-- Cuatro tallas por producto, 15 unidades iniciales por talla: 120 variantes.
INSERT INTO variantes_producto (producto_id,talla_id,sku,stock)
SELECT p.id,t.id,CONCAT('EL-',LPAD(p.id,3,'0'),'-',t.codigo),15
FROM productos p CROSS JOIN tallas t
WHERE (p.categoria_id=1 AND t.id BETWEEN 5 AND 8)
   OR (p.categoria_id IN (2,3) AND t.id BETWEEN 1 AND 4);

-- No se insertan rutas de fotos inexistentes. La vista debe mostrar
-- "Imagen no disponible" hasta registrar imágenes reales en imagenes_producto.
COMMIT;
