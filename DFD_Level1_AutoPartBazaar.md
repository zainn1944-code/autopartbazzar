# AutoPart Bazaar - DFD Level 1 (Process Decomposition)

## Overall Purpose
Level-1 DFD breaks AutoPart Bazaar into major processes and shows how data moves between customers, processes, and databases.

---

## Customer Processes

### **P1: Authenticate User**
- Verifies login credentials (email, password) of customer or guest
- Checks data from User Database
- Validates JWT token and silent refresh mechanism
- Grants or denies system access
- Returns authentication response

### **P2: Browse & View Products**
- Retrieves product catalog from Product Database
- Displays products with filters (category, price, brand, car model)
- Shows product details (images, specs, price, ratings)
- Manages search and navigation
- Returns filtered product list to customer

### **P3: Manage Cart & Wishlist (Activity Monitoring)**
- Monitors customer activity (add to cart, remove items, update quantity)
- Stores cart state in localStorage and database
- Detects abandoned cart scenarios
- Tracks wishlist items
- Stores activity logs in Session/Activity Log
- Sends notifications for price changes on wishlist items

### **P4: Process Checkout & Orders**
- Collects order details (shipping address, payment info)
- Validates cart items against inventory
- Calculates total price, taxes, shipping charges
- Creates order record in Order Database
- Generates order confirmation
- Returns order confirmation and tracking details

### **P5: View Garage & AI Recommendations**
- Retrieves saved car customizations from Car Models Database
- Displays garage (saved cars and their configurations)
- Sends car details to OpenRouter Gemma API
- Receives AI-generated part recommendations
- Displays personalized recommendations to customer
- Stores recommendation history

---

## Seller/Store Processes

### **P6: Manage Product Catalog**
- Creates, updates, and deletes products
- Uploads product details (name, description, specs, images)
- Uploads product images to AWS S3
- Sets pricing and availability
- Schedules product launches
- Stores data in Product Database

### **P7: Monitor Orders & Customer Activity**
- Views live order dashboard
- Receives order notifications and alerts
- Reviews customer order history
- Tracks shipping and delivery status
- Monitors customer reviews and ratings
- Responds to customer inquiries

---

## Admin Processes

### **P8: Manage System Users**
- Creates customer, seller, and admin accounts
- Assigns roles and permissions (Guest, Customer, Seller, Admin)
- Updates User Database
- Manages access control levels
- Monitors system audit logs

### **P9: Manage Parts Synchronization**
- Triggers manual parts sync from remote feeds
- Fetches product data from Remote Parts Feeds (JSON, HTML, marketplace listings)
- Validates and transforms incoming data
- Upserts products into Product Database
- Logs sync status and errors
- Stores sync history for auditing

### **P10: Monitor System Health & Reports**
- Monitors system performance and uptime
- Generates sales and revenue reports
- Tracks user activity and engagement metrics
- Reviews database backup status
- Handles system security and logs
- Sends email notifications via SMTP for critical alerts

---

## Data Storage/Databases

| Database | Contains |
|---|---|
| **User Database** | Customers, sellers, admins, roles, permissions |
| **Product Database** | Products, inventory, pricing, categories, specifications |
| **Order Database** | Orders, order items, statuses, payment info |
| **Car Models Database** | Car models, customizations, garage items |
| **Review Database** | Customer reviews, ratings, feedback |
| **Wishlist Database** | Saved wishlist items, price tracking |
| **Session/Activity Log** | User activities, cart modifications, browsing history |
| **Violation/Audit Log** | System logs, unauthorized access attempts |

---

## External Services Integration

| Service | Purpose | Data Flow |
|---|---|---|
| **AWS S3** | Store product images | System → S3 (upload), S3 → System (URLs) |
| **SMTP Server** | Send order confirmations, OTP, notifications | System → SMTP (email content) |
| **OpenRouter Gemma API** | Generate AI recommendations | System → API (car details), API → System (recommendations) |
| **Remote Parts Feeds** | Fetch live product listings | System → Feeds (sync request), Feeds → System (product data) |

