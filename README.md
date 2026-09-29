# Abdul Rehman General Store — Complete MongoDB Edition

A practical React + Vite frontend and Express + MongoDB/Mongoose backend for a small general store.

## Included
- Dashboard
- Products
- Sales / POS
- Customers
- Udhaar / Credit + receive payment
- Purchases + stock increase
- Suppliers
- Demand & Stock
- Expenses
- Reports
- Settings
- Database-aware Store Assistant chatbot
- Simple demo login
- PKR currency

## Run locally
1. Install Node.js LTS.
2. Run `npm install` from the project root.
3. Copy `.env.example` to `.env` and put your MongoDB connection string in `MONGODB_URI`.
4. Run `npm run dev`.
5. Open http://localhost:5173

Demo login: `admin@abdulrehmanstore.local` / `admin123`

## Seed sample data
From root: `npm run --workspace backend seed`

## Production
The Vite frontend can be deployed to Vercel. The Express/MongoDB backend needs a Node host such as Render/Railway/Fly.io, then set `VITE_API_URL` to the backend `/api` URL. MongoDB Atlas is suitable for the database.
