import { forwardRef } from 'react';

const Input = forwardRef(({
                              label,
                              error,
                              id,
                              type = 'text',
                              placeholder,
                              rightElement,
                              className = '',
                              ...props
                          }, ref) => {
    return (
        <div className="w-full mb-4">
            {label && (
                <label
                    htmlFor={id}
                    className="block mb-1.5 text-sm font-medium text-text-primary"
                >
                    {label}
                </label>
            )}

            {/* Bọc input trong div relative để định vị icon bên phải */}
            <div className="relative">
                <input
                    id={id}
                    ref={ref}
                    type={type}
                    placeholder={placeholder}
                    className={`
                        w-full px-4 py-2.5 bg-surface text-text-primary placeholder-text-muted 
                        border rounded-input outline-none transition-colors duration-200
                        focus:border-primary focus:ring-1 focus:ring-primary
                        disabled:bg-background disabled:text-text-muted disabled:cursor-not-allowed
                        ${rightElement ? 'pr-11' : ''}
                        ${error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border'}
                        ${className}
                    `}
                    {...props}
                />

                {/* Render nút con mắt (hoặc bất kỳ icon nào) nằm gọn bên phải */}
                {rightElement && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-danger animate-pulse">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
