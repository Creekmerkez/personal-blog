# Personal Blog

A modern, responsive personal blog built with React and Vite.

## Features
- Video banner header
- Instagram feed integration
- Responsive design
- Pastel and beige color scheme

## Tech Stack
- React
- Vite
- CSS3

## Project Structure
```
personal-blog/
├── public/
│   └── videos/
│       └── banner.mp4
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── AboutMe.jsx
│   │   ├── AboutMe.css
│   │   ├── InstagramFeed.jsx
│   │   └── InstagramFeed.css
│   ├── App.jsx
│   └── App.css
├── package.json
└── README.md
```

## Setup Instructions

1. Clone the repository:
```bash
git clone [your-repository-url]
cd personal-blog
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Development
- Development server runs on `http://localhost:5173`
- Hot Module Replacement (HMR) is enabled
- ESLint and Prettier are configured for code formatting

## Deployment
1. Build the project:
```bash
npm run build
```

2. The built files will be in the `dist` directory
3. Deploy the contents of the `dist` directory to your hosting service

## Notes
- Video file should be optimized for web (under 10MB recommended)
- Instagram feed currently uses placeholder images
- Future plans include Instagram API integration
