export type LayoutId =
  | "whatsapp"
  | "imessage"
  | "snapchat"
  | "messenger"
  | "instagram"
  | "tinder"

export type ThemeId = "light" | "dark"

export interface LayoutColors {
  background: string
  surface: string
  header: string
  headerText: string
  bubbleSent: string
  bubbleSentText: string
  bubbleReceived: string
  bubbleReceivedText: string
  input: string
  inputText: string
  accent: string
  muted: string
  border: string
}

export interface LayoutTheme {
  id: ThemeId
  name: string
  colors: LayoutColors
  pattern?: string
}

export interface LayoutConfig {
  id: LayoutId
  name: string
  bubbleStyle: "rounded" | "sharp" | "minimal"
  headerStyle: "compact" | "full"
  fonts: {
    header: string
    body: string
  }
  radius: string
  showAvatars: boolean
  showStatus: boolean
  themes: LayoutTheme[]
}
