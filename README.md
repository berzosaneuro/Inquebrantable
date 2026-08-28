# INQUEBRANTABLE

> Tu espacio de reconstrucción emocional.

PWA de una sola página dedicada al acompañamiento emocional de mujeres.
App estática (HTML + CSS + JS en un único `index.html`), sin backend: todo el
estado se guarda en `localStorage` del navegador.

## Secciones

Inicio · Historia · Test · Niveles · Refugio · Ritual · Cuenta · SOS · Progreso · Terapia

## Desarrollo

Es un sitio estático. Para verlo en local basta con abrir `index.html` en el
navegador o servirlo:

```bash
npx serve .
```

## Despliegue

Vercel detecta el proyecto como estático automáticamente y sirve `index.html`.
No necesita configuración ni build.

## Nota sobre la valoración de "Terapia"

El módulo de Terapia intenta llamar a `https://api.anthropic.com/v1/messages`
desde el cliente; esa llamada falla siempre (falta la clave y CORS) y la app
recurre a un motor de valoración offline incluido en el propio `index.html`.
Para activar la valoración con IA de verdad hay que añadir una función
serverless (`/api/valoracion`) con la clave en una variable de entorno.

## Origen

Código original creado por Adriana Puertas (marzo 2026). Recuperado y
consolidado en este repositorio.
