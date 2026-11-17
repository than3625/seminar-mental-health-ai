
export const applyThemeToDOM = (selectedTheme) => {
    const root = document.documentElement;
    if (selectedTheme === 'dark') {
        root.classList.add('dark');
    } else if (selectedTheme === 'light') {
        root.classList.remove('dark');
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemPrefersDark);
    }
};

// Lấy theme đã lưu của riêng user nếu chưa có thì mặc định là 'light'
export const getUserTheme = (userId) => {
    if (!userId) return 'light';
    return localStorage.getItem(`theme_user_${userId}`) || 'light';
};

// Lưu theme cho riêng user và áp dụng ngay lập tức
export const saveAndApplyUserTheme = (userId, theme) => {
    if (userId) {
        localStorage.setItem(`theme_user_${userId}`, theme);
    }
    applyThemeToDOM(theme);
};

// Đưa giao diện về sáng mặc định
export const resetToDefaultTheme = () => {
    applyThemeToDOM('light');
};