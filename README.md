# 🌟 Luxury Portfolio Website

A modern, elegant, and fully responsive portfolio website built with React, TypeScript, and cutting-edge web technologies. This project showcases a premium design with smooth animations, interactive components, and a beautiful user experience.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://github.com/CemRoot/My-Site)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-purple)](https://vitejs.dev/)

## 🎨 Design

Original design available at: [Figma - Luxury Portfolio Website](https://www.figma.com/design/2Lk7wD8DkvjHFE2FiGZ4T0/Luxury-Portfolio-Website)

## ✨ Features

- 🎯 **Modern UI/UX** - Clean and elegant design with attention to detail
- 📱 **Fully Responsive** - Optimized for all devices (mobile, tablet, desktop)
- 🎭 **Smooth Animations** - GSAP-powered animations for engaging user experience
- 🌓 **Dark Mode** - Theme switching support with next-themes
- 🧩 **Component Library** - Comprehensive UI components built with Radix UI
- 💬 **Chat Widget** - Interactive chat functionality
- 📊 **Stats & Analytics** - Dynamic statistics display
- 🎨 **Hero Lightpass** - Beautiful hero section with lighting effects
- 📧 **Contact Form** - Integrated contact section
- 💼 **Experience & Projects** - Showcase your work and achievements
- 🛠️ **Skills Display** - Visual representation of your expertise
- 📄 **CV Section** - Downloadable resume/CV functionality

## 🛠️ Tech Stack

### Core
- **React 18.3.1** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite 6.3.5** - Lightning-fast build tool

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon set
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Efficient className management

### Animations & Interactions
- **GSAP** - Professional-grade animations
- **Embla Carousel** - Smooth carousels
- **Sonner** - Toast notifications

### Forms & Validation
- **React Hook Form** - Performant form management
- **React Day Picker** - Date selection

### Other Libraries
- **next-themes** - Theme management
- **cmdk** - Command palette
- **Recharts** - Data visualization

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CemRoot/My-Site.git
cd My-Site
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production

```bash
npm run build
```

The optimized production build will be available in the `dist/` directory.

## 📁 Project Structure

```
My-Site/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── figma/          # Figma-specific components
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── CV.tsx
│   │   ├── Experience.tsx
│   │   ├── Hero.tsx
│   │   ├── Projects.tsx
│   │   ├── Services.tsx
│   │   ├── Skills.tsx
│   │   └── ...
│   ├── lib/                # Utilities and helpers
│   │   ├── constants/      # App constants
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── styles/             # Global styles
│   ├── assets/             # Images and static files
│   ├── App.tsx             # Main App component
│   └── main.tsx            # Entry point
├── public/                 # Public assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies and scripts
```

## 🎯 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |

## 🎨 Customization

### Colors & Theming
- Modify theme settings in `src/styles/globals.css`
- Customize components in `src/components/ui/`

### Content
- Update personal information in `src/lib/constants/personal.ts`
- Modify contact details in `src/lib/constants/contact.ts`
- Adjust services in `src/lib/constants/services.ts`
- Update skills in `src/lib/constants/skills.ts`

## 📝 Guidelines

Development guidelines and best practices can be found in `src/guidelines/Guidelines.md`

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is private and proprietary.

## 👤 Author

**Dr. Sam**

- GitHub: [@CemRoot](https://github.com/CemRoot)

## 🙏 Acknowledgments

- Design inspiration from the Figma community
- UI components built with Radix UI
- Icons by Lucide

---

Made with ❤️ using React and TypeScript