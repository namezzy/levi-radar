import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060b14",
        "sidebar-bg": "#040810",
        "card-bg": "#0d1a2d",
        "card-inner": "#0f1f35",
        "border-line": "#142540",
        primary: "#06b6d4",
        success: "#34d399",
        warning: "#fb923c",
        danger: "#ef4444",
        "text-primary": "#f1f5f9",
        "text-secondary": "#94a3b8",
        "text-muted": "#475569",
        "text-label": "#64748b",
        "source-wechat": "#22c55e",
        "source-feishu": "#3b82f6",
        "source-telegram": "#8b5cf6",
        "source-discord": "#6366f1",
      },
    },
  },
  plugins: [],
};
export default config;
