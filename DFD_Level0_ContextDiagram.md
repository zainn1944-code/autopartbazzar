# AutoPart Bazaar - DFD Level 0 (Context Diagram)

```puml
@startuml DFD_Level0_AutoPartBazaar
title AutoPart Bazaar - DFD Level 0 (Context Diagram)
skinparam BackgroundColor #FEFEFE
skinparam BorderColor #333333
skinparam FontColor #333333
skinparam ArrowColor #333333

' Define Actors (External Entities)
actor "👤 Guest/Customer" as Customer
actor "🔐 Admin" as Admin

' Define External Systems
database "🗄️ PostgreSQL\nDatabase" as DB
cloud "☁️ AWS S3\nImage Storage" as S3
cloud "📧 SMTP Server\nEmail Service" as SMTP
cloud "🤖 OpenRouter\nGemma API" as AI
cloud "📦 Remote Parts\nFeeds" as Feed

' Define Main System (Circle in DFD)
circle "AutoPart\nBazaar\nSystem" as System

' Connections from Customer to System
Customer -->|Login, Register\nSearch Products\nAdd to Cart\nCheckout\nView Garage\nAI Requests| System
System -->|Auth Response\nProduct Data\nCart Status\nOrder Confirmation\nGarage Data\nRecommendations| Customer

' Connections from Admin to System
Admin -->|Manage Catalog\nSync Products\nManage Users\nMonitor Orders\nRole Assignment| System
System -->|Dashboard\nReports\nSync Status\nAnalytics| Admin

' Connections from System to External Systems
System -->|Store/Retrieve\nUsers, Products, Orders\nReviews, Wishlists| DB
DB -->|Query Results\nData| System

System -->|Upload\nProduct Images| S3
S3 -->|Image URLs| System

System -->|Send OTP\nOrder Emails\nNotifications| SMTP
SMTP -->|Delivery Status| System

System -->|Car Details\nCustomer Prefs| AI
AI -->|Part Recommendations| System

System -->|Fetch Product Data\nJSON/HTML Listings| Feed
Feed -->|Live Product Data\nMarketplace Listings| System

@enduml
```

## Data Flow Summary

| Actor/System | Input to System | Output from System |
|---|---|---|
| **Guest/Customer** | Login, Search, Cart, Checkout, Garage, AI Requests | Auth Tokens, Products, Cart Status, Orders, Recommendations |
| **Admin** | Catalog Updates, Sync Trigger, User Mgmt, Order Monitoring | Dashboard, Reports, Analytics |
| **PostgreSQL** | Query Results, Data | Store User/Product/Order Data |
| **AWS S3** | Image URLs | Receive Product Images |
| **SMTP** | Delivery Status | Send OTP & Order Emails |
| **OpenRouter API** | Part Recommendations | Car Details & Preferences |
| **Remote Feeds** | Live Product Data | Fetch Request |

