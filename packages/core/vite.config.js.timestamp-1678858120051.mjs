// vite.config.js
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdmljZW50ZWx5cmlvL1Byb2plY3RzL3BlcnNvbmFsL0BuZXRoZXJpdGUvcGFja2FnZXMvY29yZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3ZpY2VudGVseXJpby9Qcm9qZWN0cy9wZXJzb25hbC9AbmV0aGVyaXRlL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3ZpY2VudGVseXJpby9Qcm9qZWN0cy9wZXJzb25hbC9AbmV0aGVyaXRlL3BhY2thZ2VzL2NvcmUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IHRzQ29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW1xuICAgICAgICByZWFjdCgpLFxuICAgICAgICB0c0NvbmZpZ1BhdGhzKCksXG4gICAgICAgIGR0cyh7IGluY2x1ZGU6IFsnc3JjL0FwcC50c3gnXSB9KSxcbiAgICBdLFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIGxpYjoge1xuICAgICAgICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL0FwcC50c3gnKSxcbiAgICAgICAgICAgIG5hbWU6ICdAbmV0aGVyaXRlL2NvcmUnLFxuICAgICAgICAgICAgZmlsZU5hbWU6ICdBcHAnXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICAgICAgICAgJ0BhcG9sbG8vY2xpZW50JyxcbiAgICAgICAgICAgICAgICAnZ3JhcGhxbCcsXG4gICAgICAgICAgICAgICAgJ3JlYWN0JyxcbiAgICAgICAgICAgICAgICAncmVhY3QtZG9tJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBleHBvcnRzOiAnbmFtZWQnLFxuICAgICAgICAgICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Q6ICdSZWFjdCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFcsU0FBUyxlQUFlO0FBQ3BZLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLG1CQUFtQjtBQUMxQixPQUFPLFNBQVM7QUFKaEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUFBLEVBQ3BDO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxLQUFLO0FBQUEsTUFDRCxPQUFPLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQ3ZDLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxJQUNkO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDWCxVQUFVO0FBQUEsUUFDTjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0o7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNKLFNBQVM7QUFBQSxRQUNULFNBQVM7QUFBQSxVQUNMLE9BQU87QUFBQSxRQUNYO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
