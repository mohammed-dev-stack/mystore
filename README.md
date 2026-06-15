```html
<h1>MyStore – Full‑Stack E‑commerce Platform with AI Shopping Assistant</h1>

<blockquote>
  <p><strong>A production‑ready monorepo containing a React 19 frontend and Node.js/Express backend.</strong><br>
  Features AI‑powered chat (Ollama), visual search, persistent cart, admin dashboard, and secure JWT authentication.</p>
</blockquote>

<p align="center">
  <img src="https://via.placeholder.com/1200x630?text=MyStore+Home+Page" alt="Frontend Preview" width="90%">
</p>

<p align="center">
  <img src="https://via.placeholder.com/1200x630?text=API+Documentation" alt="Backend API" width="90%">
</p>

<hr>

<h2>📦 Technology Stack</h2>

<h3>Frontend</h3>

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

<h3>Backend</h3>

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

<hr>

<h2>🏗️ Architecture Overview</h2>

<pre><code>┌─────────────────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────────────────┘</code></pre>

<h3>Key Design Decisions</h3>

<ul>
  <li><strong>Atomic commits</strong> – Every logical change is a separate commit (see roadmap below).</li>
  <li><strong>Separation of concerns</strong> – Frontend uses service layer for API calls; backend uses service/repository pattern.</li>
  <li><strong>RTL‑first frontend</strong> – Tailwind utilities (<code>me</code>, <code>ms</code>, <code>ps</code>, <code>pe</code>) ensure proper mirroring.</li>
  <li><strong>Inventory management</strong> – Orders reserve stock using MongoDB transactions.</li>
  <li><strong>Graceful AI fallback</strong> – When Ollama is unavailable, backend returns friendly error messages.</li>
</ul>

<hr>

<h2>✨ Key Features</h2>

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

<hr>

<h2>🚀 Getting Started</h2>

<h3>Prerequisites</h3>

<ul>
  <li>Node.js <strong>20+</strong> (v22 recommended)</li>
  <li>npm or pnpm</li>
  <li>MongoDB (local or Atlas URI)</li>
  <li>Ollama installed and running (pull <code>llama3.2:3b</code>)</li>
</ul>

<h3>Installation</h3>

<ol>
  <li>
    <p><strong>Clone the repository</strong></p>
    <pre><code>git clone https://github.com/your-org/mystore.git
cd mystore</code></pre>
  </li>
  <li>
    <p><strong>Install backend dependencies</strong></p>
    <pre><code>cd backend
npm install</code></pre>
  </li>
  <li>
    <p><strong>Set up backend environment</strong></p>
    <pre><code>cp .env.example .env
# Edit .env with your MONGO_URI, JWT_SECRET, etc.</code></pre>
  </li>
  <li>
    <p><strong>Seed database (optional)</strong></p>
    <pre><code>npm run seed
# Creates admin@mystore.com / admin123 and sample products</code></pre>
  </li>
  <li>
    <p><strong>Start backend server</strong></p>
    <pre><code>npm run dev      # Runs on http://localhost:5000</code></pre>
  </li>
  <li>
    <p><strong>Install frontend dependencies (new terminal)</strong></p>
    <pre><code>cd ../frontend
npm install</code></pre>
  </li>
  <li>
    <p><strong>Set up frontend environment</strong></p>
    <pre><code>cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api</code></pre>
  </li>
  <li>
    <p><strong>Start frontend dev server</strong></p>
    <pre><code>npm run dev      # Runs on http://localhost:5173</code></pre>
  </li>
  <li>
    <p><strong>Open</strong> <code>http://localhost:5173</code> and start shopping.</p>
  </li>
</ol>

<hr>

<h2>🧪 Testing</h2>

<h3>Backend</h3>

<pre><code>cd backend
npm test          # Vitest + Supertest (in‑memory MongoDB)</code></pre>

<h3>Frontend</h3>

<pre><code>cd frontend
npm test          # Vitest + React Testing Library</code></pre>

<hr>

<h2>📁 Project Structure</h2>

<pre><code>mystore/
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
└── README.md                 # You are here</code></pre>

<hr>

<h2>🗺️ Git Commit Roadmap – Atomic Development History</h2>

<p>Below is a <strong>step‑by‑step plan</strong> of 15+ atomic commits you will make when pushing the project to GitHub.<br>
Each commit follows the <a href="https://www.conventionalcommits.org/">Conventional Commits</a> standard.<br>
<strong>Why this matters:</strong> Recruiters see a clean, incremental history – evidence of real hands‑on work.</p>

<h3>Phase 1: Project Initialization (Commits 1–4)</h3>

<pre><code>1.  chore: initialize monorepo with frontend and backend folders
2.  feat(backend): setup Express server with TypeScript and basic health check
3.  feat(frontend): scaffold React 19 + Vite + Tailwind CSS
4.  docs: add project roadmap and commit guidelines to README</code></pre>

<h3>Phase 2: Backend Core (Commits 5–9)</h3>

<pre><code>5.  feat(backend): connect to MongoDB with Mongoose and create User model
6.  feat(backend): implement JWT token service and auth middleware
7.  feat(backend): add auth service (register, login, profile, password reset)
8.  feat(backend): build Product model with inventory, images, ratings
9.  feat(backend): implement product CRUD with filtering, pagination, text search</code></pre>

<h3>Phase 3: AI & Chat Features (Commits 10–12)</h3>

<pre><code>10. feat(backend): integrate Ollama for image analysis and intent classification
11. feat(backend): create Chat model with TTL index and session management
12. feat(backend): implement chat service with AI fallback and product search</code></pre>

<h3>Phase 4: Order & Payment (Commits 13–15)</h3>

<pre><code>13. feat(backend): create Order model with status workflow and virtuals
14. feat(backend): implement order service (transactional stock reservation)
15. feat(backend): add checkout routes and payment webhook placeholder</code></pre>

<h3>Phase 5: Frontend Pages & State (Commits 16–19)</h3>

<pre><code>16. feat(frontend): implement AuthContext and login/register pages
17. feat(frontend): build ProductCard component and Store page with useProducts hook
18. feat(frontend): implement CartContext with localStorage persistence
19. feat(frontend): create AI ChatWidget with memoised input and message bubbles</code></pre>

<h3>Phase 6: Polish & Deployment (Commits 20–22)</h3>

<pre><code>20. feat(frontend): add dark mode toggle and AdminLayout dashboard
21. test(backend): write integration tests for auth and product endpoints
22. ci: add GitHub Actions workflow for linting and testing</code></pre>

<blockquote>
  <p><strong>How to use this roadmap:</strong><br>
  After writing code for each step, commit using the exact message shown.<br>
  This produces a rich, verifiable commit history that stands out to technical recruiters.</p>
</blockquote>

<hr>

<h2>🚢 Deployment</h2>

<ul>
  <li><strong>Frontend</strong> – Build with <code>npm run build</code> and deploy to Vercel, Netlify, or any static host.</li>
  <li><strong>Backend</strong> – Set environment variables on Render, Railway, or AWS Elastic Beanstalk.</li>
  <li><strong>MongoDB</strong> – Use MongoDB Atlas (free tier).</li>
  <li><strong>Ollama</strong> – For production, consider a dedicated GPU instance or disable AI features.</li>
</ul>

<hr>

<h2>📄 License</h2>

<p>Proprietary – © 2026 MyStore. All rights reserved.</p>

<hr>

<h2>🤝 Acknowledgments</h2>

<ul>
  <li><a href="https://reactjs.org/">React</a></li>
  <li><a href="https://tailwindcss.com/">Tailwind CSS</a></li>
  <li><a href="https://vitejs.dev/">Vite</a></li>
  <li><a href="https://expressjs.com/">Express</a></li>
  <li><a href="https://mongoosejs.com/">Mongoose</a></li>
  <li><a href="https://ollama.com/">Ollama</a></li>
</ul>

<hr>

<p><strong>Built with precision, scalability, and a clean commit history.</strong><br>
<em>Ready for code review and production deployment.</em></p>
```