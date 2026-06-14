```markdown
# MyStore Frontend – Production‑Grade E‑commerce Platform with AI Assistant

> **A high‑performance, RTL‑first frontend engineered for scalability, type safety, and a seamless Arabic shopping experience.**  
> Built with React 19, TypeScript, and Vite, it integrates an AI‑powered shopping assistant (Ollama), persistent cart, admin dashboard, and full checkout flow.

![Home Page Preview](https://via.placeholder.com/1200x630?text=MyStore+Home+Page)
![AI Chat Widget Preview](https://via.placeholder.com/1200x630?text=AI+Chat+Widget)

---

## 🧠 Technology Stack – Rationale & Trade‑offs

<details>
<summary><b>Click to expand: Detailed technology choices</b></summary>

- **React 19** – UI library  
  *Why*: Leverages concurrent rendering, automatic memoization, and improved hooks – reduces unnecessary re‑renders without manual optimisations.

- **TypeScript** – Type safety  
  *Why*: `strict` mode with `noUncheckedIndexedAccess` and `verbatimModuleSyntax` eliminates null/undefined bugs at compile time and enforces explicit imports.

- **Vite** – Build tool  
  *Why*: Native ESM, sub‑second HMR, and `manualChunks` for optimal code splitting – cuts dev cold start by 10x compared to CRA.

- **Tailwind CSS** – Styling  
  *Why*: Utility‑first with RTL‑aware utilities (`me`, `ms`, `ps`, `pe`) – perfect for Arabic‑first design without custom CSS overrides.

- **Framer Motion** – Animations  
  *Why*: Spring‑based physics, gesture support, and exit animations – delivers fluid micro‑interactions while maintaining 60 FPS.

- **Axios** – HTTP client  
  *Why*: Interceptors for automatic JWT injection, global 401 handling, and request/response logging – centralises all API communication.

- **React Router v7** – Routing  
  *Why*: Data‑aware routes, nested layouts, and lazy loading – clean separation between public, auth, and admin sections.

- **Context API** – State management  
  *Why*: Lightweight, built‑in solution for auth, cart, theme, and chat – avoids third‑party bloat while keeping state predictable.

- **FontAwesome** – Icons  
  *Why*: Extensive icon set, tree‑shakable imports, and consistent RTL support – no layout shifts due to icon fonts.

</details>

---

## 🏗️ Modular Architecture – Clean Separation of Concerns

The codebase follows a **feature‑first, layer‑separated** architecture, ensuring that each part can be tested, replaced, or scaled independently.

```text
src/
├── components/       # Reusable UI (ProductCard, ChatWidget, Navbar)
│   ├── chat/         # Isolated chat components (ChatInput, MessageBubble)
│   └── common/       # Shared elements (SearchBar, Footer)
├── contexts/         # Global state providers (Auth, Cart, Chat, Theme)
├── hooks/            # Encapsulated business logic (useProducts, useDebounce)
├── layouts/          # Layout wrappers (MainLayout, AdminLayout, AuthLayout)
├── pages/            # Route‑level components (Home, Store, Dashboard, Login, etc.)
├── services/         # API communication layer (auth, product, chat, order, search)
├── types/            # Centralised TypeScript interfaces (api, product, user)
├── utils/            # Pure helper functions (currency formatting, validators)
└── tests/            # Unit & integration tests (Vitest + React Testing Library)
```

### 🔧 Key Engineering Decisions

- **Component memoisation** – `ChatInput`, `MessageBubble`, `ProductCard`, and `ChatWidget` are wrapped with `React.memo`. This prevents expensive re‑renders when parent state changes (e.g., typing in the chat input doesn't re‑render the entire message list).
- **Custom hooks for complex logic** – `useProducts` encapsulates filtering, debouncing, pagination, and URL synchronisation. Pages remain declarative and focused on rendering.
- **Service layer abstraction** – All API calls reside in `services/`; components never call `axios` directly. This makes mocking trivial, centralises error handling, and allows easy replacement of the HTTP client.
- **Isolated contexts** – `AuthContext`, `CartContext`, `ChatContext`, and `ThemeContext` are independent. No single giant context – components subscribe only to the state they actually need.
- **RTL‑first styling** – Every Tailwind class respects `dir="rtl"`. Custom scrollbars, form inputs, and modals are mirror‑aware without extra CSS.
- **Lazy loading & code splitting** – Routes like `Dashboard` and `Checkout` are lazy‑loaded. Vite’s `manualChunks` splits vendor code (`react`, `framer-motion`, `axios`) into separate bundles, reducing initial load time.

---

## ✨ Key Features – Engineered for Real‑World Use

<details>
<summary><b>Click to expand: Feature breakdown</b></summary>

- **🔐 Authentication** – JWT‑based login/register with role‑based access (user / admin).  
  *Implementation*: `AuthContext` stores the token; `api.ts` injects it via interceptors. `AdminLayout` guards dashboard routes and redirects non‑admins.

- **🤖 AI Shopping Assistant** – Chat widget with product search, image analysis (via Ollama), and fallback responses.  
  *Implementation*: `ChatContext` + `chat.service.ts`. Messages are enriched with product cards when `triggeredSearch` is true. The chat input is memoised to avoid re‑rendering the whole history on every keystroke.

- **🛒 Persistent Cart** – Cart survives page refresh; inventory‑aware (respects max stock).  
  *Implementation*: `CartContext` persists to `localStorage`. Items store `selectedAttributes` for variants. Adding an item checks available stock before updating.

- **🔍 Advanced Product Store** – Debounced search, price range, category filter, sorting, and URL synchronisation.  
  *Implementation*: `useProducts` hook with 500ms debounce. Filters are read from/written to the URL – shareable links preserve state.

- **🌙 Dark Mode** – System preference detection + manual toggle.  
  *Implementation*: `ThemeContext` toggles a `dark` class on `<html>`. Persisted in `localStorage` – no flash of incorrect theme on load.

- **🧑‍💼 Admin Dashboard** – Sales statistics, recent orders, product management, user roles.  
  *Implementation*: `AdminLayout` + `Dashboard` page. Uses `getAllOrders`, `getAllUsers`, and `getProducts` with admin‑scoped tokens.

- **📦 Checkout & Orders** – Address collection, payment method selection (Stripe/PayPal/COD), order creation.  
  *Implementation*: `Checkout` page calls `createOrder` from `order.service.ts`. On success, clears cart and redirects to confirmation (page ready for extension).

- **🔎 Visual Search** – Upload an image → Ollama extracts keywords → product search.  
  *Implementation*: `SearchBar` component sends base64 image to `/api/search/image`. Results shown in `SearchResults`. Handles large images and timeouts gracefully.

- **⚡ Performance Optimisations** – Memoisation, debouncing, lazy loading, and code splitting.  
  *Implementation*: `React.memo` on chat components, `useDebounce` on search inputs, lazy routes, Vite manual chunks – all measurable gains.

</details>

---

## 🚀 Getting Started – Local Development

### Prerequisites

- Node.js **20+** (v22 recommended)
- npm or pnpm

### 1. Clone & Install

```bash
git clone https://github.com/your-org/mystore-frontend.git
cd mystore-frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:5000/api   # Backend API URL
```

> The backend must be running separately (see backend README).  
> For production, replace with your deployed API URL.

### 3. Development Server

```bash
npm run dev
```

The app will open at `http://127.0.0.1:5173`.  
Hot‑reload is enabled – changes reflect instantly.

