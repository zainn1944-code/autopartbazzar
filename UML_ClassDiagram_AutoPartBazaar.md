# 3.4: UML Diagrams - AutoPart Bazaar

## What is UML?

**UML** stands for **Unified Modeling Language**. It is NOT a programming language—it is a **visual notation system** used to draw diagrams that describe:
- How a software system is **structured**
- How it **behaves**

## UML Diagram Categories

### **Structural Diagrams**
- Show system structure and relationships
- Example: Class Diagram, Component Diagram

### **Behavioral Diagrams**
- Show system behavior and interactions
- Example: Sequence Diagram, Activity Diagram

---

## 3.4.1: Class Diagram - AutoPart Bazaar

• User Abstract base class holding shared attributes (user_id, name, email, password, role) inherited by all four system roles.

• Customer An end-user who browses products, adds items to cart, places orders, and saves car customizations in garage. Can be flagged for suspicious payment activity.

• Seller Creates and manages products catalog, uploads images to AWS S3; has read access to order reports and customer reviews.

• Store Manager A supervisory role that monitors department-level sales, approves sellers, and reviews department performance reports without creating products directly.

• Admin Manages users, roles, and system configuration; triggers parts synchronization from remote feeds; has no direct involvement in shopping or product management.

• Product Stores product metadata (name, description, category, price, brand, compatibility with car models) created by a seller and linked to multiple orders.

• ProductVariant An individual product variant (size, specification, SKU) belonging to a Product and referenced when customer adds to cart.

• Cart The temporary shopping session linking a Customer to selected Products, tracking items, quantities, and total price before checkout.

• CartItem Captures an individual product entry in a Cart, storing quantity, unit price, and subtotal for billing calculation.

• Order Stores the final purchase transaction (order date, total price, status, shipping address) created from a Cart and linked to multiple OrderItems.

• OrderItem Captures what was actually purchased—product reference, variant, quantity, and price—within an Order, used to generate invoice.

• Garage The central link between a Customer and their saved car customizations, tracking selected parts, total cost, and customization name.

• CarModel Database of vehicle models and specifications (brand, model name, year, engine type, compatible parts), linked to multiple Garage entries.

• Review Customer feedback log capturing rating (1-5 stars), comments, and images attached to an Order and Product, used to compute product ratings.

• Wishlist List of Products saved by a Customer for future purchase, allowing price tracking and conversion to Cart.

• OrderResult The final summary of an Order storing subtotal, taxes, shipping charges, discount applied, and confirmation number, viewable by customer and staff.

• Payment Transaction record capturing payment method, amount, and status (pending, success, failed), linked to an Order for billing verification.

• AIRecommendation An OpenRouter Gemma API-generated log of part recommendations for a specific CarModel and Customer, recording recommended products and confidence score.

• EmailNotification An SMTP communication log capturing recipient, subject, body, notification type (order confirmation, OTP, recommendation), and delivery status.

---

## **Class Relationships**

```
User (Abstract)
├── Customer
│   ├── has many Orders
│   ├── has many CartItems
│   ├── has many Reviews
│   └── has many Garages
├── Seller
│   └── creates Products
├── StoreManager
│   └── supervises Sellers
└── Admin
    └── manages System

Product
├── has many Variants
├── has many OrderItems
├── has many Reviews
└── belongs to CarModel

Order
├── has many OrderItems
├── has one OrderResult
├── has one Payment
└── belongs to Customer

Garage
├── has many Products (customizations)
└── has AIRecommendations
```

