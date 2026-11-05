import { Link } from 'react-router-dom';
import { FiLoader } from 'react-icons/fi';

const Button = ({
                    children,
                    variant = 'primary',
                    size = 'md',
                    isLoading = false,
                    disabled = false,
                    to = null,
                    className = '',
                    ...props
                }) => {
    // 1. Class nền tảng chung cho mọi nút
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-button transition-colors duration-200 focus:outline-none";

    // 2. Class theo kích thước
    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-base",
        lg: "px-6 py-3 text-lg",
    };

    // 3. Class theo loại nút
    const variantClasses = {
        primary: "bg-primary text-text-inverse hover:bg-primary-dark active:bg-primary-dark disabled:bg-[#D5DDCF] disabled:text-text-secondary",
        secondary: "bg-secondary text-text-primary hover:bg-[#c9b587] disabled:opacity-50",
        danger: "bg-danger text-text-inverse hover:bg-[#b06656] disabled:opacity-50",
        ghost: "bg-transparent text-text-primary hover:bg-surface-hover disabled:opacity-50",
    };

    // Gom tất cả class lại
    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${disabled || isLoading ? 'cursor-not-allowed' : ''}`;

    // Nội dung bên trong nút (xử lý khi có loading)
    const buttonContent = (
        <>
            {isLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </>
    );

    // Nếu có prop 'to', render ra thẻ Link của React Router
    if (to) {
        return (
            <Link to={to} className={combinedClasses} {...props}>
                {buttonContent}
            </Link>
        );
    }

    // Mặc định render ra thẻ button
    return (
        <button
            disabled={disabled || isLoading}
            className={combinedClasses}
            {...props}
        >
            {buttonContent}
        </button>
    );
};

export default Button;
