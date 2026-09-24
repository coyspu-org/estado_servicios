# Estado de Servicios COYSPU

Panel público y estático, preparado para GitHub Pages. Consulta el estado de los servicios cada 60 segundos sin volver a publicar la página.

**Prototipo:** todos los estados, incidentes y fechas incluidos son ficticios. No hay conexión a una API real ni panel de administración. Consultar un JSON estático cada 60 segundos no actualiza por sí solo su contenido.

## Probarlo localmente

Desde la raíz del repositorio:

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`.

## Conectar la API real

En `app.js`, cambiar:

```js
endpoint: "./data/status.json",
```

por la URL pública del endpoint, por ejemplo:

```js

```

La URL anterior es un ejemplo: no se ha verificado ni conectado. El endpoint debe permitir solicitudes CORS desde el origen `https://coyspu.github.io` y devolver el formato incluido en `data/status.json`. No incluir credenciales ni información interna en el código o en la respuesta pública. Retirar el aviso de demostración de `index.html` únicamente después de verificar la API real.

## Publicar en GitHub Pages

Los archivos están en la raíz, listos para publicar desde la rama `main` y la carpeta raíz. La sincronización del código no configura ni confirma la publicación en Pages. La dirección prevista, una vez habilitada, es `https://coyspu.github.io/estado_servicios/`.
