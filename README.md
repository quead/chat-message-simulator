# 💬 Chat Message Simulator

> A powerful React application for creating, customizing, and exporting high-quality chat conversation mockups.

## 🌐 Live Demo

**[Try it now at https://quead.github.io/](https://quead.github.io/)**

## ✨ Features

- **🎨 Multiple Layouts**: Authentic recreations of popular messaging apps including WhatsApp, iMessage, Snapchat, and Messenger.
- **🌓 Light & Dark Modes**: Full support for light and dark themes across all layouts.
- **⚡ Live Preview**: Real-time rendering of your conversation as you build it.
- **🖼️ High-Quality Export**: Download your creations as PNG or JPEG images with custom scaling.
- **👥 Participant Management**: Add multiple users with custom avatars and names.
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices.
- **🖱️ Drag & Drop**: Reorder messages easily (powered by dnd-kit).

## 📱 Supported Platforms

| Platform | Light Mode | Dark Mode |
|----------|------------|-----------|
| **WhatsApp** | ✅ | ✅ |
| **iMessage** | ✅ | ✅ |
| **Messenger** | ✅ | ✅ |
| **Snapchat** | ✅ | ✅ |

## 🛠️ Tech Stack

Built with modern web technologies for performance and developer experience:

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Export**: [html-to-image](https://github.com/bubkoo/html-to-image)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-message-simulator.git
   cd chat-message-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

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
├── layouts/           # Platform-specific layout wrappers
├── store/             # Global state (Zustand)
└── utils/             # Helper functions
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
