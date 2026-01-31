# Wakaru

Wakaru is an AI-powered web application designed to help beginner and intermediate Japanese learners read and understand authentic content like manga and social media. Wakaru breaks down Japanese sentences into interactive tiles, providing morphological analysis, grammar explanations, and contextual translations, effectively bridging the gap between textbook theory and real-world reading fluency.

## Tech Stack

**Frontend:**
- [Astro 5](https://astro.build/) - Web framework for performance.
- [React 19](https://react.dev/) - UI library for interactive components.
- [TypeScript 5](https://www.typescriptlang.org/) - Static typing.
- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework.
- [Shadcn/ui](https://ui.shadcn.com/) - Reusable component library.

**Backend & Services:**
- [Supabase](https://supabase.com/) - Backend-as-a-Service (PostgreSQL, Auth).
- [OpenRouter](https://openrouter.ai/) - AI model aggregation (using gpt-4o-mini).

**Testing:**
- [Vitest](https://vitest.dev/) - Unit and integration testing framework.
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React component testing.
- [Playwright](https://playwright.dev/) - End-to-End (E2E) testing.
- [MSW](https://mswjs.io/) - API mocking.

## Getting Started Locally

Follow these steps to set up the project locally.

### Prerequisites

- Node.js version **22.14.0** (referenced in `.nvmrc`).
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/martagregula/wakaru.git
   cd wakaru
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration:
   Create a `.env` file in the project root. You will need to configure credentials for:
   - **Supabase** (URL and Anon Key)
   - **OpenRouter** (API Key for AI features)

4. Run the development server:
   ```bash
   npm run dev
   ```
   The application should now be running on `http://localhost:3000`.

## Available Scripts

In the project directory, you can run:

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server. |
| `npm run build` | Builds the production-ready site. |
| `npm run preview` | Previews the built production site locally. |
| `npm run lint` | Runs ESLint to check for code quality issues. |
| `npm run lint:fix` | Runs ESLint and automatically fixes fixable issues. |
| `npm run format` | Formats code using Prettier. |

## Project Scope

The current MVP includes the following features:

- **Text Analysis**: Input validation and analysis of short Japanese texts (max 280 chars).
- **Interactive Results**: Clickable word tiles with dictionary definitions and grammar details.
- **User Accounts**: Registration and login via Email/Password (Supabase Auth).
- **History**: "My Sentences" view to browse and search saved analyses.

## License

MIT
