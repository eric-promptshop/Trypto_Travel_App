# ESLint Configuration Guide

## Overview

This project uses a multi-environment ESLint configuration to balance code quality enforcement with development velocity. The setup includes separate configurations for development and production environments, pre-commit hooks, and CI/CD integration.

## Configuration Structure

### Base Configuration (`.eslintrc.base.json`)
Contains shared rules and settings that both development and production environments extend from:
- Next.js and TypeScript presets
- Common parser and environment settings
- File-specific overrides for tests, config files, and scripts
- Shared accessibility and React rules

### Development Configuration (`.eslintrc.development.json`)
Extends base configuration with developer-friendly rules:
- Most rules set to "warn" instead of "error"
- Allows `console.log` and `debugger` statements
- More permissive type checking
- Focuses on catching real issues without blocking development

### Production Configuration (`.eslintrc.production.json`)
Extends base configuration with strict rules for production builds:
- All rules set to "error" for strict enforcement
- Disallows `console.log` and `debugger` statements
- Strict type checking and code quality rules
- Additional rules for performance and best practices

### Main Configuration (`.eslintrc.json`)
Points to development configuration by default for local development.

## Available Scripts

### Basic Linting
```bash
npm run lint          # Uses main config (development)
npm run lint:dev      # Explicitly uses development config
npm run lint:prod     # Uses production config (strict)
```

### Auto-fixing
```bash
npm run lint:fix      # Fix issues with main config
npm run lint:fix:dev  # Fix issues with development config
npm run lint:fix:prod # Fix issues with production config
```

### Utility Scripts
```bash
npm run lint:staged       # Run lint-staged (used by pre-commit hooks)
npm run lint:cache:clear  # Clear ESLint cache
```

## Pre-commit Hooks

The project uses Husky and lint-staged to automatically lint and fix code before commits:

### Setup
- **Husky**: Manages git hooks
- **lint-staged**: Runs linting only on staged files

### What happens on commit:
1. ESLint runs on all staged `.ts`, `.tsx`, `.js`, `.jsx` files
2. Auto-fixable issues are automatically corrected
3. TypeScript type checking runs on staged TypeScript files
4. Fixed files are automatically added to the commit
5. Commit fails if unfixable errors remain

### Configuration
Located in `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "git add"
    ],
    "*.{ts,tsx}": [
      "npm run type-check"
    ]
  }
}
```

## CI/CD Integration

### Main CI Pipeline
- Uses production ESLint configuration for strict checking
- Runs on all files during build process
- Fails build if any linting errors exist

### Pull Request Checks
- Separate job that runs only on changed files
- Uses production configuration for consistency
- Provides faster feedback on PRs

### GitHub Actions Configuration
```yaml
- name: Run linting (Production Rules)
  run: npm run lint:prod

- name: Run ESLint on changed files
  run: npx eslint --config .eslintrc.production.json ${{ changed_files }}
```

## Rule Categories

### Development-Friendly Rules
- `no-console: "off"` - Allows console statements during development
- `no-debugger: "off"` - Allows debugger statements
- `@typescript-eslint/no-explicit-any: "warn"` - Warns about `any` usage
- `@typescript-eslint/no-inferrable-types: "off"` - Allows explicit type annotations

### Production-Strict Rules
- `no-console: "error"` - Prevents console statements in production
- `no-debugger: "error"` - Prevents debugger statements
- `@typescript-eslint/no-explicit-any: "error"` - Errors on `any` usage
- `@typescript-eslint/prefer-nullish-coalescing: "error"` - Enforces modern syntax

### Test File Overrides
- More permissive rules for test files
- Allows `any` types in tests
- Allows console statements for debugging tests
- Relaxed function and assertion rules

## IDE Integration

### VS Code Settings
Add to `.vscode/settings.json`:
```json
{
  "eslint.workingDirectories": ["./"],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.format.enable": true
}
```

### Recommended Extensions
- ESLint (dbaeumer.vscode-eslint)
- Prettier - Code formatter (esbenp.prettier-vscode)

## Troubleshooting

### Common Issues

#### Cache Problems
```bash
npm run lint:cache:clear
```

#### Dependency Conflicts
```bash
npm install --legacy-peer-deps
```

#### Pre-commit Hook Not Running
```bash
npx husky install
chmod +x .husky/pre-commit
```

#### Different Rules in IDE vs CLI
Ensure your IDE is using the correct ESLint configuration:
- Check VS Code ESLint extension settings
- Verify workspace configuration
- Restart ESLint server in IDE

### Performance Tips

1. **Use incremental linting**: Only lint changed files during development
2. **Enable caching**: ESLint cache is enabled by default
3. **IDE integration**: Use real-time linting in your editor
4. **Pre-commit hooks**: Catch issues early before CI/CD

## Best Practices

### For Developers
1. Run `npm run lint:dev` during development
2. Use `npm run lint:fix:dev` to auto-fix issues
3. Address warnings before they become errors in production
4. Use TypeScript strict mode for better type safety

### For CI/CD
1. Always use production configuration in CI
2. Cache node_modules and ESLint cache
3. Run linting before tests and build
4. Fail fast on linting errors

### For Code Reviews
1. Ensure all linting passes before review
2. Focus on logic and architecture, not style issues
3. Use production config to catch strict issues early
4. Document any necessary rule exceptions

## Customization

### Adding New Rules
1. Add to base configuration for shared rules
2. Add to environment-specific configs for different severities
3. Test with both development and production configs
4. Update documentation

### Project-Specific Rules
Consider adding custom rules for:
- API response handling patterns
- Component prop validation
- Import/export conventions
- Error handling patterns

### Rule Exceptions
Use ESLint disable comments sparingly:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = await response.json();
```

Document the reason for exceptions in code comments. 