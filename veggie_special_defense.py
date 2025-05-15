from fpdf import FPDF
def safe_text(text):
    return (
        text.replace("–", "-")
            .replace("“", '"')
            .replace("”", '"')
            .replace("’", "'")
            .replace("•", "-")
            .replace("●", "-")
            .replace("•", "-")
            .replace("‒", "-")
            .replace("…", "...")
    )


class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "Project Defense Document", ln=True, align="C")

    def chapter_title(self, title):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, title, ln=True)
        self.ln(2)

    def chapter_body(self, body):
        self.set_font("Arial", "", 11)
        self.multi_cell(0, 10, body)
        self.ln()

pdf = PDF()
pdf.add_page()

sections = [
    ("Project Title", "Veggie Special - Responsive Web-Based Grocery Shopping Platform"),

    ("Developer", "Sahadatu Abdul Salam"),

    ("Technology Stack", 
     "Frontend: HTML5, CSS3, JavaScript\n"
     "Backend: Flask (Python)\n"
     "Database: SQLite for development, PostgreSQL for production\n"
     "Authentication: Flask-Login, Werkzeug (hashing), Session/JWT\n"
     "Hosting: Render.com"),

    ("Hosting and Deployment", 
     "The application is deployed using Render.com, which provides cloud hosting for both static and dynamic web apps. "
     "It supports automatic deployment from GitHub, enabling CI/CD workflows and secure HTTPS access."),

    ("Website URL", "https://veggie-special.onrender.com"),

    ("Project Overview", 
     "Veggie Special is a comprehensive and mobile-responsive online grocery shopping platform built to modernize the food retail experience. "
     "It offers a seamless interface for users to browse a wide variety of groceries, add products to a dynamic cart, manage their user account, and securely place orders using multiple payment methods. "
     "The platform mimics real-world e-commerce behavior and emphasizes user-centric design, secure data handling, and functional interactivity."),

    ("Objectives", 
     "- Deliver an intuitive user interface for streamlined grocery shopping.\n"
     "- Enable product discovery via category browsing and search filtering.\n"
     "- Implement user authentication and profile management with security best practices.\n"
     "- Offer multi-step checkout and flexible payment options (Credit Card, PayPal, Mobile Money).\n"
     "- Ensure accessibility and responsiveness across desktops, tablets, and smartphones."),

    ("Key Features", 
     "- **Homepage & UI Design**:\n"
     "  - Modern, clean interface with responsive layout.\n"
     "  - Hero banner, featured categories, customer testimonials, and blog/newsletter signup.\n"
     "  - Integrated product search and category filtering for fast navigation.\n\n"
     "- **User Management**:\n"
     "  - Secure registration, login/logout, and password handling.\n"
     "  - Dashboard for managing profile, order history, wishlist, and subscriptions.\n\n"
     "- **Shopping Experience**:\n"
     "  - Real-time cart modal with quantity updates and total calculations.\n"
     "  - Multi-step checkout (shipping, billing, payment confirmation).\n"
     "  - Integration with simulated payment gateways (Credit Card, PayPal, Mobile Money).\n\n"
     "- **Additional Modules**:\n"
     "  - Newsletter signup, location map for store visibility, and app download call-to-action."),

    ("Technology Breakdown", 
     "- Frontend:\n"
     "  - HTML5 & semantic structure for accessibility and SEO.\n"
     "  - Custom CSS with mobile-first design and responsive grid layout.\n"
     "  - Vanilla JavaScript for cart, modals, and checkout logic, using `script.js` and `products.js` to handle dynamic actions.\n\n"
     "- Backend:\n"
     "  - Flask routing for pages, sessions, and RESTful interactions.\n"
     "  - Database integration for users, products, and orders using SQLAlchemy.\n"
     "  - JWT/session management to protect authenticated routes.\n\n"
     "- **Security**:\n"
     "  - Password hashing with Werkzeug.\n"
     "  - JWT/session tokens for user authentication.\n"
     "  - HTTPS support via Render for secure transmission."),

    ("Challenges and Solutions", 
     "- **Responsive Design**:\n"
     "  - Mobile compatibility was fine-tuned with media queries and flexible layouts.\n\n"
     "- **Payment Logic**:\n"
     "  - Simulated validation of credit card, PayPal, and mobile money flows using robust form validation and placeholder gateway logic in JavaScript.\n\n"
     "- **Session & State Handling**:\n"
     "  - Used JavaScript to manage the cart state, and Flask for secure authentication and session handling across user interactions.\n\n"
     "- **Deployment Issues**:\n"
     "  - Resolved static asset loading issues on Render by configuring path handling and file management correctly."),

    ("Future Enhancements", 
     "- Implement real payment APIs (Stripe, Paystack, Momo).\n"
     "- Enable user-generated product reviews and ratings.\n"
     "- Add real-time order tracking and delivery integration.\n"
     "- Build an admin dashboard for inventory and analytics.\n"
     "- Introduce SMS/email order notifications and push alerts.\n"
     "- Expand to multilingual UI and WCAG accessibility compliance."),

    ("Conclusion", 
     "Veggie Special is a robust and scalable full-stack web application that simulates a professional online grocery store. "
     "It combines visual appeal, technical depth, and practical functionality in a way that demonstrates full-stack development proficiency. "
     "The platform lays a strong foundation for further enhancements and serves as an excellent portfolio project, highlighting the developer's ability to design, build, secure, and deploy production-grade web applications.")
]

for title, body in sections:
    pdf.chapter_title(safe_text(title))
    pdf.chapter_body(safe_text(body))

pdf.output("Veggie_Special_Project_Defense.pdf")
