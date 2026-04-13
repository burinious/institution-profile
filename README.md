# BOUESTI Staff Directory

Small Express-based staff directory for BOUESTI with:

- Admin-created staff accounts only
- Minimal admin onboarding with name, institutional email, and default password
- Bulk CSV upload with downloadable template
- Staff login for completing profile details
- Root page redirects to staff login
- Public profile URLs at `/prs/:slug`
- Public listing page at `/prs/staff`
- Research links for Scopus, ORCID, Google Scholar, email, and Google Drive CV
- Profile image upload for staff photos via Cloudinary

## Run

```bash
npm install
npm start
```

To use image uploads, create a local `.env` file from [`.env.example`](./.env.example) and set:

```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Default local URL:

```text
http://localhost:3000
```

## Default Admin Login

The first app boot seeds an admin account from environment variables.

- Email: `admin@bouesti.edu.ng`
- Password: `Admin@12345`

Override them with `.env` values based on [`.env.example`](./.env.example).

## Main Routes

- `/` staff login
- `/prs/staff` public profile listing
- `/prs/:slug` public staff profile page
- `/login` sign-in page
- `/admin` admin dashboard
- `/dashboard` staff profile dashboard

## Bulk Upload Format

Download the template from:

```text
/admin/staff/template.csv
```

CSV headers must be exactly:

```text
fullName,email,password
```

## Profile Fields

- Full name
- Honourary / designation
- Title
- College
- School / Faculty
- Department
- Public email
- Phone
- Office address
- Biography
- Qualifications
- Research areas
- Scopus URL
- ORCID URL
- Google Scholar URL
- Google Drive CV link
- Profile image
