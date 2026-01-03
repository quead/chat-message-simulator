# AI Context: Chat Message Simulator

This repo is a React + Vite app for building chat mockups and exporting them as images. The UI has an editor panel (messages/participants/settings/export) and a live preview panel that renders multiple chat layouts.

## What the app does
- Build a conversation with participants and messages.
- Render the conversation in a live preview using a selected layout/theme.
- Export the preview to PNG/JPEG at preset sizes.

## Key architecture
- Global state: `src/store/conversationStore.ts` (Zustand + persistence).
  - Holds conversation data, layout/theme, UI state, export settings.
- Layout config: `src/constants/layouts.ts`.
  - Defines supported layouts and their themes/colors/fonts.
- Layout render: `src/components/layout/ChatLayout.tsx`.
  - Applies CSS variables and renders header, conversation, input.

## Current supported layouts
- WhatsApp (light/dark).
- iMessage (light/dark).
- Snapchat (light/dark) with left-border message style.
- Messenger (light/dark).

Removed layouts: Telegram, Slack, Discord, Generic.

## Layout-specific behavior (important)
- Layout-specific styling is keyed off `layout.id` in:
  - `src/components/chat/ChatHeader.tsx`
  - `src/components/chat/MessageInput.tsx`
  - `src/components/chat/ConversationView.tsx`
  - `src/components/chat/MessageBubble.tsx`
- `ChatLayout` adds `layout-${id}` class + `data-layout` for CSS scoping.
- `src/index.css` has layout-scoped CSS (e.g. WhatsApp bubble tails).

## Editor behavior
- Conversation builder: `src/components/editor/ConversationBuilder.tsx`.
  - Inline "quick edit" expands under a message row.
  - Advanced fields can be toggled in `MessageForm`.
  - Add message form is collapsible and placed at the bottom.

## Mobile behavior
- Mobile uses a fixed bottom switch to toggle Edit/Live.
  - See `src/components/layout/MainLayout.tsx`.
  - Extra bottom padding is added for mobile so the switch does not overlap content.
- Toolbar "Panels" button removed; mobile uses the switch only.

## Fonts
- Live preview uses Roboto by default (imported in `src/index.css`).
- Layout configs can still specify fallback fonts.

## Export
- Export logic in `src/utils/export.ts`.
- Export panel in `src/components/export/ExportPanel.tsx`.

## File map (high signal)
- `src/store/conversationStore.ts`: state + persistence.
- `src/constants/layouts.ts`: layout/theme definitions.
- `src/components/layout/ChatLayout.tsx`: core preview renderer.
- `src/components/chat/*`: header, message list, input, bubbles.
- `src/components/editor/*`: message/participant editors.
- `src/components/layout/MainLayout.tsx`: page layout + mobile controls.

## Notes for changes
- Keep layout-specific styling scoped by `layout.id` checks or `layout-<id>` CSS.
- Avoid breaking non-target layouts when adjusting one layout.
- Prefer small, explicit UI changes over large refactors.
