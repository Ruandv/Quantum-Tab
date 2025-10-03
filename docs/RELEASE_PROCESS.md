# 🚀 Release Process

This document outlines the automated release process for Quantum Tab Chrome Extension using [Google's Release Please](https://github.com/googleapis/release-please).

## 📋 Overview

Quantum Tab uses **Release Please** for automated releases based on [Conventional Commits](https://www.conventionalcommits.org/). This means:

- 🤖 **Fully Automated** - No manual version bumping needed
- 📝 **Smart Changelogs** - Generated from your commit messages  
- 🏷️ **Semantic Versioning** - Automatic version calculation
- 🔄 **Release PRs** - Review changes before release

## 🎯 How It Works

### 1. **Write Conventional Commits**
```bash
feat: add new GitHub widget integration
fix: resolve clock timezone display issue  
docs: update README with installation guide
chore: update dependencies to latest versions
```

### 2. **Push to Main Branch**
Release Please monitors the `main` branch and:
- Analyzes commit messages since last release
- Calculates next version (patch/minor/major)
- Creates/updates a Release PR

### 3. **Merge Release PR**
When you merge the Release PR:
- Creates a GitHub release
- Builds and packages the extension
- Uploads Chrome Web Store ready ZIP files

## 🎨 Commit Types & Versioning

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | **Patch** (1.0.0 → 1.0.1) | Bug fixes |
| `feat:` | **Minor** (1.0.0 → 1.1.0) | New features |
| `feat!:` or `BREAKING CHANGE:` | **Major** (1.0.0 → 2.0.0) | Breaking changes |
| `docs:`, `style:`, `chore:` | **No bump** | Non-functional changes |

### Example Commit Messages
```bash
# Patch release (bug fixes)
fix: resolve widget positioning on small screens
fix(clock): correct timezone calculation for DST

# Minor release (new features)  
feat: add weather widget with location support
feat(dashboard): implement drag-and-drop reordering

# Major release (breaking changes)
feat!: redesign widget API with new configuration format
feat: remove deprecated background image options

BREAKING CHANGE: Widget configuration format has changed
```

## 📦 Package Formats

### Chrome Extension Package
- **Format**: `Quantum_Tab-YYMMDD_X.Y.Z.zip`
- **Contents**: Built extension files (dist/ directory)
- **Use**: Upload to Chrome Web Store or manual installation

### Source Code Archive  
- **Format**: `quantum-tab-source-X.Y.Z.zip`
- **Contents**: Complete source code
- **Use**: Review submissions, debugging

## 🔍 Quality Gates

All releases must pass:

- ✅ **TypeScript compilation** (`npm run type-check`)
- ✅ **ESLint checks** (`npm run lint`)
- ✅ **Prettier formatting** (`npm run format`)
- ✅ **Successful build** (`npm run build`)
- ✅ **Extension validation** (manifest.json structure)
- ✅ **Package integrity** (ZIP file creation)

## � Workflow Files

### Main Workflows
- [`.github/workflows/release.yml`](.github/workflows/release.yml) - Release Please automation
- [`.github/workflows/pre-release.yml`](.github/workflows/pre-release.yml) - CI/CD quality checks

### Configuration Files  
- [`.release-please-config.json`](.release-please-config.json) - Release Please settings
- [`.release-please-manifest.json`](.release-please-manifest.json) - Current version tracking

## 📦 Package Formats

### Chrome Extension Package
- **Format**: `Quantum_Tab-YYMMDD_X.Y.Z.zip`
- **Contents**: Built extension files (dist/ directory)
- **Use**: Upload to Chrome Web Store or manual installation

### Source Code Archive
- **Format**: `quantum-tab-source-X.Y.Z.zip`  
- **Contents**: Complete source code
- **Use**: Review submissions, debugging

## 📋 Release Checklist

### ✨ For Developers (Daily Work)
- [ ] Write clear conventional commit messages
- [ ] Test features locally before committing
- [ ] Keep commits focused and atomic
- [ ] Update documentation when needed

### 🚀 For Maintainers (Release Process)
- [ ] Review and merge Release PR when ready
- [ ] Verify GitHub release was created successfully
- [ ] Download and test extension package
- [ ] Upload to Chrome Web Store (if applicable)
- [ ] Announce release to community

### 📢 Post-Release
- [ ] Monitor for any issues or bug reports
- [ ] Update any external documentation
- [ ] Share release notes with users

## 🏷️ Version Strategy

Quantum Tab follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, major UI overhauls
- **MINOR** (x.Y.0): New features, new widgets, significant enhancements
- **PATCH** (x.y.Z): Bug fixes, small improvements, security updates

### Examples
- `1.0.0` → `1.0.1`: Bug fix release
- `1.0.0` → `1.1.0`: New widget added
- `1.0.0` → `2.0.0`: Complete UI redesign

## 📝 Release Notes Template

```markdown
# 🚀 Quantum Tab vX.Y.Z

## ✨ What's New
- Feature 1
- Feature 2

## 🐛 Bug Fixes
- Fix 1
- Fix 2

## 🔧 Improvements
- Improvement 1
- Improvement 2

## 📦 Installation
Download the extension package and install manually or wait for Chrome Web Store update.

## 🤝 Contributing
Found a bug? [Open an issue](https://github.com/Ruandv/Quantum-Tab/issues)!
```

## 🚨 Troubleshooting

### Release Please Issues

**No Release PR Created**
- Check that commits follow conventional format
- Ensure commits are on the `main` branch
- Verify `.release-please-config.json` is valid

**Build Fails During Release**
```bash
# Test locally first
npm run pre-release
```

**Version Sync Issues**
Release Please automatically syncs `package.json` and `manifest.json` versions.

### Getting Help

- 📚 [Release Please Documentation](https://github.com/googleapis/release-please)
- 📖 [Conventional Commits Guide](https://www.conventionalcommits.org/)
- � [Project Issues](https://github.com/Ruandv/Quantum-Tab/issues)

## 🎯 Quick Start

1. **Clone and setup:**
   ```bash
   git clone https://github.com/Ruandv/Quantum-Tab.git
   cd Quantum-Tab
   npm install
   ```

2. **Make changes with conventional commits:**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: add awesome new feature"
   git push origin main
   ```

3. **Review and merge Release PR:**
   - Wait for Release Please to create a PR
   - Review the generated changelog
   - Merge when ready to release

4. **Done!** 🎉
   - GitHub release created automatically
   - Extension package ready for distribution

---

*This automated process ensures consistent, high-quality releases with minimal manual effort.*