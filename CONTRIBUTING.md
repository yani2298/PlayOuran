# Contributing to PlayOuran

Thank you for your interest in contributing to PlayOuran! We welcome contributions from developers around the world who want to help improve this Quran application for the Muslim community.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a respectful, inclusive environment. By participating, you are expected to uphold Islamic principles of respect, kindness, and constructive dialogue.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots and animated GIFs if possible**
- **Include your macOS version and PlayOuran version**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the concept**
- **Describe the current behavior and explain the desired behavior**
- **Explain why this enhancement would be useful to most PlayOuran users**

### Pull Requests

1. **Fork the repo and create your branch from `main`**
2. **If you've added code that should be tested, add tests**
3. **If you've changed APIs, update the documentation**
4. **Ensure the test suite passes**
5. **Make sure your code lints**
6. **Issue that pull request!**

## Development Setup

1. **Prerequisites**
   ```bash
   # Ensure you have Node.js (v16 or later) installed
   node --version
   npm --version
   ```

2. **Clone and Setup**
   ```bash
   git clone https://github.com/PlayOuran/PlayOuran.git
   cd PlayOuran
   npm install
   ```

3. **Development**
   ```bash
   # Start development server
   npm start
   
   # Run linting
   npm run lint
   
   # Build the app
   npm run build
   ```

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Follow ES6+ standards
- Use meaningful variable and function names

### CSS Style

- Use kebab-case for class names
- Use meaningful class names that describe content/purpose
- Keep specificity low
- Use CSS custom properties for theming

## Project Structure

```
PlayOuran/
├── assets/           # Static assets (images, icons)
├── main.js          # Electron main process
├── renderer.js      # Renderer process logic
├── index.html       # Main application HTML
├── style.css        # Application styles
├── package.json     # Project dependencies and scripts
└── README.md        # Project documentation
```

## API Guidelines

When working with external APIs:

- Handle errors gracefully with user-friendly messages
- Implement proper caching to respect API limits
- Use environment variables for API keys (never commit them)
- Follow the rate limiting guidelines of each API

## Islamic Content Guidelines

When contributing content related to Quranic verses, Hadith, or Islamic information:

- **Verify authenticity** of all Islamic content from reliable sources
- **Respect the sanctity** of Quranic text and ensure accurate representation
- **Use proper Arabic typography** and diacritical marks when possible
- **Cite sources** for all Hadith and scholarly content
- **Follow Islamic etiquette** in all communications and code comments

## Testing

- Write unit tests for utility functions
- Test UI components thoroughly across different screen sizes
- Verify API integrations work correctly
- Test offline functionality where applicable

## Documentation

- Update README.md if you change functionality
- Comment your code clearly, especially complex logic
- Update API documentation for any API changes
- Include JSDoc comments for functions

## Community

- Be respectful and constructive in all interactions
- Help other contributors when possible
- Share knowledge and best practices
- Follow Islamic principles of cooperation and mutual help

## Recognition

Contributors who make significant improvements will be recognized in:
- The README.md contributors section
- Release notes for major contributions
- The about section of the application

## Questions?

Feel free to contact us through:
- GitHub Issues for technical questions
- GitHub Discussions for general questions
- Email: contribute@playouran.com

Thank you for contributing to PlayOuran and helping serve the Muslim community!

---

*"And whoever does righteous deeds, whether male or female, while being a believer - those will enter Paradise and will not be wronged, [even as much as] the speck on a date seed."* - Quran 4:124