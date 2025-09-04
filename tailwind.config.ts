import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontSize: {
				'base-elderly': ['20px', { lineHeight: '1.8' }],
				'lg-elderly': ['24px', { lineHeight: '1.8' }],
				'xl-elderly': ['28px', { lineHeight: '1.8' }],
				'2xl-elderly': ['32px', { lineHeight: '1.75' }],
				'3xl-elderly': ['36px', { lineHeight: '1.7' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
                recording: {
                    DEFAULT: 'hsl(var(--recording))',
                    glow: 'hsl(var(--recording-glow))'
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    glow: 'hsl(var(--success-glow))'
                },
                pause: 'hsl(var(--pause))',
                warm: {
                    50: 'hsl(25, 25%, 97%)',
                    100: 'hsl(25, 20%, 94%)',
                    200: 'hsl(25, 15%, 88%)',
                    300: 'hsl(25, 15%, 80%)',
                    400: 'hsl(25, 15%, 65%)',
                    500: 'hsl(25, 15%, 45%)',
                    600: 'hsl(25, 15%, 35%)',
                    700: 'hsl(25, 15%, 25%)',
                    800: 'hsl(25, 15%, 15%)',
                    900: 'hsl(25, 15%, 8%)',
                }
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'recording-pulse': {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: '0 0 30px hsl(var(--recording) / 0.4)'
					},
					'50%': {
						transform: 'scale(1.05)',
						boxShadow: '0 0 60px hsl(var(--recording-glow) / 0.8)'
					}
				},
                'breathe': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' }
                },
                'gentle-pulse': {
                    '0%, 100%': { 
                        transform: 'scale(1)',
                        boxShadow: '0 0 30px hsl(var(--recording) / 0.4)'
                    },
                    '50%': { 
                        transform: 'scale(1.02)',
                        boxShadow: '0 0 50px hsl(var(--recording-glow) / 0.6)'
                    }
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'recording-pulse': 'recording-pulse 2s ease-in-out infinite',
                'breathe': 'breathe 3s ease-in-out infinite',
                'gentle-pulse': 'gentle-pulse 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
