export { default } from "next-auth/middleware";

export const config = {
  // Protect everything except the api routes, next static files, and images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
