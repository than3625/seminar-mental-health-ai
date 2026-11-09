import { Link } from 'react-router-dom';
import { FiWind } from 'react-icons/fi';
import Button from "../ui/Button.jsx";
import bookLogo from "../../assets/book.svg";
import bookFlower from "../../assets/book-flower.svg"

const Header = () => {
    return (
        <header className="h-20 bg-background border-b border-border flex items-center justify-between px-8 md:px-16 sticky top-0 z-50 shadow-soft">
            <Link to="/" className="flex items-center cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-text-inverse mr-2">
                    <img src={bookFlower}
                         alt="Book Logo"
                         className="w-8 h-8"/>
                </div>
                <h1 className="font-heading text-2xl font-bold text-text-primary">
                    MindContext
                </h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
                <Link to="/features" className="text-text-primary hover:text-primary font-medium transition">Features</Link>
                <Link to="/about" className="text-text-primary hover:text-primary font-medium transition">Our Story</Link>
                <Link to="/contact" className="text-text-primary hover:text-primary font-medium transition">Contact</Link>
            </nav>

            <div className="flex items-center space-x-4">
                <Button to="/login" variant="ghost">
                    Đăng nhập
                </Button>

                <Button to="/register" variant="primary">
                    Đăng ký
                </Button>

            </div>
        </header>
    );
};

export default Header;
