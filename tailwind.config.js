const { hairlineWidth } = require("nativewind/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			fontFamily: {
				baloo: ["Baloo"],
			},
			colors: {
				border: "#0395ff",
				input: "hsl(var(--input))",
				ring: "#0395ff",
				background: "#fffbf3",
				foreground: "#0D3311",
				primary: {
					DEFAULT: "#ff78e5",
					foreground: "#ff78e5",
				},
				secondary: {
					DEFAULT: "#ceef32",
					foreground: "#ceef32",
				},
				destructive: {
					DEFAULT: "#ff2d01",
					foreground: "#ff2d01",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderWidth: {
				hairline: hairlineWidth(),
			},
		},
	},
	plugins: [],
};
