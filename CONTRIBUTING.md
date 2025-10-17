# Contributing to Tech News Automation Platform

First off, thank you for considering contributing to Tech News Platform! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed**
- **Explain which behavior you expected to see instead**
- **Include screenshots if relevant**

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### 🔧 Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue that pull request!

## Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/My-Site.git
cd My-Site

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Add your API keys

# 5. Start development
npm run dev
```

## Pull Request Process

1. **Branch Naming**: Use descriptive branch names
   - `feature/add-rss-feed`
   - `fix/telegram-bot-crash`
   - `docs/update-readme`

2. **Commit Often**: Make small, logical commits

3. **Write Tests**: Add tests for new features

4. **Update Documentation**: Update relevant docs

5. **Follow Style Guide**: Match existing code style

6. **Request Review**: Tag relevant maintainers

## Style Guidelines

### TypeScript / JavaScript

```typescript
// ✅ Good
const fetchArticles = async (limit: number): Promise<Article[]> => {
  try {
    const articles = await supabase
      .from('tech_news_articles')
      .select('*')
      .limit(limit);
    
    return articles;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
};

// ❌ Bad
const fetchArticles = async (l) => {
  const a = await supabase.from('tech_news_articles').select('*').limit(l);
  return a;
};
```

### React Components

```typescript
// ✅ Good
interface ArticleProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export const Article: React.FC<ArticleProps> = ({ 
  title, 
  description, 
  imageUrl 
}) => {
  return (
    <article className="space-y-4">
      {imageUrl && <img src={imageUrl} alt={title} />}
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
};

// ❌ Bad
export const Article = (props) => {
  return <div>{props.title}</div>;
};
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

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
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(telegram): add command history tracking

Implement command history to track user interactions
with the Telegram bot for analytics purposes.

Closes #123
```

```bash
fix(scraper): handle rate limit errors gracefully

Add exponential backoff when Firecrawl API returns
rate limit errors instead of crashing.

Fixes #456
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test article.test.ts

# Run with coverage
npm test -- --coverage
```

## Questions?

Feel free to contact the maintainer:
- **Email**: cemkoyluoglu@icloud.com
- **Telegram**: @CemRoot
- **LinkedIn**: [Cem Koyluoglu](https://www.linkedin.com/in/cem-koyluoglu/)

---

Thank you for contributing! 🙏

