// Everything Eyup may need to change without touching templates.
// A `null` value renders a visible placeholder and makes `pnpm build` print a warning.

export const site = {
  origin: 'https://healthypaw.app',

  // Store links. While null, the site shows "Coming soon" buttons instead of store badges.
  appStoreUrl: null, // e.g. 'https://apps.apple.com/app/idXXXXXXXXXX'
  playStoreUrl: null, // e.g. 'https://play.google.com/store/apps/details?id=app.healthypaw'

  // Apple Team ID (10 characters, developer.apple.com > Membership). Needed for invite links to open the app:
  // build writes /.well-known/apple-app-site-association for app.healthypaw only when this is set.
  appleTeamId: 'AWK24SQ9QZ',
  iosBundleId: 'app.healthypaw',

  // Inboxes (Cloudflare Email Routing forwards them, see docs/architecture/mvp/platform-services.md §9).
  supportEmail: 'support@healthypaw.app',
  privacyEmail: 'privacy@healthypaw.app',

  // Who runs HealthyPaw, for the privacy notice and terms (GDPR Art. 13 "identity of the controller").
  // TODO(Eyup): legal name, e.g. a company "HealthyPaw sp. z o.o." or a person's name.
  operatorName: 'Eyup Barlas',
  // TODO(Eyup): postal address for legal notices (street, postcode, city, country).
  operatorAddress: 'Marcina Kasprzaka 29C/381, 01-234 Warszawa, Polska',

  // Shown on the privacy notice and terms.
  legalUpdated: { en: '28 November 2026', pl: '28 listopada 2026' },
};
