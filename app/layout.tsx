import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptMatch | See which pages match what you ask AI",
  description: "Private, opt-in prompt collection and page-to-prompt matching for ChatGPT, Gemini and Claude."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}