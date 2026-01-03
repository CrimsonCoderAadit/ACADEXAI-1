# Smart Academic & Life Management System

A comprehensive web application designed to help students manage their academic life efficiently. Built with modern web technologies, this platform offers attendance tracking, AI-powered quizzes, an intelligent assistant, and class management features.

## Features

- **Attendance Tracker** - Monitor and manage class attendance to ensure you never miss important sessions
- **Brain Quiz** - Test your knowledge with AI-generated quizzes tailored to your courses using Gemini AI
- **AI Assistant** - Get instant help with your coursework from our intelligent chatbot powered by Google's Gemini
- **Classes Management** - Organize your class schedule, assignments, and course materials in one place

## Tech Stack

- **Frontend Framework**: [Next.js 15](https://nextjs.org) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Database & Authentication**: [Firebase](https://firebase.google.com) (Firestore + Auth)
- **AI Integration**: [Google Gemini API](https://ai.google.dev)
- **Language**: TypeScript
- **Fonts**: Geist Sans & Geist Mono

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** version 18.x or higher ([Download here](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** ([Download here](https://git-scm.com))

## Team Member Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-college-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

Each team member needs their own Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" or use an existing project
3. Once created, click on the Web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Smart College Assistant - Dev")
5. Copy the Firebase configuration values (you'll need these in the next step)
6. Enable **Firestore Database**:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create Database"
   - Start in test mode (for development)
7. Enable **Authentication**:
   - Go to "Authentication" in the left sidebar
   - Click "Get Started"
   - Enable your preferred sign-in methods (Email/Password recommended)

### 4. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key (keep it secure!)

### 5. Create Environment Variables File

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Or create it manually with the following content:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

GEMINI_API_KEY=your_gemini_api_key
```

Replace all the `your_*` placeholders with your actual values from Firebase and Gemini.

**Important**: Never commit the `.env.local` file to Git! It's already in `.gitignore`.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The page will auto-reload when you make changes to the code.

## Project Structure

```
smart-college-assistant/
├── app/                      # Next.js app directory (pages & routes)
│   ├── attendance/          # Attendance tracking page
│   ├── quiz/                # Quiz page
│   ├── assistant/           # AI Assistant page
│   ├── classes/             # Classes management page
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   └── Navigation.tsx       # Navigation header component
├── src/
│   ├── lib/                 # Library configurations
│   │   ├── firebase.ts      # Firebase initialization
│   │   └── gemini.ts        # Gemini AI setup
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── .env.local              # Environment variables (not in Git)
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm start` - Run production server
- `npm run lint` - Run ESLint for code quality

## Contribution Guidelines

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/<feature-name>` - Feature branches
- `fix/<bug-name>` - Bug fix branches

### Workflow

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Add: your descriptive commit message"
   ```

3. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub
5. Wait for code review and approval
6. Merge into `develop`

### Commit Message Convention

- `Add:` - New feature
- `Update:` - Changes to existing feature
- `Fix:` - Bug fixes
- `Refactor:` - Code refactoring
- `Docs:` - Documentation changes
- `Style:` - Code style changes (formatting, etc.)

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused
- Use Tailwind CSS for styling

## Troubleshooting

### Common Issues

**Issue**: `Module not found` errors
- **Solution**: Run `npm install` to ensure all dependencies are installed

**Issue**: Firebase authentication not working
- **Solution**: Check that you've enabled the authentication method in Firebase Console

**Issue**: Gemini API errors
- **Solution**: Verify your API key is correct and has proper permissions

**Issue**: Environment variables not loading
- **Solution**: Restart the dev server after changing `.env.local`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information

## License

This project is created for educational purposes.

---

Built with ❤️ by the Smart College Assistant Team
