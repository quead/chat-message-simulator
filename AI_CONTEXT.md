# AI Context: Chat Message Simulator

React + Vite app for building chat mockups and exporting them as images. The UI is a full-height workspace: a header, an editor sidebar (Messages / People / Style / Export tabs), and a live preview canvas.

## What the app does
- Build a conversation with participants and messages (composer, drag-and-drop list, or Script mode).
- Render it in a live preview using a selected app layout and theme.
- Export the preview to PNG/JPEG: current view, one tall full-chat image, or screen-by-screen.

## Key architecture
- Global state: `src/store/conversationStore.ts` (Zustand + persist to localStorage).
  - Conversation, layout/theme, background, export settings, UI state, undo history (50 steps).
  - `pushHistory(state, coalesceKey)` merges rapid edits (typing, sliders) into one undo step.
  - Autosave goes through `autosaveStorage`; quota errors surface via `useSaveStatus` + a toast.
- Toasts: `src/store/toastStore.ts` (`toast(message, tone, action?)`), rendered by `components/ui/toaster.tsx`.
- File actions: `src/store/fileActions.ts` (import JSON, dropped images to image messages, `undoAction`).
- Preview + export: `src/hooks/useChatPreview.ts` owns preview DOM refs, fit/zoom, conversation metrics, and runs exports. `MainLayout` passes it to `PreviewPane` and `ExportPanel`.
- Image export: `src/utils/export.ts`. It embeds the Roboto webfont itself via `fontEmbedCSS` (html-to-image's own font discovery crashes in some Firefox builds, issue #5).
- Layout config: `src/constants/layouts.ts`. Render: `src/components/layout/ChatLayout.tsx`.

## Current supported layouts
WhatsApp, iMessage, Snapchat, Messenger, Instagram, Tinder (each light/dark).

## Layout-specific behavior (important)
- Layouts are being brought to their 2026 designs one app at a time. Updated apps get their own module and the
  generic `ChatHeader` / `MessageInput` / `MessageBubble` delegate to it early:
  - WhatsApp: `src/components/chat/WhatsAppChat.tsx` (iOS 26.35 "Liquid Glass": transparent header, floating
    composer, glass controls, bubble tails on the last message of a run, frameless media, "Today"/"Yesterday" chips).
- `LayoutConfig.floatingChrome` ({ top, bottom } px) makes header/composer overlay the conversation; content is padded
  via `--chat-inset-top/bottom`, and screen-by-screen export overlaps pages by those insets.
- No `backdrop-filter` in chat mocks: html-to-image can't render it. Glass = translucent fill + hairline.
- Remaining apps still use the `layout.id` ternaries in `src/components/chat/*`.
- `ChatLayout` adds `layout-${id}` class + `data-layout` for CSS scoping; `src/index.css` has layout-scoped CSS.
- "You" is the active participant (`getSelfParticipantId` in `utils/helpers.ts`), in direct and group chats.

## Editor behavior
- `components/editor/ConversationBuilder.tsx`: dnd-kit sortable list (pointer + keyboard, drag handle, DragOverlay), row menu, inline `MessageForm` editing, Script mode, conversation menu.
- `components/editor/MessageComposer.tsx`: pinned composer; Enter adds, Ctrl+Enter adds and switches sender, paste/drop/attach images, timestamps default to 1 min after the last message.
- `hooks/useFileDrop.ts`: file drop targets. Nested targets (composer, avatars, wallpaper) stop propagation; the app root handles everything else.
- Uploaded images are re-encoded/downscaled (`readImageFile`) to keep localStorage autosave small.

## Import safety
- `utils/storage.ts` `parseConversation` validates imported JSON (drops malformed entries, only allows `data:image/` or http(s) image URLs).

## Mobile behavior
- Header has an Edit/Preview switch (`ui.activeView`); small screens start in Preview.

## Deployment
- `.github/workflows/deploy.yml`: on push to `main`, lint + build, then publish `dist/` to `quead/quead.github.io@master` using the `PAGES_DEPLOY_KEY` secret.

## Editor UI style
- Monochrome (black/white/slate), subtle radii (`--radius: 0.5rem`), no shadows or glow rings, no purple.
  The device preview frame is square. Keep this when adding UI.

## Notes for changes
- Keep layout-specific styling scoped by `layout.id` checks or `layout-<id>` CSS.
- Avoid breaking non-target layouts when adjusting one layout.
- No test suite by design: verify with `yarn lint`, `yarn build`, and the running app.
