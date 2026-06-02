# Avora Social OAuth Setup

Use this guide only when deploying Avora with Supabase authentication. The default local demo does not require OAuth.

## Important URL distinction

Two callback URLs are involved:

| Purpose | URL |
| --- | --- |
| Browser redirect after Supabase completes sign-in | `https://your-web-domain.com/auth/callback` |
| Provider callback registered with Google Cloud or Microsoft Entra | `https://your-project.supabase.co/auth/v1/callback` |

Do not paste the browser redirect URL into the Google Cloud or Microsoft Entra provider callback field.

For the hosted Avora demo:

```text
Web origin: https://avora-main-web.vercel.app
Browser redirect: https://avora-main-web.vercel.app/auth/callback
Supabase provider callback: https://hquyyfqmdifhoevhdhlb.supabase.co/auth/v1/callback
```

## Supabase URL configuration

In Supabase Dashboard, open **Authentication > URL Configuration**:

1. Set **Site URL** to the deployed web origin.
2. Add the deployed browser callback to **Redirect URLs**.
3. Keep the local callback if local OAuth testing is needed.

```text
http://localhost:3000/auth/callback
https://avora-main-web.vercel.app/auth/callback
```

## Google

1. In Google Cloud Console, create an OAuth client with application type **Web application**.
2. Under **Authorized JavaScript origins**, add the web origin without a trailing slash:

   ```text
   https://avora-main-web.vercel.app
   ```

3. Under **Authorized redirect URIs**, add the Supabase provider callback:

   ```text
   https://hquyyfqmdifhoevhdhlb.supabase.co/auth/v1/callback
   ```

4. In Supabase Dashboard, open **Authentication > Sign In / Providers > Google**.
5. Enable Google and paste the Google **Client ID** and **Client Secret**.
6. Keep **Skip nonce checks** disabled unless a specific native-app integration requires it.
7. Save, then test from the deployed login page.

If Google Auth Platform is in testing mode, add each allowed Google account under **Audience > Test users**.

## Microsoft

1. In Microsoft Entra ID, open **App registrations > New registration**.
2. Add a **Web** redirect URI using the Supabase provider callback:

   ```text
   https://hquyyfqmdifhoevhdhlb.supabase.co/auth/v1/callback
   ```

3. Copy the **Application (client) ID**.
4. Under **Certificates & secrets**, create a client secret and copy its **Value**, not its Secret ID.
5. In Supabase Dashboard, open **Authentication > Sign In / Providers > Azure**.
6. Enable Azure, paste the client ID and secret value, and set the tenant URL:

   ```text
   https://login.microsoftonline.com/common
   ```

7. Save, then test from the deployed login page.

Use a more restrictive tenant URL when the Microsoft application should accept only personal accounts or only one organization.

## Vercel web environment

Configure these values in Vercel and redeploy the web app:

```env
VITE_API_URL=https://avora-main.onrender.com
VITE_SUPABASE_URL=https://hquyyfqmdifhoevhdhlb.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
VITE_ENABLE_OAUTH=true
VITE_DASHBOARD_DATA_MODE=hybrid
VITE_APP_NAME=Avora
```

Use only the public Supabase publishable or anon key in Vercel. Never expose the Supabase service-role key, Google client secret, or Microsoft client secret in frontend variables or GitHub.

## Verification

1. Open `https://avora-main-web.vercel.app/login`.
2. Test Google sign-in.
3. Sign out and test Microsoft sign-in.
4. Confirm both flows return to `/auth/callback` and then open the dashboard.

## References

- [Supabase: Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: Login with Azure (Microsoft)](https://supabase.com/docs/guides/auth/social-login/auth-azure)
- [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
