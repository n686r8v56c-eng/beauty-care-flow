# Beauty Care Flow — React / Vite / Supabase / Cloudflare Pages

## Included
- Login / signup / password recovery using Supabase Auth.
- Home KPI: separate face/hair completion rates and daily rating-entry rate.
- Management: Face and Hair checklist items (2-column), ratings (1-column sliders), editable checklist/rating definitions through long press or desktop right-click, body circumferences in cm.
- Hair photos separated by root / texture; body photos by waist / thigh / calf; face has **no photo upload**.
- Calendar photo/measurement/check view; same records feed analysis trend charts.
- Supabase per-user RLS and private object storage. Changes autosave.
- Responsive compact UI; browser-first mobile layout.

## Setup
1. Create a Supabase project, enable Email login (Authentication → Providers).
2. Supabase SQL Editor: run `supabase/schema.sql` **once**. It adds three tables and a private Storage bucket. It does not delete existing user records.
3. Copy `.env.example` to `.env`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable/anon key only, never service_role).
4. `npm install` then `npm run dev` to preview; `npm run build` to validate.
5. For Cloudflare Pages, connect GitHub repository, framework Vite, build command `npm run build`, output `dist`, and set the same two `VITE_` environment variables in Pages settings (Production and Preview as needed); trigger rebuild.
6. Set Supabase Authentication → URL Configuration Site URL to your Cloudflare URL and include production/preview callback URL(s) in Redirect URLs. Verify confirmation emails and recovery flow in production.

## Limits / decisions
- A hosted Supabase project and Cloudflare site have **not** been created or connected by this downloadable project. Set up credentials and deployment yourself.
- Ratings are 1–5, initial values are **unset**. Sliders default visually to 3 until first moved; only an explicit user move creates a record.
- A manually archived definition is hidden from active UI but historical daily JSON remains intact.
- For photo comparison, use date-specific photo calendar; direct side-by-side split-screen comparison is not yet included.
- Logged-in photos use temporary signed URLs and are uploaded to private Storage. Avoid sharing URLs publicly.
- Generated project is standalone; it does not modify or reset your existing apps or Supabase projects.


### Lower-body photo-only category
The Body section includes `하체 전체` as a **photo-only** category, without a cm field or numeric chart. New installations use the updated schema.sql. For an existing Supabase deployment, run the two `alter table` statements at the end of schema.sql (remove the leading SQL comment markers). Do not reinitialize or delete records.
