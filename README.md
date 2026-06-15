أرى المشكلة بوضوح من الصورة. GitHub يعرض الكود الخام (HTML tags) بدلاً من تفسيره لأنك تستخدم HTML داخل ملف `.md`. GitHub لا يدعم عرض HTML في ملفات Markdown للأمان.

**الحل:** استخدم Markdown النقي، وإليك الملف المعدل بالكامل والجاهز للنسخ واللصق:

```markdown
# MyStore – Full‑Stack E‑commerce Platform with AI Shopping Assistant

> **A production‑ready monorepo containing a React 19 frontend and Node.js/Express backend.**  
> Features AI‑powered chat (Ollama), visual search, persistent cart, admin dashboard, and secure JWT authentication.

![Frontend Preview](https://via.placeholder.com/1200x630?text=MyStore+Home+Page)

![Backend API](https://via.placeholder.com/1200x630?text=API+Documentation)

---

## 📦 Technology Stack

### Frontend

| Technology | Purpose |
|:---|:---|
| React 19 | UI library with concurrent features |
| TypeScript | Strict type safety |
| Vite | Fast builds & HMR |
| Tailwind CSS | RTL‑first utility styling |
| Framer Motion | Spring animations |
| Axios | HTTP client with interceptors |
| React Router v7 | Lazy loaded routes |
| Context API | State management (auth, cart, theme, chat) |

### Backend

| Technology | Purpose |
|:---|:---|
| Node.js + Express 5 | REST API server |
| TypeScript | Type safety |
| MongoDB + Mongoose 9 | Database with schema validation |
| JWT + bcryptjs | Authentication & password hashing |
| Multer + Sharp | Image upload & transformation |
| Ollama (LLaMA 3.2) | AI chat & image analysis |
| Helmet + CORS + Compression | Security & performance |
| Winston | Logging |
| Vitest + Supertest | Unit & integration tests |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React SPA)                       │
│  - Lazy loaded routes                                       │
│  - Context providers (Auth, Cart, Chat, Theme)              │
│  - Memoised components for performance                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / JWT
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Express)                       │
│  - Controllers (auth, products, orders, chat, search)       │
│  - Services (business logic)                                │
│  - Middleware (auth, rate limit, error handling)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              MongoDB (Atlas or Local)                       │
│  - Users, Products, Orders, Chat (with TTL)                 │
│  - Indexes: text search, compound filters                   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Ollama (Local AI)                        │
│  - Intent classification, product extraction, image analysis│
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Atomic commits** – Every logical change is a separate commit (see roadmap below).
- **Separation of concerns** – Frontend uses service layer for API calls; backend uses service/repository pattern.
- **RTL‑first frontend** – Tailwind utilities (`me`, `ms`, `ps`, `pe`) ensure proper mirroring.
- **Inventory management** – Orders reserve stock using MongoDB transactions.
- **Graceful AI fallback** – When Ollama is unavailable, backend returns friendly error messages.

---

## ✨ Key Features

| Feature | Implementation |
|:---|:---|
| 🔐 JWT Authentication | `AuthContext` + `protect` middleware; brute‑force protection (5 attempts → 15 min lock) |
| 🤖 AI Shopping Assistant | Chat widget with product search & image analysis (Ollama) |
| 🛒 Persistent Cart | `localStorage` + `CartContext`; respects max stock |
| 🔍 Advanced Store | Debounced search, filters, sorting, URL sync (`useProducts`) |
| 🌙 Dark Mode | System preference + manual toggle; persisted |
| 🧑‍💼 Admin Dashboard | Sales stats, recent orders, user/role management |
| 📦 Checkout | Address collection, payment method (Stripe/PayPal/COD), order creation |
| 🔎 Visual Search | Upload image → Ollama extracts keywords → product results |
| ⚡ Performance | Memoisation, lazy loading, code splitting, debouncing |

---

## 🚀 Getting Started

### Prerequisites

- Node.js **20+** (v22 recommended)
- npm or pnpm
- MongoDB (local or Atlas URI)
- Ollama installed and running (pull `llama3.2:3b`)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/mystore.git
   cd mystore
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Set up backend environment**

   ```bash
   cp .env.example .env
   # Edit .env with your MONGO_URI, JWT_SECRET, etc.
   ```

4. **Seed database (optional)**

   ```bash
   npm run seed
   # Creates admin@mystore.com / admin123 and sample products
   ```

5. **Start backend server**

   ```bash
   npm run dev      # Runs on http://localhost:5000
   ```

6. **Install frontend dependencies (new terminal)**

   ```bash
   cd ../frontend
   npm install
   ```

7. **Set up frontend environment**

   ```bash
   cp .env.example .env
   # Set VITE_API_URL=http://localhost:5000/api
   ```

8. **Start frontend dev server**

   ```bash
   npm run dev      # Runs on http://localhost:5173
   ```

9. **Open** `http://localhost:5173` and start shopping.

