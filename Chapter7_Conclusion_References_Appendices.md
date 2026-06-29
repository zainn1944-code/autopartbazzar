# 7.1 Summary of the Project

The **Auto Part Bazar** system was developed to provide a modern online marketplace for automotive parts combined with an interactive 3D car visualization and AI-assisted customization experience. The system uses **Three.js** for real-time 3D car rendering, **React.js (Vite)** for the frontend, **FastAPI (Python)** for the backend, and **PostgreSQL** for the database. Key features include JWT-based authentication, product catalog and search, shopping cart and checkout, AI-powered car modification recommendations, a 3D car garage with GLB models, saved builds, order tracking, and an admin dashboard for catalog and order management.

# 7.2 Achievements vs Objectives

All major project objectives were successfully achieved including secure user authentication and password reset via OTP email, browseable parts catalog with detailed product pages, cart and checkout flow with order confirmation, interactive 3D car viewer with part customization, AI mod panel that suggests compatible upgrades, saved builds for returning users, role-based admin dashboard, and persistent order history per user.

# 7.3 Limitations

3D rendering performance depends on the user's GPU and may lag on low-end devices. The AI recommendation engine relies on a limited training set of car models (Honda Civic, Toyota Corolla, Toyota Hilux) and may not generalize to all vehicle variants. The system requires a stable internet connection to load GLB models and stream catalog data. Local image storage is used when AWS S3 is not configured, which is unsuitable for production scale. Payment integration is currently simulated rather than connected to a live gateway, and shipment tracking depends on manual admin status updates.

# 7.4 Suggestions for Future Work

Future improvements include integrating real payment gateways (Stripe, PayPal, JazzCash), expanding the 3D model library to cover more makes and models, adding AR-based "view in your driveway" previews on mobile, integrating a recommendation engine trained on real purchase data, adding a vendor/seller portal so third parties can list parts, implementing live chat support, multi-language and multi-currency support, a mobile application built with React Native, and a detailed analytics dashboard for sales trends and inventory forecasting.

# REFERENCES

i. Khan, A., & Ahmed, R. (2023). "E-Commerce Platforms for Automotive Aftermarket Parts: A Review," *International Journal of Web Engineering and Technology*, vol. 18, no. 2, pp. 112–129.

ii. React Documentation. (2024). Available: https://react.dev/

iii. FastAPI Documentation. (2024). Available: https://fastapi.tiangolo.com/

iv. PostgreSQL Documentation. (2024). Available: https://www.postgresql.org/docs/

v. Three.js Documentation. (2024). Available: https://threejs.org/docs/

vi. SQLAlchemy Documentation. (2024). Available: https://docs.sqlalchemy.org/

vii. Tailwind CSS Documentation. (2024). Available: https://tailwindcss.com/docs

---

**56**

---

# APPENDICES

## Appendix A: User Manual

**For Customers:** Sign up or log in → Browse products by category → View product details → Add items to cart → Proceed to checkout → Enter shipping details → Place order → Track order status from profile page. Customers can also open the **3D Garage**, select a car model, use the **AI Mod Panel** to get part recommendations, customize the car visually, and save the build for later.

**For Admins:** Log in to the admin dashboard → Add, edit, or remove products → Manage car models and GLB assets → View and update order statuses → Manage registered users → Monitor sales reports → Approve or remove user-submitted reviews.

**For Guests:** Browse the catalog and view 3D car models without logging in → Sign up required only when adding items to cart, saving builds, or placing orders.

## Appendix B: Installation Instructions

Install **Python 3.8+**, **Node.js 16+**, and **PostgreSQL**. Clone the repository, then from the project root run `npm run setup` to install backend and frontend dependencies and create `backend/.env`. Configure `DATABASE_URL` in `backend/.env`, then run `npm run migrate:backend` to apply Alembic migrations. Start the backend with `npm run dev:backend` and the frontend with `npm run dev:frontend`. The frontend runs at `http://localhost:5173` and the backend at `http://127.0.0.1:8000`.

## Appendix C: Database Schema

Main tables: **User**, **Product**, **Category**, **Cart**, **CartItem**, **Order**, **OrderItem**, **CarModel**, **SavedBuild**, **AIRecommendationEvent**, and **Review** — with appropriate relationships and foreign keys linking users to their carts, orders, saved builds, and AI interaction history.
