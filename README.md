# ♟️ Chess AI

A modern, intelligent chess application built with Next.js that allows you to play against powerful AI opponents. Challenge yourself against multiple AI models ranging from beginner-friendly to grandmaster-level engines.

![Chess AI Demo](https://chess.avikmukherjee.me/Chess.png)

## ✨ Features

### 🎮 Gameplay
- **Interactive Chess Board**: Drag-and-drop or click-to-move pieces
- **Real-time Game Status**: Live updates on check, checkmate, and draw conditions
- **Move History**: Complete game record with algebraic notation
- **Game Statistics**: Track moves, game time, and current turn
- **Multiple Color Options**: Play as white or black pieces

### 🤖 AI Opponents
- **Stockfish 17**: Professional chess engine with adjustable difficulty
  - Grandmaster (~2750 ELO)
  - Master (~2600 ELO)
  - Expert (~2350 ELO)
  - Advanced (~2000 ELO)
- **Large Language Models**:
  - Llama 3.3 70B (Most Advanced)
  - Llama 3.1 70B (Balanced)
  - Mixtral 8x7B (Fast)
  - Gemini 1.5 Pro (Strategic)
  - Gemini 1.5 Flash (Quick)

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Elegant dark interface with smooth animations
- **Real-time Notifications**: Toast messages for moves and game events
- **Game Settings**: Customizable player names and AI model selection
- **Mobile Sidebar**: Collapsible game information panel

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Shadcn UI](https://ui.shadcn.com/)** - Components that are ready to use.

### Chess Engine
- **[Chess.js](https://github.com/jhlywa/chess.js)** - Chess game logic
- **[React Chessboard](https://github.com/Clariity/react-chessboard)** - Interactive board component

### AI Integration
- **[Vercel AI SDK](https://sdk.vercel.ai/)** - AI model integration
- **[Groq](https://groq.com/)** - Fast LLM inference
- **[Google Generative AI](https://ai.google.dev/)** - Gemini models
- **[Stockfish API](https://chess-api.com/)** - Professional chess engine

### UI Components
- **[Lucide React](https://lucide.dev/)** - Beautiful icons
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Next Themes](https://github.com/pacocoursey/next-themes)** - Theme management

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **npm**, **yarn**, **pnpm**, or **bun**
- API keys for AI services (optional for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avik-creator/chess.git
   cd chess
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Add your API keys to `.env.local`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Starting a Game
1. Enter your name in the settings modal
2. Choose your piece color (white or black)
3. Select an AI model opponent
4. Click "Start Game" to begin

### Making Moves
- **Drag & Drop**: Click and drag pieces to move them
- **Click to Move**: Click a piece, then click the destination square
- **Legal Moves**: Highlighted squares show available moves

### Game Features
- **New Game**: Reset the board and start fresh
- **Settings**: Change player name, color, or AI model
- **Move History**: View all moves in algebraic notation
- **Game Stats**: Monitor time played and move count

## 🔧 API Configuration

### Groq API
1. Sign up at [Groq Console](https://console.groq.com/)
2. Create an API key
3. Add to your `.env.local` file

### Google Generative AI
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Generate an API key
3. Add to your `.env.local` file

### Stockfish API
- Uses the free [Chess API](https://chess-api.com/)
- No API key required
- Rate limits may apply

## 📁 Project Structure

```
chess/
├── src/
│   ├── app/
│   │   ├── api/move/          # AI move generation endpoint
│   │   ├── game/              # Main game page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── chessBoard.tsx     # Chess board component
│   │   ├── gameStatus.tsx     # Game status display
│   │   └── themeProvider.tsx  # Theme context
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                    # Static assets
├── .env.local                 # Environment variables
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Customization

### Themes
The app uses a dark theme by default. Modify `globals.css` to customize colors:

```css
:root {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  /* Add your custom colors */
}
```

### Chess Board
Customize the board appearance in `chessBoard.tsx`:

```typescript
const chessboardOptions = {
  customDarkSquareStyle: { backgroundColor: "#779556" },
  customLightSquareStyle: { backgroundColor: "#eeeed2" },
  // Add more customizations
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write descriptive commit messages

## 📝 License

This project is free to use but not for commercial purposes.

## 🙏 Acknowledgments

- **Stockfish** - The world's strongest chess engine
- **Chess.js** - Comprehensive chess library
- **React Chessboard** - Beautiful React chess component
- **Vercel** - Hosting and deployment platform
- **OpenAI & Anthropic** - AI model inspiration

## 📞 Support

If you have any questions or need help:

- 📧 Email: avikm744@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/Avik-creator/chess/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Avik-creator/chess/discussions)

---

**Made with ♟️ and ⚡ by [Avik Mukherjee](https://github.com/Avik-creator)**
