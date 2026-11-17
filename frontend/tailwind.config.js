
/** @type {import('tailwindcss').Config} */
export default {
    // Kích hoạt giao diện tối
    darkMode: 'class',
    // Khai báo những file được phép sử dụng class Tailwind
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
        extend: {

            // 1. BRAND COLORS
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    light: 'var(--color-primary-light)',
                    dark: 'var(--color-primary-dark)',
                    disabled: 'var(--color-primary-disabled)',
                },

                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',

                // 2. BACKGROUND & SURFACE
                background: 'var(--color-background)',

                surface: {
                    DEFAULT: 'var(--color-surface)',
                    secondary: 'var(--color-surface-secondary)',
                    hover: 'var(--color-surface-hover)',
                },

                // 3. TEXT COLORS
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    muted: 'var(--color-text-muted)',
                    inverse: 'var(--color-text-inverse)',
                },

                // 4. BORDER COLORS
                border: {
                    DEFAULT: 'var(--color-border)',
                    strong: 'var(--color-border-strong)',
                },

                // 5. SEMANTIC COLORS
                success: '#78936D',
                warning: '#C99A54',
                danger: '#C87968',
                info: '#8297A8',

                // 6. MOOD COLORS
                mood: {
                    happy: 'var(--color-mood-happy)',
                    calm: 'var(--color-mood-calm)',
                    anxious: 'var(--color-mood-anxious)',
                    sad: 'var(--color-mood-sad)',
                    angry: 'var(--color-mood-angry)',
                },
            },

            // 7. TYPOGRAPHY
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Lora', 'serif'],
            },

            // 8. BORDER RADIUS
            borderRadius: {
                card: '20px',
                button: '12px',
                input: '12px',
            },

            // 9. BOX SHADOW
            boxShadow: {
                card: 'var(--shadow-card)',
                soft: 'var(--shadow-soft)',
                elevated: 'var(--shadow-elevated)',
            },
        },
    },

    plugins: [],
}
