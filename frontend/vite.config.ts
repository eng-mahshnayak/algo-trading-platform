
// ==================================
//  ye runinf code dode 23 jan 2025 
// ==================================

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import svgr from "vite-plugin-svgr";

// export default defineConfig({
//   plugins: [
//     react(),
//     svgr({
//       svgrOptions: {
//         icon: true,
//         exportType: "named",
//         namedExport: "ReactComponent",
//       },
//     }),
//   ],
//   server: {
//     host: "0.0.0.0",
//     port: 5173,

//     allowedHosts: [
//       "pleadingly-misshapen-wilber.ngrok-free.dev", // ✅ correct — NO trailing slash
//       ".ngrok-free.dev", // optional wildcard for future URLs
//     ],

//     hmr: {
//       host: "pleadingly-misshapen-wilber.ngrok-free.dev",
//       protocol: "wss",
//       clientPort: 443,
//     },
//   },
// });




import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,

    allowedHosts: ["192.168.1.6", "localhost"],

    hmr: {
      host: "192.168.1.6",
    },
  },
});
