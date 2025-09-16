import { redirect } from '@sveltejs/kit';

export function load() {
  // Redirect root path to landing page
  throw redirect(307, '/landing-page');
}
