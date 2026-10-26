import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type LegalDoc = "terms" | "privacy"

const LAST_UPDATED = "Last updated: 2026-01-03 | Version: 2026-01-03"

const documents: Record<
  LegalDoc,
  { title: string; description: string; sections: Array<{ heading: string; body: string[] }> }
> = {
  terms: {
    title: "Terms and Conditions",
    description: "By using this app, you agree to these terms.",
    sections: [
      {
        heading: "What this app does",
        body: [
          "This app lets you compose chat mockups, preview layouts, and export images. All processing happens in your browser.",
        ],
      },
      {
        heading: "Data handling and GDPR",
        body: [
          "We do not collect, store, or process personal data on our servers. Your edits and autosaves stay in your browser's local storage. You can delete them using Reset project or by clearing site data in your browser.",
          "We do not run analytics or tracking cookies. Because your content does not leave your device, there is no server-side data controller or processor for your content. If you contact us, we will only use your email to respond.",
        ],
      },
      {
        heading: "Third-party resources",
        body: [
          "The app may load fonts or user-provided remote images from third-party providers. Those providers may receive standard request data such as IP address and user agent. You can replace assets or block network requests if needed.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "You are responsible for the content you enter and export. Do not include sensitive data unless you are comfortable storing it locally. Only use content and assets you have the rights to use.",
        ],
      },
      {
        heading: "No warranties",
        body: [
          'The app is provided "as is" and "as available" without any warranties, express or implied, including accuracy, reliability, availability, or fitness for a particular purpose. Use the app at your own risk.',
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or business interruption. Our total liability is limited to the amount you paid for the app, which is zero.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by the laws of Romania. Any disputes are subject to the exclusive jurisdiction of the courts in Romania.",
        ],
      },
      {
        heading: "Contact",
        body: ["Questions about these terms or GDPR? Email: queadx@gmail.com"],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms from time to time. Continued use means you accept the updated terms.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "This policy explains how data is handled in the app.",
    sections: [
      {
        heading: "Data we collect",
        body: [
          "We do not collect or store your chat content on our servers. Everything you create stays on your device.",
        ],
      },
      {
        heading: "Local storage",
        body: [
          "The app uses your browser's local storage to keep autosaves and settings. You can remove this data with Reset project or by clearing site data in your browser.",
        ],
      },
      {
        heading: "Third-party requests",
        body: [
          "Fonts and user-provided remote images may be loaded from third-party services. Those providers may receive standard request data such as IP address and user agent. You can block or replace these resources if needed.",
        ],
      },
      {
        heading: "GDPR readiness",
        body: [
          "Because your content does not leave your device, there is no server-side processing of personal data for the app. If you contact us, we only use your email to respond and do not share it.",
        ],
      },
      {
        heading: "Contact",
        body: ["Privacy questions? Email: queadx@gmail.com"],
      },
      {
        heading: "Changes",
        body: [
          "We may update this policy from time to time. Continued use means you accept the updated policy.",
        ],
      },
    ],
  },
}

interface LegalDialogProps {
  doc: LegalDoc | null
  onClose: () => void
}

export const LegalDialog = ({ doc, onClose }: LegalDialogProps) => {
  const content = doc ? documents[doc] : null
  return (
    <Dialog open={Boolean(doc)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        {content ? (
          <>
            <DialogHeader>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>{content.description}</DialogDescription>
              <div className="text-xs text-slate-400">{LAST_UPDATED}</div>
            </DialogHeader>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              {content.sections.map((section) => (
                <section key={section.heading} className="space-y-1.5">
                  <h3 className="font-semibold text-slate-900">{section.heading}</h3>
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
