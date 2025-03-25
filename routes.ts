/**
 * This file contains all the routes that are public.
 * The routes are public because they are not protected by authentication.
 * The routes are also public because they are not protected by authorization.
 * @type {string[]}
 */

export const publicRoutes = [
  "/",
  "/auth/new-verification",
  "/api/cron/cleanup",
];

/**
 * This file contains all the routes that are used for authentication.
 * These routes will redirect logged in users to the protected routes.
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/reset",
  "/auth/error",
  "/auth/new-password",
];

/**
 * The prefix for all the routes that are used for authentication.
 * These routes will redirect logged out users to the login page.
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default login redirect path.
 * This is the path that will be redirected to after a successful login.
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
