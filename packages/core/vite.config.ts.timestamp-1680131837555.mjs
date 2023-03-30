// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "file:///Users/vicentelyrio/Projects/personal/@netherite/node_modules/vite/dist/node/index.js";
import react from "file:///Users/vicentelyrio/Projects/personal/@netherite/node_modules/@vitejs/plugin-react-swc/index.mjs";
import tsConfigPaths from "file:///Users/vicentelyrio/Projects/personal/@netherite/node_modules/vite-tsconfig-paths/dist/index.mjs";
import dts from "file:///Users/vicentelyrio/Projects/personal/@netherite/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/vicentelyrio/Projects/personal/@netherite/packages/core";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({ include: ["src/App.tsx"] })
  ],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/App.tsx"),
      name: "@netherite/core",
      fileName: "App"
    },
    rollupOptions: {
      external: [
        "@apollo/client",
        "@netherite/ds-components",
        "graphql",
        "react",
        "react-dom"
      ],
      output: {
        exports: "named",
        globals: {
          react: "React"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdmljZW50ZWx5cmlvL1Byb2plY3RzL3BlcnNvbmFsL0BuZXRoZXJpdGUvcGFja2FnZXMvY29yZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3ZpY2VudGVseXJpby9Qcm9qZWN0cy9wZXJzb25hbC9AbmV0aGVyaXRlL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3ZpY2VudGVseXJpby9Qcm9qZWN0cy9wZXJzb25hbC9AbmV0aGVyaXRlL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJ1xuaW1wb3J0IHRzQ29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocydcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0c0NvbmZpZ1BhdGhzKCksXG4gICAgZHRzKHsgaW5jbHVkZTogWydzcmMvQXBwLnRzeCddIH0pLFxuICBdLFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL0FwcC50c3gnKSxcbiAgICAgIG5hbWU6ICdAbmV0aGVyaXRlL2NvcmUnLFxuICAgICAgZmlsZU5hbWU6ICdBcHAnLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFtcbiAgICAgICAgJ0BhcG9sbG8vY2xpZW50JyxcbiAgICAgICAgJ0BuZXRoZXJpdGUvZHMtY29tcG9uZW50cycsXG4gICAgICAgICdncmFwaHFsJyxcbiAgICAgICAgJ3JlYWN0JyxcbiAgICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICBdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGV4cG9ydHM6ICduYW1lZCcsXG4gICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICByZWFjdDogJ1JlYWN0JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRXLFNBQVMsZUFBZTtBQUNwWSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxTQUFTO0FBSmhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLElBQUksRUFBRSxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7QUFBQSxFQUNsQztBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLGFBQWE7QUFBQSxNQUN2QyxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsSUFDWjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFFBQ1QsU0FBUztBQUFBLFVBQ1AsT0FBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