### 4. Production Build

```bash
npm run build      # Outputs to `dist/`
npm run preview    # Serves the built app locally
```

---

## 🛠️ Development Tooling – Enforcing Code Quality

<details>
<summary><b>Click to expand: Tooling configuration</b></summary>

- **TypeScript** – `strict: true`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`  
  *Impact*: Catches null/undefined bugs at compile time. Forces explicit imports – no hidden globals.

- **ESLint** – `typescript-eslint`, `react-hooks`, `react-refresh`  
  *Impact*: Ensures hooks rules, no unused variables, and fast refresh compatibility.

- **Vitest** – `jsdom` environment, `@testing-library/react`  
  *Impact*: Unit tests for components (e.g., `ProductCard.test.tsx`). Run with `npm test`.

- **Vite** – Proxy to backend, `manualChunks`, `sourcemap: true`  
  *Impact*: Eliminates CORS in dev, reduces initial load time, and makes debugging easy.

- **Tailwind + Autoprefixer** – `darkMode: 'class'`, RTL‑aware utilities  
  *Impact*: Dark mode works without flicker. Layout mirrors for Arabic without extra CSS.

</details>

### Linting & Testing Commands

```bash
npm run lint        # Run ESLint
npm run test        # Run Vitest
```

---

## 📝 Git Commit Strategy – Conventional Commits & Atomic Commits

This repository follows **Conventional Commits** (v1.0.0) with **atomic commits** to maintain a clean, auditable history. Every commit represents a single logical change – no mixed concerns.

### Commit Message Format

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Allowed Types

| Type | Purpose |
|------|---------|
| `feat` | New feature for the user (e.g., `feat(chat): add image upload support`) |
| `fix` | Bug fix (e.g., `fix(cart): correct stock validation on quantity update`) |
| `docs` | Documentation changes (e.g., `docs(readme): update setup instructions`) |
| `style` | Code style changes (formatting, semicolons, etc.) – no functional change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement (e.g., `perf(products): debounce search input`) |
| `test` | Adding missing tests or correcting existing tests |
| `chore` | Maintenance tasks (dependency updates, build config, etc.) |

### Scope Examples

- `auth`, `cart`, `chat`, `products`, `checkout`, `dashboard`, `ui`, `api`, `types`, `config`

### Atomic Commit Rules

- Each commit focuses on **one** logical change.
- A commit should pass all tests and not break the build.
- Use `git add -p` to stage only relevant changes.
- Keep commits small enough to review in under 5 minutes.

### Example History

```text
feat(chat): add typing indicator animation
fix(cart): prevent negative quantity when decrementing
perf(search): debounce API calls by 300ms
docs(readme): add commit guidelines section
test(products): add unit tests for ProductCard component
```

This strategy makes `git bisect` effective, simplifies code reviews, and provides a clear narrative of the project’s evolution.

---

## 📁 Project Structure – At a Glance

```text
mystore-frontend/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── chat/            # ChatWidget, ChatInput, MessageBubble (memoised)
│   │   └── common/          # Navbar, Footer, ProductCard, SearchBar
│   ├── contexts/            # Auth, Cart, Chat, Theme providers
│   ├── hooks/               # useProducts, useDebounce, useLocalStorage, etc.
│   ├── layouts/             # MainLayout, AdminLayout, AuthLayout
│   ├── pages/               # Home, Store, Chat, Login, Register, Dashboard, Checkout, SearchResults
│   ├── services/            # api.ts, auth.service.ts, product.service.ts, chat.service.ts, etc.
│   ├── types/               # api.types.ts, product.types.ts, user.types.ts
│   ├── utils/               # currency.ts, validators.ts
│   └── tests/               # setup.ts, component tests
├── .env                     # Environment variables (git‑ignored)
├── index.html               # Entry HTML
├── package.json
├── tsconfig.json            # TypeScript config (strict)
├── vite.config.ts           # Vite + proxy + chunking
├── tailwind.config.js       # Tailwind with RTL support
└── README.md                # You are here
```

---

## 🤝 Extensibility – Built for Growth

This codebase is **designed to be extended without rewrites**:

- **Adding a new page** – Create a component in `pages/`, add a `<Route>` in `App.tsx`, and choose a layout (`MainLayout`, `AdminLayout`, or `AuthLayout`).
- **Adding a new API endpoint** – Create a service function in the corresponding `*.service.ts` file (e.g., `review.service.ts`).
- **Modifying chat AI behaviour** – Adjust the prompt logic in the backend `chat.service.ts` – the frontend only displays what the backend returns.
- **Changing the colour scheme** – Update Tailwind `primary` colour in `tailwind.config.js` – changes propagate everywhere.

---

## 📄 License

This project is proprietary and confidential.  
© 2026 MyStore. All rights reserved.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) – UI library  
- [Tailwind CSS](https://tailwindcss.com/) – RTL‑friendly styling  
- [Framer Motion](https://www.framer.com/motion/) – Smooth animations  
- [FontAwesome](https://fontawesome.com/) – Icons  
- [Ollama](https://ollama.com/) – Local AI model for chat & image search

---

**Engineered for precision, scalability, and the Arabic user.**  
_Production‑ready – deploy to Vercel, Netlify, or any static host._
```