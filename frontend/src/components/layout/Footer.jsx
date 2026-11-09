import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-primary-dark text-text-inverse py-12 px-8 md:px-16">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Cột 1: Brand Info */}
                <div className="col-span-1 md:col-span-2">
                    <h2 className="font-heading text-2xl font-bold mb-4">MindContext</h2>
                    <p className="text-primary-light max-w-sm leading-relaxed">
                        Your mindful companion for navigating thoughts, understanding emotions, and building a healthier context for your mind.
                    </p>
                </div>

                {/* Cột 2: Quick Links */}
                <div>
                    <h3 className="font-semibold text-lg mb-4 text-surface">Quick Links</h3>
                    <ul className="space-y-2">
                        <li><Link to="/features" className="text-primary-light hover:text-surface transition">Features</Link></li>
                        <li><Link to="/about" className="text-primary-light hover:text-surface transition">About Us</Link></li>
                        <li><Link to="/privacy" className="text-primary-light hover:text-surface transition">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Cột 3: Contact */}
                <div>
                    <h3 className="font-semibold text-lg mb-4 text-surface">Connect</h3>
                    <ul className="space-y-2">
                        <li><a href="mailto:hello@mindcontext.com" className="text-primary-light hover:text-surface transition">hello@mindcontext.com</a></li>
                        <li><span className="text-primary-light">Ho Chi Minh City, VN</span></li>
                    </ul>
                </div>

            </div>

            {/* Dòng Copyright */}
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-primary text-center text-primary-light text-sm">
                © {new Date().getFullYear()} MindContext. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
