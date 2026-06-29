# 3.4.2: UML Activity Diagrams - AutoPart Bazaar

## What is an Activity Diagram?

An **Activity Diagram** is a UML *behavioral* diagram that shows the
**flow of control** through a system — the sequence of actions, decisions,
parallel paths and end states that occur while a user (or another system)
completes a task.

Key notation used below:

- `( )` rounded node = **Start / End**
- `[ ]` rectangle = **Action / Activity**
- `{ }` diamond = **Decision (branch)**
- `==` horizontal bar = **Fork / Join (parallel flow)**
- Swimlanes group actions by the **actor** that performs them
  (Customer, Frontend, Backend API, External Service).

The diagrams below cover the four main end-to-end flows of AutoPart Bazaar.

---

## 1. User Authentication Flow (Signup / Login / JWT refresh)

```mermaid
flowchart TD
    Start([Start]) --> Open[Open AutoPart Bazaar]
    Open --> HasAcc{Has account?}

    HasAcc -- No --> Signup[Fill signup form<br/>name, email, password]
    Signup --> ValSign{Valid input?}
    ValSign -- No --> SignErr[Show validation error] --> Signup
    ValSign -- Yes --> CreateUser[POST /auth/signup<br/>backend creates user]
    CreateUser --> SaveDB[(Save in User DB)]
    SaveDB --> IssueJWT1[Issue JWT + refresh token]

    HasAcc -- Yes --> Login[Enter email + password]
    Login --> Verify[POST /auth/login]
    Verify --> Check{Credentials OK?}
    Check -- No --> LoginErr[Show 'Invalid credentials'] --> Login
    Check -- Yes --> IssueJWT2[Issue JWT + refresh token]

    IssueJWT1 --> Store[Store token in browser<br/>localStorage]
    IssueJWT2 --> Store
    Store --> Home[Redirect to Home page]
    Home --> End([End])
```

**Notes**

- Forgot-password OTP is sent via SMTP (`email_service.py`); the flow
  returns a 503 if SMTP credentials are not configured.
- A silent refresh runs in the background whenever the JWT is close to
  expiring, so the user is not logged out mid-session.

---

## 2. Browse → Cart → Checkout → Order

```mermaid
flowchart TD
    Start([Start]) --> Browse[Browse product catalog<br/>Home / Products page]
    Browse --> Filter{Apply filters?<br/>category, brand, car model}
    Filter -- Yes --> ApplyF[GET /products?filters=...]
    Filter -- No --> ApplyF
    ApplyF --> ShowList[Display product list]

    ShowList --> Pick[Open ProductDetail page]
    Pick --> Decide{Add to cart?}
    Decide -- No --> Browse
    Decide -- Yes --> AddCart[Add item to CartContext<br/>+ persist to localStorage]

    AddCart --> More{Continue shopping?}
    More -- Yes --> Browse
    More -- No --> OpenCart[Open Cart page]

    OpenCart --> Checkout[Click 'Checkout']
    Checkout --> AuthCheck{User logged in?}
    AuthCheck -- No --> Login[Redirect to Login] --> Checkout
    AuthCheck -- Yes --> FillAddr[Fill shipping address + payment]

    FillAddr --> Submit[POST /orders]
    Submit --> Validate[Backend validates cart<br/>vs. inventory + prices]
    Validate --> Ok{Valid?}
    Ok -- No --> OrderErr[Show error<br/>out of stock / price change] --> OpenCart
    Ok -- Yes --> Persist[(Save Order + OrderItems in Order DB)]

    Persist --> Email[Send confirmation email via SMTP]
    Email --> Confirm[Redirect to OrderConfirmation page]
    Confirm --> End([End])
```

**Parallel sub-flow inside checkout** (fork/join):

```mermaid
flowchart LR
    A[POST /orders] --> F{{Fork}}
    F --> B[Persist Order in DB]
    F --> C[Send confirmation email]
    F --> D[Clear cart in CartContext]
    B --> J{{Join}}
    C --> J
    D --> J
    J --> R[Return OrderResult to frontend]
```

---

## 3. 3D Garage + AI Recommendation Flow

```mermaid
flowchart TD
    Start([Start]) --> OpenGarage[Open Garage / ViewModel page]
    OpenGarage --> LoadGLB[Load .glb car model<br/>frontend/public/models/...]
    LoadGLB --> Render[Render 3D scene with Three.js]

    Render --> Action{Customer action?}
    Action -- Customize --> Tweak[Change colour / wheels / parts<br/>carCustomization.js]
    Tweak --> Save[Save customization to Garage]
    Save --> PersistG[(Save to Car Models DB)]
    PersistG --> Action

    Action -- Ask AI --> Prompt[Send car details + prompt<br/>useCarAI hook]
    Prompt --> CallAI[POST to OpenRouter Gemma API]
    CallAI --> AIResp{API success?}
    AIResp -- No --> AIErr[Show 'AI unavailable'] --> Action
    AIResp -- Yes --> Recs[Receive recommended parts]
    Recs --> Log[(Log AI event in ai_event table)]
    Log --> ShowRecs[Display recommendations in AIModPanel]
    ShowRecs --> Action

    Action -- Done --> End([End])
```

---

## 4. Admin: Parts Synchronization Flow

```mermaid
flowchart TD
    Start([Start]) --> Login[Admin logs in]
    Login --> RoleCheck{Role == Admin?}
    RoleCheck -- No --> Deny[403 Forbidden] --> End([End])
    RoleCheck -- Yes --> Dash[Open Admin Dashboard]

    Dash --> Trigger[Click 'Sync Parts']
    Trigger --> StartSync[POST /admin/parts/sync]
    StartSync --> Fetch[parts_sync.py:<br/>fetch from Remote Parts Feeds]

    Fetch --> Got{Data received?}
    Got -- No --> LogErr[(Log error in Audit Log)] --> Notify[Show error toast] --> Dash
    Got -- Yes --> Transform[Validate + transform JSON/HTML]

    Transform --> Loop{For each part}
    Loop --> Upsert[(Upsert into Product DB)]
    Upsert --> Img{Has image?}
    Img -- Yes --> S3[Upload image to AWS S3<br/>or fallback to /media]
    Img -- No --> Loop
    S3 --> Loop

    Loop -- All done --> LogOk[(Write sync summary to log)]
    LogOk --> Refresh[Refresh product list on dashboard]
    Refresh --> End
```

---

## Summary of Actors and Their Activities

| Actor | Main activities covered above |
|---|---|
| **Guest / Customer** | Signup, login, browse, cart, checkout, garage, ask AI |
| **Frontend (React + Vite)** | Form handling, CartContext, 3D rendering, token storage |
| **Backend (FastAPI)** | Auth, order processing, parts sync, AI proxying, email |
| **External services** | AWS S3, SMTP server, OpenRouter Gemma API, Remote Parts Feeds |
| **Admin** | Trigger parts sync, manage users, monitor sync logs |

These activity diagrams complement the
[Class Diagram](UML_ClassDiagram_AutoPartBazaar.md) (structure) and the
[DFD Level 1](DFD_Level1_AutoPartBazaar.md) (data flow) by showing the
**control flow** — the order in which the system's actions actually happen.
