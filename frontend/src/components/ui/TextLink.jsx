import { Link } from 'react-router-dom';

const TextLink = ({ to, children, className = '', ...props }) => {
    return (
        <Link
            to={to}
            className={`font-medium text-primary hover:text-primary-dark transition-colors underline-offset-4 hover:underline ${className}`}
            {...props}
        >
            {children}
        </Link>
    );
};

export default TextLink;
