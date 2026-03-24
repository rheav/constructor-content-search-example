import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/constructor-content-search-example/",
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
