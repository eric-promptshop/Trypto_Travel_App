# Contributing to Travel Itinerary Builder

Thank you for your interest in contributing to the Travel Itinerary Builder! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security](#security)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully
- Prioritize the community's best interests

## Getting Started

1. **Fork the repository** and clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/travel-itinerary-builder.git
   cd travel-itinerary-builder
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Run tests** to ensure everything is working:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

## Development Workflow

1. **Create a new branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   - Run unit tests: `npm test`
   - Run type checking: `npm run type-check`
   - Run linting: `npm run lint`
   - Run E2E tests: `npm run test:e2e`

4. **Commit your changes** using our commit message guidelines

5. **Push to your fork** and create a pull request

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper typing
- Export types/interfaces that might be reused
- Use descriptive variable and function names

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad
interface Data {
  id: any;
  n: string;
  e: string;
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop typing
- Follow the component file structure:

```typescript
import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  // Component logic here
  return <div>{/* JSX here */}</div>;
};
```

### File Organization

```
components/
├── atoms/          # Basic UI components
├── molecules/      # Composite components
├── organisms/      # Complex components
└── templates/      # Page templates

lib/
├── api/           # API utilities
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── types/         # TypeScript types
```

### Styling

- Use Tailwind CSS classes
- Follow mobile-first design
- Use CSS variables for theming
- Keep styles co-located with components

## Testing Guidelines

### Unit Tests

- Write tests for all new components and functions
- Use Jest and React Testing Library
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

```typescript
describe('MyComponent', () => {
  it('should render title correctly', () => {
    // Arrange
    const props = { title: 'Test Title' };
    
    // Act
    render(<MyComponent {...props} />);
    
    // Assert
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### E2E Tests

- Use Playwright for E2E testing
- Test critical user journeys
- Use page object pattern
- Keep tests independent

### Test Coverage

- Aim for >80% code coverage
- Focus on testing behavior, not implementation
- Don't test third-party libraries

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(auth): add OAuth2 integration with Google

- Implement Google OAuth2 provider
- Add login/logout UI components
- Update user model with OAuth fields

Closes #123

---

fix(api): handle rate limiting in content scanner

Prevent API errors when hitting rate limits by implementing
exponential backoff and retry logic.
```

## Pull Request Process

1. **Update documentation** if you've changed APIs or added features

2. **Ensure all tests pass**:
   ```bash
   npm test
   npm run type-check
   npm run lint
   npm run build
   ```

3. **Update the README.md** if needed

4. **Create a pull request** with:
   - Clear title following commit message format
   - Description of changes
   - Link to related issues
   - Screenshots for UI changes

5. **Request review** from code owners

6. **Address review feedback** promptly

7. **Ensure CI passes** before merging

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console.logs or debugging code

## Screenshots (if applicable)
```

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email security concerns to: security@example.com
2. Include detailed description and steps to reproduce
3. Wait for acknowledgment before public disclosure

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all user inputs
- Sanitize data before rendering
- Keep dependencies updated
- Follow OWASP guidelines

### Pre-commit Checks

We use git hooks to ensure code quality:

```bash
# Install pre-commit hooks
npm run prepare

# Hooks will run:
- Type checking
- Linting
- Formatting
- Unit tests
```

## Questions?

If you have questions:

1. Check existing [issues](https://github.com/owner/travel-itinerary-builder/issues)
2. Search [discussions](https://github.com/owner/travel-itinerary-builder/discussions)
3. Create a new discussion for general questions
4. Join our Discord/Slack community

Thank you for contributing! 🎉