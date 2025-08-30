# CoreV4 Mental Health Platform

A comprehensive mental health support platform built with React 19, TypeScript, and modern web technologies.

## Features

- 🧠 AI-Powered Mental Health Support
- 📊 Mood Tracking & Analytics
- 👥 Community Support Groups
- 👨‍⚕️ Professional Therapist Network
- 🆘 24/7 Crisis Resources
- 🌱 Wellness Tools & Exercises
- 🔒 Secure & Private
- 📱 Progressive Web App (PWA)

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **State Management:** Zustand, React Query
- **Testing:** Vitest, React Testing Library, Playwright
- **Build Tools:** Vite, ESBuild
- **Deployment:** Docker, Nginx

## Prerequisites

- Node.js 20+ 
- npm 10+
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/corev4.git
cd corev4
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

The application will open at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
CoreV4/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # State management
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── styles/         # Global styles
├── tests/              # Test files
├── public/             # Static assets
└── docs/               # Documentation
```

## Development Guidelines

### Code Style

- Use TypeScript with strict mode
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features

### Component Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Ensure accessibility (WCAG 2.1 AA)
- Optimize for performance

### Mental Health Considerations

- Use calming colors and gentle animations
- Provide clear crisis resources
- Ensure content is supportive and non-triggering
- Implement privacy-first design

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## Deployment

### Docker

Build and run with Docker:
```bash
docker build -t corev4 .
docker run -p 80:80 corev4
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_AUTH_DOMAIN` - Authentication domain
- `VITE_SENTRY_DSN` - Error tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## Security

- All data is encrypted in transit and at rest
- Regular security audits
- HIPAA compliant infrastructure
- Report security issues to security@corev4.health

## Support

- Documentation: [docs.corev4.health](https://docs.corev4.health)
- Community: [community.corev4.health](https://community.corev4.health)
- Email: support@corev4.health

## License

Copyright © 2024 CoreV4. All rights reserved.

---

Built with ❤️ for mental wellness