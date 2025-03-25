# Contributing to Change Flow

Thank you for your interest in contributing to Change Flow! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues section
2. If not, create a new issue with a clear title and description
3. Include:
   - Steps to reproduce the bug
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Your environment details (OS, browser, etc.)

### Suggesting Enhancements

1. Create a new issue with the "enhancement" label
2. Provide a clear description of the feature
3. Explain why this enhancement would be useful
4. Consider including mockups or examples

### Pull Request Process

1. Fork the repository
2. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following our coding standards
4. Write meaningful commit messages
5. Update documentation as needed
6. Test your changes thoroughly
7. Push to your fork and submit a pull request

### Coding Standards

- Use TypeScript for type safety
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features
- Keep functions small and focused
- Use early returns when possible

### Commit Messages

- Use clear and meaningful commit messages
- Start with a verb in present tense
- Keep the first line under 72 characters
- Example format:

  ```
  Add user authentication to asset request form

  - Implement JWT token validation
  - Add role-based access control
  - Update tests for new auth flow
  ```

### Branch Naming

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`
- Example: `feature/asset-request-form`

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure
4. Run database migrations:
   ```bash
   npm run db:migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Questions or Need Help?

Feel free to create an issue with the "question" label if you need help or have questions about contributing.

## License

By contributing to Change Flow, you agree that your contributions will be licensed under the same MIT license as the project.
