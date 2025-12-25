# GitHub Actions Workflows

This repository uses GitHub Actions for automated releases and code validation.

## Workflows

### 1. Release Workflow (`.github/workflows/release.yml`)

**Trigger:** Automatically runs when a new tag matching pattern `v*.*.*` is pushed to the repository.

**What it does:**
- Extracts version number from the tag (e.g., `v25.0.1` → `25.0.1`)
- Extracts changelog entry for that version from `CHANGELOG.md`
- Validates that required files exist (`flip-sensor-card.js`, `hacs.json`)
- Creates a GitHub Release with:
  - Release notes from CHANGELOG.md
  - Attached files: `flip-sensor-card.js`, `hacs.json`, `README.md`, `CHANGELOG.md`
  - Installation instructions

**How to use:**
1. Update `CHANGELOG.md` with changes for the new version
2. Commit and push changes to `main` branch
3. Create and push a tag:
   ```bash
   git tag -a v25.0.1 -m "Version 25.0.1"
   git push origin v25.0.1
   ```
4. GitHub Actions will automatically create the release

### 2. Validate Workflow (`.github/workflows/validate.yml`)

**Trigger:** Runs on every push to `main` branch and on pull requests.

**What it does:**
- Validates JavaScript syntax
- Checks that all required files exist
- Validates `hacs.json` is valid JSON
- Checks file sizes

**Purpose:** Ensures code quality before merging.

## Permissions

The release workflow requires `contents: write` permission, which is automatically granted by GitHub Actions using `GITHUB_TOKEN`.

## Tag Format

Tags must follow semantic versioning format:
- `v25.0.1` ✅
- `v1.2.3` ✅
- `v0.0.1` ✅
- `25.0.1` ❌ (missing 'v' prefix)
- `v25.0` ❌ (incomplete version)

## Troubleshooting

**Release not created:**
- Check that tag format matches `v*.*.*`
- Ensure `CHANGELOG.md` has an entry for the version
- Check GitHub Actions tab for error messages

**Validation fails:**
- Check that all required files are present
- Validate JavaScript syntax manually
- Ensure `hacs.json` is valid JSON


