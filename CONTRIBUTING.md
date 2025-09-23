# Contributing to [ZamongTextEditor]

Thank you for your interest in contributing to our project! We appreciate your time and effort in helping make this project better for everyone. Whether you're fixing bugs, adding features, improving documentation, or providing feedback, every contribution is valuable and welcome.

## Ways to Contribute

There are many ways you can contribute to this project:

### 🐛 Bug Reports
- Report bugs and issues you encounter
- Provide detailed reproduction steps
- Include environment information

### 💡 Feature Requests
- Suggest new features or enhancements
- Discuss ideas and use cases
- Help prioritize development efforts

### 💻 Code Contributions
- Fix bugs and implement features
- Improve performance and optimization
- Add or enhance functionality

### 📚 Documentation
- Improve existing documentation
- Add missing documentation
- Fix typos and clarify instructions
- Create tutorials and examples

### 🧪 Testing
- Write and improve tests
- Report test failures
- Help with test automation

### 🎨 Design & UX
- Improve user interface and experience
- Suggest design improvements
- Create mockups and prototypes

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/ikhyunAn/zamong_texteditor.git
   cd zamong_texteditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Verify setup**
   - Open http://localhost:3000 in your browser
   - Run tests: `npm test`
   - Check linting: `npm run lint`

## Development Workflow

### Branch Naming
Use descriptive branch names that follow this pattern:
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring
- `test/description` - for adding or updating tests

Examples:
- `feature/user-authentication`
- `fix/login-validation-error`
- `docs/api-documentation`

### Commit Conventions
We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add user login functionality
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
```

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes following our guidelines
3. Write or update tests as needed
4. Ensure all tests pass
5. Update documentation if necessary
6. Submit a pull request with a clear description

## Code Style Guidelines

### TypeScript Best Practices

#### Type Safety
```typescript
// ✅ Good - Use explicit types
interface User {
  id: string;
  email: string;
  name: string;
}

// ❌ Avoid - Using 'any'
const user: any = getData();
```

#### Naming Conventions
- **Variables & Functions**: camelCase (`userName`, `fetchUserData`)
- **Classes & Interfaces**: PascalCase (`UserService`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_ATTEMPTS`)
- **Files**: kebab-case (`user-service.ts`, `api-client.ts`)

#### Function Guidelines
```typescript
// ✅ Good - Clear function signatures
async function fetchUser(id: string): Promise<User | null> {
  // Implementation
}

// ✅ Good - Use arrow functions for short operations
const isValidEmail = (email: string): boolean => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

### React Best Practices

#### Component Structure
```typescript
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### Hooks Guidelines
```typescript
// ✅ Good - Custom hooks with proper typing
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

#### State Management
- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Consider React Query/SWR for server state
- Use Context API sparingly for truly global state

### Code Formatting
We use Prettier and ESLint for consistent formatting:

```bash
# Format code
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Testing Requirements

### Test Structure
We use Jest and React Testing Library for testing:

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
└── utils/
    ├── helpers.ts
    └── helpers.test.ts
