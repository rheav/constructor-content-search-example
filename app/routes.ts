import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("blog/:slug", "routes/article.tsx"),
  route("blog/tag/:tag", "routes/tag.tsx"),
] satisfies RouteConfig;
