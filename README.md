# Feryel Fourati — Portfolio

A React portfolio built around a scroll-driven 3D walkthrough. Each chapter has its own Three.js scene, with a continuous light trail connecting the journey. The Grassia chapter features the perfume animation.

## Run locally

```sh
npm install
npm run dev
```

Vite serves the React app. If port `5173` is already in use, Vite selects the next available port and prints the URL in the terminal.

## Production build

```sh
npm run build
```

The build output is written to `dist/`.

## Stack

- React and Vite
- Three.js for the 3D scenes
- GSAP ScrollTrigger for scroll progress

The downloadable CV is in `public/assets/`.
