# Contact page

The Contact page provides direct email and social links only. It keeps the forest-green, mint, and ivory palette with Inter typography, accessible focus states, GSAP entrances, and Anime.js arrow feedback.

## Available actions

- “Send me an email” and “Write an email” open the visitor’s email application using the profile email address.
- The email address can also be copied, with success or failure feedback.
- Every valid published social profile is shown with its correct React Icons brand icon. Other saved destinations use a link icon.
- Links open their saved destinations in a new tab. Duplicates, unsafe URLs, unpublished records, and unverified platform-homepage placeholders are omitted.

## Form removal

The form component, contact API endpoint, delivery transport, key resolver, form schema, delivery tests, and related styling were removed. The page makes no submission requests and requires no email-service configuration. Existing private environment values were left untouched.

## Contact data

The profile and published social records remain the source of truth. Legacy GitHub and LinkedIn homepage placeholders resolve to owner URLs already used elsewhere in the portfolio. The Instagram seed is only a platform homepage, so no personal Instagram URL is invented. Adding a valid profile URL in the existing social-link settings makes it appear automatically.

## Main files

- `app/contact/page.tsx`
- `app/contact/contact.css`
- `components/contact/contact-channels.tsx`
- `components/contact/contact-motion.tsx`
- `lib/contact-links.ts`
- `scripts/contact-links.test.ts`

No dependencies or unrelated pages were changed.
