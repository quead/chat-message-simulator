# 💬 Chat Message Simulator

> A powerful React application for creating, customizing, and exporting high-quality chat conversation mockups.

## 🌐 Live Demo

**[Try it now at https://quead.github.io/](https://quead.github.io/)**

## ✨ Features

- **🎨 Multiple Layouts**: Authentic recreations of popular messaging apps including WhatsApp, iMessage, Snapchat, Facebook Messenger, Instagram, and Tinder.
- **🌓 Light & Dark Modes**: Full support for light and dark themes across all layouts.
- **⚡ Live Preview**: Real-time rendering of your conversation as you build it.
- **💬 Chat-style Composer**: Type messages like in a real chat. `Enter` adds, `Ctrl+Enter` adds and switches sender, paste or attach images.
- **📝 Script Mode**: Write or paste a whole conversation as text (`<` for you, `>` for them).
- **🖱️ Drag & Drop**: Reorder messages with mouse, touch, or keyboard; drop images anywhere to add them as messages; drop a `.json` export to open it; drop images on avatars or the wallpaper.
- **🖼️ High-Quality Export**: PNG or JPEG at 1x–3x, as the current view, one tall image of the full chat, or screen-by-screen screenshots.
- **👥 Participant Management**: Avatars, verified badges, presence status, colors, and group chats.
- **↩️ Undo Everything**: 50-step undo/redo (`Ctrl+Z` / `Ctrl+Shift+Z`) plus one-click undo after destructive actions.
- **💾 Autosave**: Work is saved in your browser; save and open conversations as JSON.
- **📱 Responsive Design**: Works on desktop and mobile devices.

## 📱 Supported Platforms

| Platform | Light Mode | Dark Mode |
|----------|------------|-----------|
| **WhatsApp** | ✅ | ✅ |
| **iMessage** | ✅ | ✅ |
| **Facebook Messenger** | ✅ | ✅ |
| **Snapchat** | ✅ | ✅ |
| **Tinder** | ✅ | ✅ |
| **Instagram** | ✅ | ✅ |

## 🛠️ Tech Stack

Built with modern web technologies for performance and developer experience:

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)
- **Export**: [html-to-image](https://github.com/bubkoo/html-to-image)

## 🚀 Getting Started

### Prerequisites

- Node.js 24 (what CI uses; 20.19+ works with Vite 8)
- Yarn 1 (the repo ships a `yarn.lock`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/quead/chat-message-simulator.git
   cd chat-message-simulator
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

Before pushing, run `yarn lint` and `yarn build` (CI runs both).

## 🚢 Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it lints, builds, and publishes `dist/` to the `master` branch of [quead/quead.github.io](https://github.com/quead/quead.github.io), which GitHub Pages serves at https://quead.github.io/. Pull requests run the same lint and build without deploying, and the workflow can also be started by hand from the Actions tab.

The push uses the `PAGES_DEPLOY_KEY` repository secret: the private half of a write-enabled deploy key registered on `quead/quead.github.io`. To rotate it:

```bash
ssh-keygen -t ed25519 -N "" -f deploy_key
gh repo deploy-key add deploy_key.pub -R quead/quead.github.io --allow-write --title "chat-message-simulator Actions deploy"
gh secret set PAGES_DEPLOY_KEY -R quead/chat-message-simulator < deploy_key
rm deploy_key deploy_key.pub
```

## 📂 Project Structure

```
src/
├── components/
│   ├── chat/          # Chat visualization components
│   ├── editor/        # Editor interface components
│   ├── export/        # Export functionality
│   ├── layout/        # App layout and navigation
│   └── ui/            # Reusable UI components (Radix + Tailwind)
├── constants/         # Layout definitions and presets
├── hooks/             # Preview measuring/export and file drop hooks
├── store/             # Global state (Zustand), toasts, file import actions
└── utils/             # Helpers, image export, JSON import validation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 License - see the LICENSE file for details.
