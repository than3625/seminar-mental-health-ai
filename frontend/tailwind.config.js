
/** @type {import('tailwindcss').Config} */
export default {
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
                    DEFAULT: '#829B75',
                    light: '#A9B99C',
                    dark: '#657D5B',
                    disabled: '#D5DDCF',
                },

                secondary: '#D9C69A',
                accent: '#EBCBB8',

                // 2. BACKGROUND & SURFACE
                background: '#F6F1E7',

                surface: {
                    DEFAULT: '#FFFCF6',
                    secondary: '#EFE7D6',
                    hover: '#F5EEDB',
                },

                // 3. TEXT COLORS
                text: {
                    primary: '#3D352B',
                    secondary: '#82786B',
                    muted: '#A69B8B',
                    inverse: '#FFFCF6',
                },

                // 4. BORDER COLORS
                border: {
                    DEFAULT: '#E5D9C5',
                    strong: '#D8CCB8',
                },

                // 5. SEMANTIC COLORS
                success: '#78936D',
                warning: '#C99A54',
                danger: '#C87968',
                info: '#8297A8',

                // 6. MOOD COLORS
                mood: {
                    happy: '#F3D994',
                    calm: '#B5C6A8',
                    anxious: '#B6C1D5',
                    sad: '#C5CFD9',
                    angry: '#E5B5A6',
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
                card: '0 2px 5px rgba(61, 53, 43, 0.10)',
                soft: '0 4px 12px rgba(61, 53, 43, 0.06)',
                elevated: '0 8px 24px rgba(61, 53, 43, 0.12)',
            },
        },
    },

    plugins: [],
}
