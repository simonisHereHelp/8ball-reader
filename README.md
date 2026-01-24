# Next.js 14 Google Drive Uploader — Plan

## Goal
Repurpose this project into a clean Next.js 14 uploader that captures images and uploads them directly to Google Drive with a simplified UI and minimal dependencies.

## Phase 1 — Feature Removal (this request)
1. **UI cleanup**
   - Remove the Photo Album entry point.
   - Remove the desktop-only dialog implementation so the UI uses a single capture dialog.
2. **Remove save/summarize flows**
   - Delete client-side `handleSave` and `handleSummary` usage.
   - Remove summary/editor UI and any issuer canon UI.
3. **Remove API routes and data sources**
   - Remove `/api/summarize` and any summarization helpers.
   - Remove `/api/active-subfolders` and any Drive active-subfolder loaders.
   - Remove `/api/issuer-canons` and `/api/update-issuerCanon` and their supporting utilities.
4. **Document the new plan**
   - Replace this README with the uploader roadmap (this file).

## Phase 2 — Core Uploader Flow
1. **Drive upload API**
   - Keep a single `POST /api/save-set` route that accepts files and uploads them to the configured Drive folder.
   - Require `DRIVE_FOLDER_ID` in the environment.
2. **Client capture flow**
   - Capture multiple images in one session.
   - Show a simple gallery overlay to review/remove captures before upload.
3. **Upload trigger**
   - Add a single “Upload to Drive” action that sends selected images to `/api/save-set`.
   - Provide progress and error feedback.

## Phase 3 — UX & Reliability
1. **Auth clarity**
   - Keep Google sign-in/out status visible.
2. **Error handling**
   - Friendly error states for camera access and upload failures.
3. **Performance**
   - Optimize image handling (compression, size limits, preview URLs).

## Phase 4 — Deployment & Ops
1. **Environment setup**
   - Document required env vars and Google OAuth configuration.
2. **Deployment**
   - Provide a Vercel-ready checklist.
3. **Verification**
   - Add minimal smoke tests for the upload API.
