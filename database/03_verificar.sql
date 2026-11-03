USE elive_ecommerce_mvc;
SELECT VERSION() AS version_motor;
-- Esperado al importar: tres filas, cada una con 10 productos.
SELECT c.nombre,COUNT(p.id) AS productos
FROM categorias c LEFT JOIN productos p ON p.categoria_id=c.id
GROUP BY c.id,c.nombre ORDER BY c.id;
-- Esperado: 30 productos, 120 variantes, 1800 unidades.
SELECT (SELECT COUNT(*) FROM productos) AS productos,
 COUNT(*) AS variantes,SUM(stock) AS unidades FROM variantes_producto;
-- Esperado: cero filas (productos sin tallas).
SELECT p.id,p.nombre FROM productos p
LEFT JOIN variantes_producto v ON v.producto_id=p.id
GROUP BY p.id,p.nombre HAVING COUNT(v.id)=0;
-- Catálogo que consultará el modelo MVC.
SELECT * FROM vista_catalogo ORDER BY categoria,id;
-- Esperado: cero filas cuando el backend cree pedidos correctamente.
SELECT p.id,p.subtotal,COALESCE(SUM(d.subtotal),0) AS suma_detalle
FROM pedidos p LEFT JOIN pedido_items d ON d.pedido_id=p.id
GROUP BY p.id,p.subtotal HAVING p.subtotal <> COALESCE(SUM(d.subtotal),0);