```

### Writing Tests

#### Unit Tests
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Tests
```typescript
// API integration test
describe('User API', () => {
  it('fetches user data successfully', async () => {
    const userData = await fetchUser('user-123');
    expect(userData).toMatchObject({
      id: 'user-123',
      email: expect.any(String),
      name: expect.any(String)
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test Button.test.tsx
```

### Test Coverage Requirements
- Maintain minimum 80% code coverage
- All new features must include tests
- Bug fixes should include regression tests
- Critical paths require comprehensive testing

## GitHub Issue and Pull Request Templates

We use structured GitHub templates to streamline the contribution process and ensure all necessary information is provided. These templates help maintainers respond to contributions more efficiently and effectively.

### 🐛 Bug Report Template

Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) when reporting issues. This template includes:

- **Prerequisites checklist** to ensure due diligence
- **Version information** for proper context
- **Detailed bug description** with clear reproduction steps
- **Expected vs. actual behavior** comparison
- **Environment details** (OS, browser, Node.js version)
- **Console errors** and stack traces
- **Screenshots/videos** for visual issues
- **Possible solutions** if you have ideas

**Why use the template?** It ensures we have all the information needed to reproduce and fix the issue quickly, reducing back-and-forth communication.

### 💡 Feature Request Template

Submit feature suggestions using our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml), which covers:

- **Problem statement** - What issue does this solve?
- **Proposed solution** with detailed description
- **Use cases** and examples
- **Priority level** and implementation complexity
- **Breaking changes** assessment
- **Contribution willingness** indicators

**Why use the template?** It helps us understand the value proposition, implementation scope, and community impact of proposed features.

### 📋 Pull Request Template

All pull requests should use our [Pull Request Template](.github/pull_request_template.md), featuring:

- **Change type classification** (bug fix, feature, breaking change, etc.)
- **Comprehensive testing checklist** (unit, integration, manual)
- **Code quality verification** (style, review, documentation)
- **Performance and security considerations**
- **Browser and accessibility compatibility**
- **Deployment readiness assessment**

**Why use the template?** It ensures consistent quality standards and thorough review coverage for all contributions.

## How to Use the Templates Effectively

### For Bug Reports

1. **Search first** - Check existing issues to avoid duplicates
2. **Be specific** - Use descriptive titles like "Button component crashes when clicking rapidly"
3. **Provide context** - Include relevant code snippets and environment details
4. **Add visuals** - Screenshots or videos help explain UI issues
5. **Stay engaged** - Respond to follow-up questions promptly

### For Feature Requests

1. **Explain the problem** - Start with the pain point, not the solution
2. **Provide use cases** - Give concrete examples of how the feature would be used
3. **Consider alternatives** - Show you've thought through different approaches
4. **Be realistic** - Understand that not all features can be implemented
5. **Offer to help** - Indicate if you're willing to contribute to the implementation

### For Pull Requests

1. **Start small** - Break large changes into smaller, focused PRs
2. **Test thoroughly** - Ensure all tests pass and add new ones as needed
3. **Document changes** - Update README, API docs, and inline comments
4. **Self-review** - Review your own code before requesting others to review
5. **Be responsive** - Address review feedback promptly and professionally

### Bug Reporting Guidelines

1. **Search existing issues** before creating a new one
2. **Use a clear, descriptive title**
3. **Provide complete reproduction steps**
4. **Include relevant code snippets**
5. **Add screenshots or recordings** when helpful
6. **Specify your environment details**
7. **Label the issue appropriately**

## Pull Request Process

### Before Submitting

1. **Check existing PRs** to avoid duplicates
2. **Run all tests** and ensure they pass
3. **Follow code style guidelines**
4. **Update documentation** if needed
5. **Add or update tests** for your changes

### PR Submission Steps

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow our coding standards
   - Add appropriate tests

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use our [Pull Request Template](.github/pull_request_template.md)
   - Provide a clear description of your changes
   - Link related issues using keywords ("Fixes #123", "Closes #456")
   - Request reviews from appropriate maintainers
   - Fill out all relevant sections of the template completely

**Template Usage Tips:**
- Select all applicable change types (bug fix, feature, etc.)
- Provide detailed testing information and steps
- Include screenshots for UI changes
- Complete the comprehensive checklist before submitting
- Add performance and security considerations where relevant

### Review Process

1. **Automated checks** must pass (CI/CD, tests, linting)
2. **Code review** by at least one maintainer
3. **Testing** in review environment if applicable
4. **Documentation review** for user-facing changes
5. **Final approval** and merge by maintainers

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. By participating in this project, you agree to abide by our Code of Conduct.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at [contact-email]. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances.

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.1.

---

## Template Quick Reference

For your convenience, here's a quick reference to all our contribution templates:

| Template | Purpose | When to Use |
|----------|---------|-------------|
| [🐛 Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) | Report issues and bugs | When you encounter unexpected behavior or errors |
| [💡 Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) | Suggest new features | When you have ideas for improvements or new functionality |
| [📋 Pull Request](.github/pull_request_template.md) | Submit code changes | When contributing code, fixes, or documentation |

### Best Practices Recap

✅ **DO:**
- Search existing issues/PRs before creating new ones
- Use descriptive titles and clear descriptions
- Fill out templates completely and thoroughly
- Provide reproduction steps for bugs
- Include environment details and screenshots when relevant
- Test your changes before submitting PRs
- Follow the code style guidelines
- Be responsive to feedback and questions

❌ **DON'T:**
- Skip template sections or provide incomplete information
- Create duplicate issues or PRs
- Submit PRs without testing
- Ignore code review feedback
- Use vague titles like "fix bug" or "add feature"

## Questions?

If you have any questions about contributing, please:

1. Check our [FAQ](./docs/FAQ.md)
2. Search existing [Discussions](https://github.com/org/repo/discussions)
3. Open a new [Discussion](https://github.com/org/repo/discussions/new)
4. Contact the maintainers at [contact-email]

Thank you for contributing! 🎉
