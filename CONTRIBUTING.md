# Contributing to pxt.chat

Thank you for your interest in contributing to pxt.chat! We welcome contributions from everyone, whether it's code, documentation, bug reports, or feature requests.

## 🛠️ Development Setup

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/PrtHub/pxt.chat.git
   cd pxt.chat
   ```
3. Install dependencies:
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```
4. Set up your environment variables:
   ```bash
   cp .env.example .env.local
   # Update the environment variables in .env.local
   ```
5. Set up the database:
   ```bash
   # Run database migrations
   bun run db:push
   ```
6. Start the development server:
   ```bash
   bun dev
   ```

## 🔍 Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: We use Prettier for code formatting
- **Linting**: ESLint is configured to maintain code quality
- **Imports**: Use absolute imports (e.g., `@/components/Button`)
- **Naming**: Use PascalCase for components and camelCase for utilities

## 🚀 Making Changes

1. **Create a new branch** for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```

2. **Make your changes** following the code style guidelines

3. **Commit your changes** with a descriptive message:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve issue with login"
   git commit -m "docs: update README"
   ```

4. **Push** your changes to your fork:
   ```bash
   git push origin your-branch-name
   ```

5. **Open a Pull Request** (PR) to the `main` branch

## 📝 Pull Request Guidelines

- Keep PRs focused on a single feature or bug fix
- Write clear, concise commit messages
- Reference any related issues in your PR description
- Ensure all tests pass before submitting
- Update documentation as needed
- Be prepared to make changes based on code review feedback

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected vs. actual behavior
4. Screenshots or error messages (if applicable)
5. Browser/OS version information

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if a similar feature already exists
2. Explain why this feature would be valuable
3. Provide as much detail as possible about the implementation

## 📚 Documentation

Good documentation is crucial. When making changes:

- Update relevant documentation
- Add JSDoc comments for new functions and components
- Keep the README up to date
- Document new environment variables

## 🙏 Thank You!

Your contributions help make PxT better for everyone. We appreciate your time and effort!
