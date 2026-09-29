import React, { useEffect, useState } from 'react';
import {
  createRoot
} from 'react-dom/client';

import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet
} from 'react-router-dom';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  HandCoins,
  Truck,
  TrendingUp,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  MessageCircle,
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  WalletCards,
  ShoppingBag,
  Archive,
  RotateCcw,
  Trash
} from 'lucide-react';

import './styles.css';


// ======================================================
// API
// ======================================================

const API =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function api(path, opts = {}) {
  const token = localStorage.getItem('store_token');

  const r = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: 'Bearer ' + token }
        : {}),
      ...(opts.headers || {})
    }
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    if (r.status === 401 && token) {
      localStorage.removeItem('store_token');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    throw Error(data.message || 'Request failed');
  }

  return data;
}

const money = n =>
  `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;


// ======================================================
// FRONTEND ONLY TRASH SYSTEM
// ======================================================

const TRASH_KEY = 'abdul_rehman_store_trash';

const HIDDEN_KEY =
  'abdul_rehman_store_permanently_hidden';


function getTrash() {
  try {
    return JSON.parse(
      localStorage.getItem(TRASH_KEY) || '[]'
    );
  } catch {
    return [];
  }
}


function saveTrash(items) {
  localStorage.setItem(
    TRASH_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(
    new Event('trash-updated')
  );
}


function getHidden() {
  try {
    return JSON.parse(
      localStorage.getItem(HIDDEN_KEY) || '[]'
    );
  } catch {
    return [];
  }
}


function saveHidden(items) {
  localStorage.setItem(
    HIDDEN_KEY,
    JSON.stringify(items)
  );

  window.dispatchEvent(
    new Event('trash-updated')
  );
}


// Move record to Trash
function moveToTrash(type, item) {
  const trash = getTrash();

  const exists = trash.some(
    x =>
      x.type === type &&
      String(x.id) === String(item._id)
  );

  if (exists) return;

  const newItem = {
    type,
    id: item._id,
    data: item,
    deletedAt: new Date().toISOString()
  };

  saveTrash([...trash, newItem]);
}


// Restore record
function restoreFromTrash(type, id) {
  const trash = getTrash();

  saveTrash(
    trash.filter(
      x =>
        !(
          x.type === type &&
          String(x.id) === String(id)
        )
    )
  );
}


// Permanently hide record from frontend
function permanentlyDelete(type, id) {
  const trash = getTrash();

  const updatedTrash = trash.filter(
    x =>
      !(
        x.type === type &&
        String(x.id) === String(id)
      )
  );

  saveTrash(updatedTrash);

  const hidden = getHidden();

  const exists = hidden.some(
    x =>
      x.type === type &&
      String(x.id) === String(id)
  );

  if (!exists) {
    saveHidden([
      ...hidden,
      {
        type,
        id
      }
    ]);
  }
}


// Empty complete Trash
function emptyTrash() {
  const trash = getTrash();
  const hidden = getHidden();

  const newHidden = [
    ...hidden,
    ...trash
      .filter(
        item =>
          !hidden.some(
            h =>
              h.type === item.type &&
              String(h.id) === String(item.id)
          )
      )
      .map(item => ({
        type: item.type,
        id: item.id
      }))
  ];

  localStorage.setItem(
    HIDDEN_KEY,
    JSON.stringify(newHidden)
  );

  saveTrash([]);
}


// Check Trash
function isTrashed(type, id) {
  return getTrash().some(
    x =>
      x.type === type &&
      String(x.id) === String(id)
  );
}


// Check permanently hidden
function isHidden(type, id) {
  return getHidden().some(
    x =>
      x.type === type &&
      String(x.id) === String(id)
  );
}


// Remove frontend deleted records from API result
function filterVisible(type, items) {
  return items.filter(
    item =>
      !isTrashed(type, item._id) &&
      !isHidden(type, item._id)
  );
}


// ======================================================
// LOGIN
// ======================================================

function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState(
    'admin@abdulrehmanstore.local'
  );

  const [password, setPassword] =
    useState('admin123');

  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();

    try {
      const d = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      localStorage.setItem(
        'store_token',
        d.token
      );

      nav('/dashboard');

    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="login">
      <form
        className="login-card"
        onSubmit={submit}
      >
        <div className="logo">
          AR
        </div>

        <h1>
          Abdul Rehman General Store
        </h1>

        <p>
          Smart Shop Management System
        </p>

        {err && (
          <div className="error">
            {err}
          </div>
        )}

        <input
          className="input"
          value={email}
          onChange={e =>
            setEmail(e.target.value)
          }
          placeholder="Email"
        />

        <input
          className="input"
          type="password"
          value={password}
          onChange={e =>
            setPassword(e.target.value)
          }
          placeholder="Password"
        />

        <button className="btn wide">
          Login
        </button>

        <small>
          Demo: admin@abdulrehmanstore.local / admin123
        </small>
      </form>
    </div>
  );
}


// ======================================================
// SIDEBAR
// ======================================================

const navItems = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/products', 'Products', Package],
  ['/sales', 'Sales / POS', ShoppingCart],
  ['/customers', 'Customers', Users],
  ['/udhaar', 'Udhaar / Credit', HandCoins],
  ['/purchases', 'Purchases', ShoppingBag],
  ['/suppliers', 'Suppliers', Truck],
  ['/demand', 'Demand & Stock', TrendingUp],
  ['/expenses', 'Expenses', Receipt],
  ['/reports', 'Reports', BarChart3],
  ['/trash', 'Trash', Archive],
  ['/settings', 'Settings', Settings]
];


function Shell() {
  const loc = useLocation();
  const nav = useNavigate();

  const [open, setOpen] =
    useState(false);

  return (
    <div className="shell">

      <aside
        className={
          'sidebar ' +
          (open ? 'open' : '')
        }
      >

        <div className="brand">

          <div className="logo small">
            AR
          </div>

          <div>
            <b>
              Abdul Rehman
            </b>

            <span>
              General Store
            </span>
          </div>

        </div>


        <nav>
          {navItems.map(
            ([p, l, I]) => (
              <Link
                key={p}
                className={
                  loc.pathname === p
                    ? 'active'
                    : ''
                }
                to={p}
                onClick={() =>
                  setOpen(false)
                }
              >
                <I size={18} />
                {l}
              </Link>
            )
          )}
        </nav>


        <button
          className="logout"
          onClick={() => {
            localStorage.removeItem(
              'store_token'
            );

            nav('/login');
          }}
        >
          <LogOut size={18} />
          Logout
        </button>

      </aside>


      <main className="main">

        <header>

          <button
            className="mobile-menu"
            onClick={() =>
              setOpen(!open)
            }
          >
            <Menu />
          </button>

          <div>
            <b>
              {
                navItems.find(
                  x =>
                    x[0] === loc.pathname
                )?.[1] ||
                'Dashboard'
              }
            </b>

            <span>
              Smart Shop Management
            </span>
          </div>

          <div className="owner">
            Store Owner
          </div>

        </header>


        <section className="content">
          <Outlet />
        </section>

      </main>


      <Chatbot />

    </div>
  );
}


function Guard() {
  return localStorage.getItem(
    'store_token'
  ) ? (
    <Shell />
  ) : (
    <Navigate
      to="/login"
      replace
    />
  );
}


// ======================================================
// DASHBOARD
// ======================================================

function Dashboard() {

  const [d, setD] =
    useState(null);

  const load = () =>
    api('/dashboard')
      .then(setD)
      .catch(e =>
        alert(e.message)
      );

  useEffect(() => {
    load();
  }, []);

  if (!d) {
    return <Loading />;
  }

  const visibleRecentSales =
    d.recentSales.filter(
      s =>
        !isTrashed('sales', s._id) &&
        !isHidden('sales', s._id)
    );

  const visibleLowStock =
    d.lowStock.filter(
      p =>
        !isTrashed('products', p._id) &&
        !isHidden('products', p._id)
    );

  return (
    <>
      <PageTitle
        title="Dashboard"
        text="Daily overview of your store."
        action={
          <button
            className="btn secondary"
            onClick={load}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <div className="cards">

        <Stat
          icon={<WalletCards />}
          title="Cash Received"
          value={money(d.cashReceived)}
        />

        <Stat
          icon={<HandCoins />}
          title="Total Udhaar"
          value={money(d.credit)}
          danger
        />

        <Stat
          icon={<Package />}
          title="Products"
          value={d.productsCount}
        />

        <Stat
          icon={<AlertTriangle />}
          title="Low Stock"
          value={visibleLowStock.length}
          warn
        />

      </div>


      <div className="two">

        <div className="card">

          <h3>
            Recent Sales
          </h3>

          <Table
            heads={[
              'Invoice',
              'Customer',
              'Total',
              'Paid',
              'Status'
            ]}
            rows={visibleRecentSales.map(
              s => [
                s.invoiceNo,
                s.customerId?.name ||
                  'Walk-in',
                money(s.total),
                money(s.amountPaid),

                <span
                  className={
                    'badge ' +
                    (s.total >
                    s.amountPaid
                      ? 'warn'
                      : '')
                  }
                >
                  {
                    s.total >
                    s.amountPaid
                      ? 'Udhaar'
                      : 'Paid'
                  }
                </span>
              ]
            )}
          />

        </div>


        <div className="card">

          <h3>
            Low Stock Alerts
          </h3>

          {visibleLowStock
            .slice(0, 8)
            .map(p => (
              <div
                className="alert-row"
                key={p._id}
              >
                <span>
                  {p.name}
                </span>

                <b>
                  {p.stockQuantity} left
                </b>
              </div>
            ))}

          {!visibleLowStock.length && (
            <p className="muted">
              No low-stock items.
            </p>
          )}

        </div>

      </div>
    </>
  );
}


// ======================================================
// COMMON
// ======================================================

function Stat({
  icon,
  title,
  value,
  warn,
  danger
}) {
  return (
    <div
      className={
        'card stat ' +
        (warn ? 'warn-card ' : '') +
        (danger ? 'danger-card' : '')
      }
    >
      <div className="stat-icon">
        {icon}
      </div>

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


function PageTitle({
  title,
  text,
  action
}) {
  return (
    <div className="page-title">

      <div>
        <h2>
          {title}
        </h2>

        <p>
          {text}
        </p>
      </div>

      {action}

    </div>
  );
}


function Loading() {
  return (
    <div className="card loading">
      Loading...
    </div>
  );
}


function Table({
  heads,
  rows
}) {
  return (
    <div className="table-wrap">

      <table>

        <thead>
          <tr>
            {heads.map(h => (
              <th key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>

          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((x, j) => (
                  <td key={j}>
                    {x}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={heads.length}
                className="empty"
              >
                No records yet.
              </td>
            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}


// ======================================================
// GENERIC CRUD
// ======================================================

function Crud({
  title,
  endpoint,
  fields,
  heads,
  renderRow,
  extra
}) {

  const [data, setData] =
    useState([]);

  const [form, setForm] =
    useState({});

  const [busy, setBusy] =
    useState(false);


  const load = async () => {
    try {
      const result =
        await api('/' + endpoint);

      setData(
        filterVisible(
          endpoint,
          result
        )
      );

    } catch (e) {
      alert(e.message);
    }
  };


  useEffect(() => {
    load();

    const refresh =
      () => load();

    window.addEventListener(
      'trash-updated',
      refresh
    );

    return () =>
      window.removeEventListener(
        'trash-updated',
        refresh
      );
  }, [endpoint]);


  async function add(e) {
    e.preventDefault();

    setBusy(true);

    try {

      await api('/' + endpoint, {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setForm({});

      load();

    } catch (e) {
      alert(e.message);

    } finally {
      setBusy(false);
    }
  }


  function del(item) {

    if (
      !confirm(
        'Move this record to Trash?'
      )
    ) {
      return;
    }

    moveToTrash(
      endpoint,
      item
    );

    load();
  }


  return (
    <>

      <PageTitle
        title={title}
        text={
          `Manage ${title.toLowerCase()}.`
        }
        action={extra}
      />


      <div className="card form-card">

        <form
          className="form-grid"
          onSubmit={add}
        >

          {fields.map(f => (
            <input
              key={f.key}
              className="input"
              type={
                f.type || 'text'
              }
              placeholder={f.label}
              value={
                form[f.key] ?? ''
              }
              onChange={e =>
                setForm({
                  ...form,
                  [f.key]:
                    f.type === 'number'
                      ? Number(
                          e.target.value
                        )
                      : e.target.value
                })
              }
              required={
                f.required ??
                f.key === 'name'
              }
            />
          ))}


          <button
            className="btn"
            disabled={busy}
          >
            <Plus size={16} />

            {busy
              ? 'Saving...'
              : 'Add'}
          </button>

        </form>

      </div>


      <div className="card">

        <Table
          heads={[
            ...heads,
            'Action'
          ]}
          rows={data.map(x => [
            ...renderRow(x),

            <button
              className="icon danger"
              title="Move to Trash"
              onClick={() =>
                del(x)
              }
            >
              <Trash2 size={16} />
            </button>
          ])}
        />

      </div>

    </>
  );
}


// ======================================================
// PRODUCTS
// ======================================================

function Products() {

  return (
    <Crud
      title="Products"
      endpoint="products"

      fields={[
        {
          key: 'name',
          label: 'Product name'
        },
        {
          key: 'category',
          label: 'Category',
          required: false
        },
        {
          key: 'purchasePrice',
          label: 'Purchase price',
          type: 'number',
          required: false
        },
        {
          key: 'sellingPrice',
          label: 'Selling price',
          type: 'number',
          required: false
        },
        {
          key: 'stockQuantity',
          label: 'Stock',
          type: 'number',
          required: false
        },
        {
          key: 'reorderLevel',
          label: 'Reorder level',
          type: 'number',
          required: false
        },
        {
          key: 'preferredReorderQty',
          label: 'Reorder qty',
          type: 'number',
          required: false
        }
      ]}

      heads={[
        'Product',
        'Category',
        'Purchase',
        'Selling',
        'Stock',
        'Status'
      ]}

      renderRow={p => [
        p.name,
        p.category || '—',
        money(p.purchasePrice),
        money(p.sellingPrice),
        p.stockQuantity,

        <span
          className={
            'badge ' +
            (p.stockQuantity <=
            p.reorderLevel
              ? 'danger'
              : '')
          }
        >
          {
            p.stockQuantity <=
            p.reorderLevel
              ? 'Low'
              : 'OK'
          }
        </span>
      ]}
    />
  );
}


// ======================================================
// CUSTOMERS
// ======================================================

function Customers() {

  const [refresh, setRefresh] =
    useState(0);

  return (
    <Crud
      key={refresh}
      title="Customers"
      endpoint="customers"

      fields={[
        {
          key: 'name',
          label: 'Customer name'
        },
        {
          key: 'phone',
          label: 'Phone',
          required: false
        },
        {
          key: 'address',
          label: 'Address',
          required: false
        }
      ]}

      heads={[
        'Name',
        'Phone',
        'Udhaar',
        'Purchases'
      ]}

      renderRow={c => [
        c.name,
        c.phone || '—',
        money(c.outstanding),
        money(c.totalPurchases)
      ]}

      extra={
        <button
          className="btn secondary"
          onClick={() =>
            setRefresh(x => x + 1)
          }
        >
          Refresh
        </button>
      }
    />
  );
}


// ======================================================
// SUPPLIERS
// ======================================================

function Suppliers() {

  return (
    <Crud
      title="Suppliers"
      endpoint="suppliers"

      fields={[
        {
          key: 'name',
          label: 'Supplier name'
        },
        {
          key: 'phone',
          label: 'Phone',
          required: false
        },
        {
          key: 'address',
          label: 'Address',
          required: false
        }
      ]}

      heads={[
        'Name',
        'Phone',
        'Address'
      ]}

      renderRow={s => [
        s.name,
        s.phone || '—',
        s.address || '—'
      ]}
    />
  );
}


// ======================================================
// EXPENSES
// ======================================================

function Expenses() {

  return (
    <Crud
      title="Expenses"
      endpoint="expenses"

      fields={[
        {
          key: 'title',
          label: 'Expense title'
        },
        {
          key: 'category',
          label: 'Category',
          required: false
        },
        {
          key: 'amount',
          label: 'Amount',
          type: 'number'
        },
        {
          key: 'note',
          label: 'Note',
          required: false
        }
      ]}

      heads={[
        'Title',
        'Category',
        'Amount',
        'Note'
      ]}

      renderRow={e => [
        e.title,
        e.category || '—',
        money(e.amount),
        e.note || '—'
      ]}
    />
  );
}


// ======================================================
// SALES
// ======================================================

function Sales() {

  const [p, setP] =
    useState([]);

  const [c, setC] =
    useState([]);

  const [pid, setPid] =
    useState('');

  const [cid, setCid] =
    useState('');

  const [qty, setQty] =
    useState(1);

  const [paid, setPaid] =
    useState('');

  const [sales, setSales] =
    useState([]);


  const load = async () => {

    try {

      const [
        products,
        customers,
        salesData
      ] = await Promise.all([
        api('/products'),
        api('/customers'),
        api('/sales')
      ]);

      setP(
        filterVisible(
          'products',
          products
        )
      );

      setC(
        filterVisible(
          'customers',
          customers
        )
      );

      setSales(
        filterVisible(
          'sales',
          salesData
        )
      );

    } catch (e) {
      alert(e.message);
    }
  };


  useEffect(() => {

    load();

    const refresh =
      () => load();

    window.addEventListener(
      'trash-updated',
      refresh
    );

    return () =>
      window.removeEventListener(
        'trash-updated',
        refresh
      );

  }, []);


  const product =
    p.find(
      x => x._id === pid
    );

  const total =
    product
      ? Number(product.sellingPrice) *
        Number(qty)
      : 0;


  async function submit(e) {

    e.preventDefault();

    if (!product) {
      alert(
        'Please select a product.'
      );
      return;
    }

    try {

      await api('/sales', {
        method: 'POST',

        body: JSON.stringify({
          customerId:
            cid || null,

          amountPaid:
            Number(paid || 0),

          items: [
            {
              productId: pid,
              quantity:
                Number(qty),
              unitPrice:
                product.sellingPrice
            }
          ]
        })
      });

      setPid('');
      setCid('');
      setQty(1);
      setPaid('');

      load();

      alert(
        'Sale recorded and stock updated.'
      );

    } catch (e) {
      alert(e.message);
    }
  }


  function deleteSale(sale) {

    if (
      !confirm(
        'Move this sale to Trash?'
      )
    ) {
      return;
    }

    moveToTrash(
      'sales',
      sale
    );

    load();
  }


  return (
    <>

      <PageTitle
        title="Sales / POS"
        text="Record sales, reduce stock and track udhaar."
      />


      <div className="card">

        <form
          className="form-grid"
          onSubmit={submit}
        >

          <select
            className="select"
            value={pid}
            onChange={e =>
              setPid(e.target.value)
            }
            required
          >

            <option value="">
              Select product
            </option>

            {p.map(x => (
              <option
                key={x._id}
                value={x._id}
              >
                {x.name} —{' '}
                {money(
                  x.sellingPrice
                )}{' '}
                ({x.stockQuantity})
              </option>
            ))}

          </select>


          <select
            className="select"
            value={cid}
            onChange={e =>
              setCid(e.target.value)
            }
          >

            <option value="">
              Walk-in Customer
            </option>

            {c
              .filter(
                x =>
                  x.name !==
                  'Walk-in Customer'
              )
              .map(x => (
                <option
                  key={x._id}
                  value={x._id}
                >
                  {x.name}
                </option>
              ))}

          </select>


          <input
            className="input"
            type="number"
            min="1"
            value={qty}
            onChange={e =>
              setQty(e.target.value)
            }
            placeholder="Quantity"
            required
          />


          <input
            className="input"
            type="number"
            min="0"
            value={paid}
            onChange={e =>
              setPaid(e.target.value)
            }
            placeholder="Amount paid"
          />


          <div className="total-box">
            Total:{' '}
            <b>
              {money(total)}
            </b>
          </div>


          <button className="btn">
            <ShoppingCart size={16} />
            Complete Sale
          </button>

        </form>

      </div>


      <div className="card">

        <h3>
          Sales History
        </h3>

        <Table
          heads={[
            'Invoice',
            'Customer',
            'Total',
            'Paid',
            'Payment',
            'Action'
          ]}

          rows={sales.map(s => [
            s.invoiceNo,
            s.customerId?.name ||
              'Walk-in',
            money(s.total),
            money(s.amountPaid),
            s.paymentMethod,

            <button
              className="icon danger"
              title="Move to Trash"
              onClick={() =>
                deleteSale(s)
              }
            >
              <Trash2 size={16} />
            </button>
          ])}
        />

      </div>

    </>
  );
}


// ======================================================
// PURCHASES
// ======================================================

function Purchases() {

  const [p, setP] =
    useState([]);

  const [s, setS] =
    useState([]);

  const [history, setHistory] =
    useState([]);

  const [pid, setPid] =
    useState('');

  const [sid, setSid] =
    useState('');

  const [qty, setQty] =
    useState(1);

  const [cost, setCost] =
    useState('');

  const [paid, setPaid] =
    useState('');


  const load = async () => {

    try {

      const [
        products,
        suppliers,
        purchaseData
      ] = await Promise.all([
        api('/products'),
        api('/suppliers'),
        api('/purchases')
      ]);

      setP(
        filterVisible(
          'products',
          products
        )
      );

      setS(
        filterVisible(
          'suppliers',
          suppliers
        )
      );

      setHistory(
        filterVisible(
          'purchases',
          purchaseData
        )
      );

    } catch (e) {
      alert(e.message);
    }
  };


  useEffect(() => {

    load();

    const refresh =
      () => load();

    window.addEventListener(
      'trash-updated',
      refresh
    );

    return () =>
      window.removeEventListener(
        'trash-updated',
        refresh
      );

  }, []);


  async function submit(e) {

    e.preventDefault();

    try {

      await api('/purchases', {
        method: 'POST',

        body: JSON.stringify({
          supplierId:
            sid || null,

          amountPaid:
            Number(paid || 0),

          items: [
            {
              productId: pid,
              quantity:
                Number(qty),
              unitCost:
                Number(cost)
            }
          ]
        })
      });

      setPid('');
      setSid('');
      setQty(1);
      setCost('');
      setPaid('');

      load();

      alert(
        'Purchase recorded and stock increased.'
      );

    } catch (e) {
      alert(e.message);
    }
  }


  function deletePurchase(item) {

    if (
      !confirm(
        'Move this purchase to Trash?'
      )
    ) {
      return;
    }

    moveToTrash(
      'purchases',
      item
    );

    load();
  }


  return (
    <>

      <PageTitle
        title="Purchases"
        text="Record incoming stock."
      />


      <div className="card">

        <form
          className="form-grid"
          onSubmit={submit}
        >

          <select
            className="select"
            value={pid}
            onChange={e =>
              setPid(e.target.value)
            }
            required
          >

            <option value="">
              Select product
            </option>

            {p.map(x => (
              <option
                key={x._id}
                value={x._id}
              >
                {x.name}
              </option>
            ))}

          </select>


          <select
            className="select"
            value={sid}
            onChange={e =>
              setSid(e.target.value)
            }
          >

            <option value="">
              Select supplier
            </option>

            {s.map(x => (
              <option
                key={x._id}
                value={x._id}
              >
                {x.name}
              </option>
            ))}

          </select>


          <input
            className="input"
            type="number"
            min="1"
            value={qty}
            onChange={e =>
              setQty(e.target.value)
            }
            placeholder="Quantity"
          />


          <input
            className="input"
            type="number"
            min="0"
            value={cost}
            onChange={e =>
              setCost(e.target.value)
            }
            placeholder="Unit cost"
            required
          />


          <input
            className="input"
            type="number"
            min="0"
            value={paid}
            onChange={e =>
              setPaid(e.target.value)
            }
            placeholder="Amount paid"
          />


          <button className="btn">
            <Plus size={16} />
            Save Purchase
          </button>

        </form>

      </div>


      <div className="card">

        <h3>
          Purchase History
        </h3>

        <Table
          heads={[
            'Invoice',
            'Supplier',
            'Total',
            'Paid',
            'Action'
          ]}

          rows={history.map(x => [
            x.invoiceNo,
            x.supplierId?.name ||
              '—',
            money(x.total),
            money(x.amountPaid),

            <button
              className="icon danger"
              title="Move to Trash"
              onClick={() =>
                deletePurchase(x)
              }
            >
              <Trash2 size={16} />
            </button>
          ])}
        />

      </div>

    </>
  );
}


// ======================================================
// UDHAAR
// ======================================================

function Udhaar() {

  const [c, setC] =
    useState([]);

  const [cid, setCid] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [note, setNote] =
    useState('');


  const load = async () => {

    try {

      const data =
        await api('/customers');

      setC(
        filterVisible(
          'customers',
          data
        )
      );

    } catch (e) {
      alert(e.message);
    }
  };


  useEffect(() => {

    load();

    const refresh =
      () => load();

    window.addEventListener(
      'trash-updated',
      refresh
    );

    return () =>
      window.removeEventListener(
        'trash-updated',
        refresh
      );

  }, []);


  async function pay(e) {

    e.preventDefault();

    try {

      await api('/payments', {
        method: 'POST',

        body: JSON.stringify({
          customerId: cid,
          amount:
            Number(amount),
          note
        })
      });

      setAmount('');
      setNote('');

      load();

      alert(
        'Payment received. Udhaar reduced.'
      );

    } catch (e) {
      alert(e.message);
    }
  }


  return (
    <>

      <PageTitle
        title="Udhaar / Credit"
        text="Track outstanding customer balances and receive payments."
      />


      <div className="card">

        <form
          className="form-grid"
          onSubmit={pay}
        >

          <select
            className="select"
            value={cid}
            onChange={e =>
              setCid(e.target.value)
            }
            required
          >

            <option value="">
              Select customer
            </option>

            {c
              .filter(
                x =>
                  x.outstanding > 0
              )
              .map(x => (
                <option
                  key={x._id}
                  value={x._id}
                >
                  {x.name} —{' '}
                  {money(
                    x.outstanding
                  )}
                </option>
              ))}

          </select>


          <input
            className="input"
            type="number"
            min="1"
            value={amount}
            onChange={e =>
              setAmount(e.target.value)
            }
            placeholder="Payment amount"
            required
          />


          <input
            className="input"
            value={note}
            onChange={e =>
              setNote(e.target.value)
            }
            placeholder="Note (optional)"
          />


          <button className="btn">
            <HandCoins size={16} />
            Receive Payment
          </button>

        </form>

      </div>


      <div className="card">

        <Table
          heads={[
            'Customer',
            'Phone',
            'Total Purchases',
            'Outstanding',
            'Status'
          ]}

          rows={c.map(x => [
            x.name,
            x.phone || '—',
            money(
              x.totalPurchases
            ),
            money(
              x.outstanding
            ),

            <span
              className={
                'badge ' +
                (x.outstanding
                  ? 'warn'
                  : '')
              }
            >
              {
                x.outstanding
                  ? 'Unpaid'
                  : 'Paid'
              }
            </span>
          ])}
        />

      </div>

    </>
  );
}


// ======================================================
// DEMAND
// ======================================================

function Demand() {

  const [d, setD] =
    useState([]);


  const load = async () => {

    try {

      const data =
        await api('/demand');

      setD(
        data.filter(
          x =>
            !isTrashed(
              'products',
              x._id
            ) &&
            !isHidden(
              'products',
              x._id
            )
        )
      );

    } catch (e) {
      alert(e.message);
    }
  };


  useEffect(() => {

    load();

    const refresh =
      () => load();

    window.addEventListener(
      'trash-updated',
      refresh
    );

    return () =>
      window.removeEventListener(
        'trash-updated',
        refresh
      );

  }, []);


  return (
    <>

      <PageTitle
        title="Demand & Stock"
        text="See sales demand and reorder suggestions."
      />

      <div className="card">

        <Table
          heads={[
            'Product',
            '30+ Day Sales',
            'Current Stock',
            'Reorder Point',
            'Suggested Qty',
            'Demand'
          ]}

          rows={d.map(x => [
            x.name,
            x.soldUnits,
            x.stockQuantity,
            x.reorderLevel,
            x.suggestedQty,

            <span
              className={
                'badge ' +
                (
                  x.demand === 'High'
                    ? 'danger'
                    : x.demand === 'Medium'
                    ? 'warn'
                    : ''
                )
              }
            >
              {x.demand}
            </span>
          ])}
        />

      </div>

    </>
  );
}


// ======================================================
// REPORTS
// ======================================================

function Reports() {

  const [r, setR] =
    useState(null);


  useEffect(() => {

    api('/reports')
      .then(setR)
      .catch(e =>
        alert(e.message)
      );

  }, []);


  if (!r) {
    return <Loading />;
  }


  return (
    <>

      <PageTitle
        title="Reports"
        text="Financial snapshot from your recorded transactions."
      />


      <div className="cards">

        <Stat
          icon={<BarChart3 />}
          title="Sales Revenue"
          value={money(r.revenue)}
        />

        <Stat
          icon={<ShoppingBag />}
          title="Purchases"
          value={money(r.purchases)}
        />

        <Stat
          icon={<Receipt />}
          title="Expenses"
          value={money(r.expenses)}
        />

        <Stat
          icon={<TrendingUp />}
          title="Estimated Profit"
          value={money(
            r.estimatedProfit
          )}
        />

      </div>


      <div className="two">

        <div className="card">

          <h3>
            Outstanding Udhaar
          </h3>

          <strong className="big-number">
            {money(r.receivable)}
          </strong>

        </div>


        <div className="card">

          <h3>
            Inventory Value
          </h3>

          <strong className="big-number">
            {money(
              r.inventoryValue
            )}
          </strong>

        </div>

      </div>

    </>
  );
}


// ======================================================
// TRASH PAGE
// ======================================================

const trashNames = {
  products: 'Product',
  customers: 'Customer',
  suppliers: 'Supplier',
  expenses: 'Expense',
  sales: 'Sale',
  purchases: 'Purchase'
};


function getTrashDisplayName(item) {

  const data =
    item.data || {};

  if (
    item.type === 'products' ||
    item.type === 'customers' ||
    item.type === 'suppliers'
  ) {
    return (
      data.name ||
      'Unnamed record'
    );
  }

  if (item.type === 'expenses') {
    return (
      data.title ||
      'Expense'
    );
  }

  if (
    item.type === 'sales' ||
    item.type === 'purchases'
  ) {
    return (
      data.invoiceNo ||
      'Transaction'
    );
  }

  return 'Record';
}


function TrashPage() {

  const [trash, setTrash] =
    useState([]);


  const load = () => {
    setTrash(getTrash());
  };


  useEffect(() => {

    load();

    const refresh =
      () => load();

    window.addEventListener(
      'trash-updated',
      refresh
    );

    return () =>
      window.removeEventListener(
        'trash-updated',
        refresh
      );

  }, []);


  function restore(item) {

    restoreFromTrash(
      item.type,
      item.id
    );
  }


  function permanent(item) {

    if (
      !confirm(
        'Permanently remove this record from the frontend?'
      )
    ) {
      return;
    }

    permanentlyDelete(
      item.type,
      item.id
    );
  }


  function empty() {

    if (!trash.length) {
      return;
    }

    if (
      !confirm(
        'Empty Trash? All these records will be permanently hidden from the frontend.'
      )
    ) {
      return;
    }

    emptyTrash();
  }


  return (
    <>

      <PageTitle
        title="Trash"
        text="Temporarily deleted records are stored here."
        action={
          trash.length > 0 && (
            <button
              className="btn secondary"
              onClick={empty}
            >
              <Trash size={16} />
              Empty Trash
            </button>
          )
        }
      />


      <div className="card">

        <Table
          heads={[
            'Type',
            'Record',
            'Deleted On',
            'Action'
          ]}

          rows={trash.map(item => [
            trashNames[item.type] ||
              item.type,

            getTrashDisplayName(
              item
            ),

            new Date(
              item.deletedAt
            ).toLocaleString(),

            <div
              style={{
                display: 'flex',
                gap: '8px'
              }}
            >

              <button
                className="icon"
                title="Restore"
                onClick={() =>
                  restore(item)
                }
              >
                <RotateCcw
                  size={16}
                />
              </button>


              <button
                className="icon danger"
                title="Delete Permanently"
                onClick={() =>
                  permanent(item)
                }
              >
                <Trash2
                  size={16}
                />
              </button>

            </div>
          ])}
        />

      </div>

    </>
  );
}


// ======================================================
// SETTINGS
// ======================================================

function SettingsPage() {

  return (
    <>

      <PageTitle
        title="Settings"
        text="Store and system information."
      />


      <div className="card settings">

        <p>
          <b>Store:</b>{' '}
          Abdul Rehman General Store
        </p>

        <p>
          <b>Currency:</b>{' '}
          PKR (Rs.)
        </p>

        <p>
          <b>Database:</b>{' '}
          MongoDB / Mongoose
        </p>

        <p>
          <b>Frontend:</b>{' '}
          React + Vite
        </p>

        <p>
          <b>Backend:</b>{' '}
          Node.js + Express
        </p>

        <p>
          <b>Chatbot:</b>{' '}
          Database-aware Store Assistant
        </p>

      </div>

    </>
  );
}


// ======================================================
// CHATBOT
// ======================================================

function Chatbot() {

  const [open, setOpen] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const [messages, setMessages] =
    useState([
      {
        role: 'bot',
        text:
          'Hi! I am your Store Assistant. Ask me about stock, sales, products, purchases or udhaar.'
      }
    ]);


  async function send(e) {

    e?.preventDefault();

    if (!msg.trim()) {
      return;
    }

    const m = msg;

    setMsg('');

    setMessages(x => [
      ...x,
      {
        role: 'user',
        text: m
      }
    ]);


    try {

      const d = await api(
        '/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            message: m
          })
        }
      );

      setMessages(x => [
        ...x,
        {
          role: 'bot',
          text: d.reply
        }
      ]);

    } catch (e) {

      setMessages(x => [
        ...x,
        {
          role: 'bot',
          text: e.message
        }
      ]);

    }
  }


  return (
    <>

      <button
        className="chat-fab"
        onClick={() =>
          setOpen(!open)
        }
      >
        {open ? (
          <X />
        ) : (
          <MessageCircle />
        )}
      </button>


      {open && (

        <div className="chat">

          <div className="chat-head">

            <b>
              Store Assistant
            </b>

            <button
              onClick={() =>
                setOpen(false)
              }
            >
              <X size={16} />
            </button>

          </div>


          <div className="chat-body">

            {messages.map(
              (m, i) => (
                <div
                  key={i}
                  className={
                    'bubble ' +
                    m.role
                  }
                >
                  {m.text}
                </div>
              )
            )}

          </div>


          <form
            onSubmit={send}
            className="chat-form"
          >

            <input
              value={msg}
              onChange={e =>
                setMsg(e.target.value)
              }
              placeholder="Ask about your store..."
            />

            <button className="btn">
              Send
            </button>

          </form>

        </div>

      )}

    </>
  );
}


// ======================================================
// APP ROUTES
// ======================================================

function App() {

  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />


      <Route element={<Guard />}>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/sales"
          element={<Sales />}
        />

        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/udhaar"
          element={<Udhaar />}
        />

        <Route
          path="/purchases"
          element={<Purchases />}
        />

        <Route
          path="/suppliers"
          element={<Suppliers />}
        />

        <Route
          path="/demand"
          element={<Demand />}
        />

        <Route
          path="/expenses"
          element={<Expenses />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/trash"
          element={<TrashPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

      </Route>


      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}


// ======================================================
// START
// ======================================================

createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);