# Contributing to AVCP

Thank you for your interest in contributing to the Avalanche Verifiable Credentials Platform! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or fix
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/avcp.git
cd avcp

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Set up environment variables
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Start local development
npx hardhat node
npx hardhat run scripts/deploy-manual.js --network localhost
cd frontend && npm run dev
```

## Code Style

- Use TypeScript for type safety
- Follow the existing code formatting
- Add comments for complex logic
- Write tests for new features

## Submitting Changes

1. Ensure all tests pass
2. Update documentation if needed
3. Write clear commit messages
4. Submit a pull request with description of changes

## Issue Reporting

Please use GitHub Issues to report bugs or request features. Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details

Thank you for contributing!
