# src/assets

Bundled assets imported via ES modules (`import img from "@/assets/foo.png"`).

Use this folder for small, code-referenced assets that benefit from Vite's
fingerprinting and bundling. Large binary assets (GLTF models, HDR
environments, audio) live under `public/` so they can be streamed at
runtime without going through the JS graph.
