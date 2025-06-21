import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req) => {
  // Check if the request is for a public route
  const isPublicRoute = [
    '/',
    '/login',
    '/login/sso-callback', // For Clerk SSO callback
    '/api/alive-check', // For alive check confirmation links
    '/sign-up',
  ].some(route => req.nextUrl.pathname.startsWith(route));

  // If not a public route, protect it
  if (!isPublicRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};