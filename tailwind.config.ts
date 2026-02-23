// tailwind.config.ts
import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  plugins: [animate],
}

export default config
