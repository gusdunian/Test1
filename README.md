# Angus' Hello World App

Minimal static site for validating GitHub Pages deployments end-to-end using GitHub Actions (no build tools).

## Files
- `index.html`
- `style.css`
- `script.js`
- `.nojekyll`
- `.github/workflows/pages.yml`

## Enable GitHub Pages for this repository
1. Open this repository on GitHub.
2. Go to **Settings** → **Pages**.
3. In **Build and deployment** → **Source**, select **GitHub Actions**.
4. Push to `main` (or manually run the workflow) and wait for the **Deploy static site to GitHub Pages** workflow to complete.

## Expected URL
Project Pages URL format:

`https://<user>.github.io/<repo>/`

Example:

`https://octocat.github.io/Test1/`

## How to confirm deployment succeeded
1. Open the Actions tab and verify the workflow run is green.
2. Visit your project Pages URL.
3. Confirm the page shows:
   - Banner title: **Angus' Hello World App**
   - `Loaded at: ...` with local time
   - `URL: ...` showing the current page URL
   - A **Run JS check** button where each click increments `JS OK: <n>`

## Local manual check
Open `index.html` in a browser and verify the same checks above.


## Supabase backend (MVP)
- Adds email magic-link sign-in and a compact Cloud panel for authenticated sync controls.
- Adds manual **Push**/**Pull** sync of dashboard state to/from Supabase (`dashboard_state` table) using browser-safe auth.
- Supabase config lives in `script.js` (`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`).
- In Supabase Auth settings, add this redirect URL allowlist entry: `https://gusdunian.github.io/Test1/`.