---

## 🧪 Testing

### Backend

```bash
cd backend
npm test          # Vitest + Supertest (in‑memory MongoDB)
```

### Frontend

```bash
cd frontend
npm test          # Vitest + React Testing Library
```

---

## 📁 Project Structure

```
mystore/
├── frontend/                 # React 19 + Vite
│   ├── src/
│   │   ├── components/       # Reusable UI (ProductCard, ChatWidget)
│   │   ├── contexts/         # Auth, Cart, Chat, Theme
│   │   ├── hooks/            # useProducts, useDebounce
│   │   ├── layouts/          # MainLayout, AdminLayout, AuthLayout
│   │   ├── pages/            # Home, Store, Login, Dashboard, etc.
│   │   ├── services/         # API calls (auth, product, chat, order)
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Currency, validators
│   └── package.json
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── config/           # Database, Ollama clients
│   │   ├── controllers/      # auth, product, order, chat, search
│   │   ├── middleware/       # auth, error, security, upload
│   │   ├── models/           # User, Product, Order, Chat
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Logger, imageHelper, validators
│   │   └── scripts/          # Seed products
│   └── package.json
└── README.md                 # You are here
```

---

## 🗺️ Git Commit Roadmap – Atomic Development History

Below is a **step‑by‑step plan** of 15+ atomic commits you will make when pushing the project to GitHub.  
Each commit follows the [Conventional Commits](https://www.conventionalcommits.org/) standard.  
**Why this matters:** Recruiters see a clean, incremental history – evidence of real hands‑on work.

### Phase 1: Project Initialization (Commits 1–4)

```
1.  chore: initialize monorepo with frontend and backend folders
2.  feat(backend): setup Express server with TypeScript and basic health check
3.  feat(frontend): scaffold React 19 + Vite + Tailwind CSS
4.  docs: add project roadmap and commit guidelines to README
```

### Phase 2: Backend Core (Commits 5–9)

```
5.  feat(backend): connect to MongoDB with Mongoose and create User model
6.  feat(backend): implement JWT token service and auth middleware
7.  feat(backend): add auth service (register, login, profile, password reset)
8.  feat(backend): build Product model with inventory, images, ratings
9.  feat(backend): implement product CRUD with filtering, pagination, text search
```

### Phase 3: AI & Chat Features (Commits 10–12)

```
10. feat(backend): integrate Ollama for image analysis and intent classification
11. feat(backend): create Chat model with TTL index and session management
12. feat(backend): implement chat service with AI fallback and product search
```

### Phase 4: Order & Payment (Commits 13–15)

```
13. feat(backend): create Order model with status workflow and virtuals
14. feat(backend): implement order service (transactional stock reservation)
15. feat(backend): add checkout routes and payment webhook placeholder
```

### Phase 5: Frontend Pages & State (Commits 16–19)

```
16. feat(frontend): implement AuthContext and login/register pages
17. feat(frontend): build ProductCard component and Store page with useProducts hook
18. feat(frontend): implement CartContext with localStorage persistence
19. feat(frontend): create AI ChatWidget with memoised input and message bubbles
```

### Phase 6: Polish & Deployment (Commits 20–22)

```
20. feat(frontend): add dark mode toggle and AdminLayout dashboard
21. test(backend): write integration tests for auth and product endpoints
22. ci: add GitHub Actions workflow for linting and testing
```

> **How to use this roadmap:**  
> After writing code for each step, commit using the exact message shown.  
> This produces a rich, verifiable commit history that stands out to technical recruiters.

---

## 🚢 Deployment

- **Frontend** – Build with `npm run build` and deploy to Vercel, Netlify, or any static host.
- **Backend** – Set environment variables on Render, Railway, or AWS Elastic Beanstalk.
- **MongoDB** – Use MongoDB Atlas (free tier).
- **Ollama** – For production, consider a dedicated GPU instance or disable AI features.

---

## 📄 License

Proprietary – © 2026 MyStore. All rights reserved.

---

## 🤝 Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [Ollama](https://ollama.com/)

---

**Built with precision, scalability, and a clean commit history.**  
_Ready for code review and production deployment._
```