import React, { useMemo, useState } from "react";
import {
  // Tab icons
  List,
  Shield,
  Plus,
  Settings,
  // Top/search & CTAs
  Search,
  MessageCircle,
  ArrowLeft,
  // Stat chips (replaced Grid2x2 with LayoutGrid to avoid CDN icon fetch error)
  LayoutGrid,
  PlayCircle,
  Ban,
  Calendar,
  MapPin,
  IdCard,
  XCircle,
  // Slider controls
  ChevronLeft,
  ChevronRight,
  // Admins
  Star,
  Flag,
  BadgeCheck,
  KeyRound,
  Clipboard,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";

// Escrow Marketplace — Mobile UI (Dark)
// This revision fixes a ReferenceError by defining EXCLUDED_ADMINS at module scope
// and removing a stray inner definition. Also retains the previous fix for an
// unterminated string constant and other compile issues.

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

// ---------- Small util + inline tests ----------
export function formatUSD(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "USD —";
  return `USD $${n.toLocaleString("en-US")}`;
}
// Lightweight self-checks (won't throw in production envs, helpful in sandboxes)
console.assert(formatUSD(1700) === "USD $1,700", "formatUSD(1700) failed");
console.assert(formatUSD(undefined) === "USD —", "formatUSD(undefined) failed");
console.assert(formatUSD(0) === "USD $0", "formatUSD(0) failed");
console.assert(formatUSD(Number.NaN) === "USD —", "formatUSD(NaN) failed");
console.assert(cx("a", "", null, "b") === "a b", "cx helper failed");

// A couple of extra checks
function maskCode(code) {
  if (!code) return "—";
  const tail = code.slice(-5);
  return `•••••••••••••••••${tail}`;
}
console.assert(maskCode("SK-ABCDE-ABCDE-ABCDE-ABCDE").endsWith("ABCDE"), "maskCode tail failed");

// ---------- UI atoms ----------
const StatChip = ({ icon: Icon, label, tone = "default" }) => {
  const toneCls =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-white";
  const iconCls =
    tone === "danger" ? "text-red-300" : tone === "success" ? "text-emerald-300" : "text-white/90";

  return (
    <div className={`flex items-center gap-1 rounded-full border ${toneCls} px-2.5 py-1 text-[13px] leading-none`}>
      <Icon className={`h-4 w-4 ${iconCls}`} />
      <span className="opacity-90">{label}</span>
    </div>
  );
};

const DealToggle = ({ value, onChange }) => (
  <div className="inline-flex w-fit items-center whitespace-nowrap rounded-full bg-white/5 p-0.5 border border-white/10">
    {[
      { key: "instant", label: "Instant deal" },
      { key: "7day", label: "7 days deal" },
    ].map((opt) => {
      const active = value === opt.key;
      return (
        <button
          key={opt.key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(opt.key);
          }}
          className={cx(
            "flex-none min-w-[90px] px-3.5 py-1.5 text-[13px] font-medium rounded-full transition",
            active ? "bg-white text-black shadow-sm" : "text-white/80 hover:text-white"
          )}
          aria-pressed={active}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const WhatsAppButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-base font-semibold text-black hover:bg-emerald-400 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-emerald-300"
    aria-label="Start WhatsApp chat"
  >
    <MessageCircle className="h-5 w-5" />
    WhatsApp
  </button>
);

// Secondary: external developer-page link (next to titles)
const GooglePlayLink = ({ href, stopClick = true }) => (
  <a
    href={href || "https://play.google.com/console"}
    target="_blank"
    rel="noopener noreferrer"
    onClick={stopClick ? (e) => e.stopPropagation() : undefined}
    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[13px] font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
    aria-label="Visit developer page"
  >
    <LinkIcon className="h-4 w-4" />
    Visit
  </a>
);

// Compact button for Admins list
const WhatsAppMini = ({ onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      "inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-500/90 h-9 min-w-[128px] px-3.5 text-sm font-semibold text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300",
      className
    )}
    aria-label="Start WhatsApp chat"
  >
    <MessageCircle className="h-4 w-4" />
    WhatsApp
  </button>
);

// Avatar (initials fallback)
const Avatar = ({ name = "?", src }) => {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-white/90">{initials}</span>
      )}
    </div>
  );
};

// ---------- Seller Code helpers ----------
const SELLER_CODE_KEY = "seller_code";
const SELLER_CODE_REGEX = /^SK-[A-Z2-9]{5}(?:-[A-Z2-9]{5}){3}$/;

function generateSellerCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  const groups = [];
  for (let g = 0; g < 4; g++) {
    let s = "";
    for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    groups.push(s);
  }
  return `SK-${groups.join("-")}`;
}

function saveSellerCode(code) {
  try {
    localStorage.setItem(SELLER_CODE_KEY, code);
  } catch (e) {}
}
function loadSellerCode() {
  try {
    return localStorage.getItem(SELLER_CODE_KEY) || "";
  } catch (e) {
    return "";
  }
}
async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  try {
    const tmp = document.createElement("textarea");
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    document.body.removeChild(tmp);
    return true;
  } catch (_) {
    return false;
  }
}
console.assert(SELLER_CODE_REGEX.test("SK-ABCDE-ABCDE-ABCDE-ABCDE"), "seller code regex failed");

// ---------- Card (Listing) ----------
const Card = ({ account, onChat, onOpen }) => {
  const [deal, setDeal] = useState("instant");

  return (
    <article
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] hover:bg-white/[0.05] transition cursor-pointer"
      role="button"
      onClick={onOpen}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[18px] font-semibold leading-tight truncate">
              <span className="inline-flex items-center gap-2 min-w-0">
                <img
                  src="https://freelogopng.com/images/all_img/1664285914google-play-logo-png.png"
                  alt="Google Play"
                  className="h-5 w-5 object-contain"
                />
                {account.title}
              </span>
            </h3>
            <GooglePlayLink href={account.playUrl} />
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[14px] font-semibold text-white/90">
          {formatUSD(account.price)}
        </span>
      </header>

      {/* Chips */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatChip icon={account.verified ? IdCard : XCircle} label={account.verified ? "Account verified with ID" : "Not verified"} />
        <StatChip icon={MapPin} label={`Country: ${account.country}`} />
        <StatChip icon={Calendar} label={`Year: ${account.year ?? "—"}`} />
        <StatChip icon={LayoutGrid} label={`Apps: ${account.stats.apps}`} />
        <StatChip icon={PlayCircle} label={`Live: ${account.stats.live}`} />
        <StatChip tone={account.stats.suspended === 0 ? "success" : "danger"} icon={Ban} label={`Suspended: ${account.stats.suspended}`} />
      </div>

      {/* Deal + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DealToggle value={deal} onChange={setDeal} />
        <WhatsAppButton
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
        />
      </div>
    </article>
  );
};

// ---------- TopBar & Tabs ----------
const TopBar = ({ title, search, setSearch, showSearch = true, onBack }) => (
  <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
    <div className="mx-auto w-full max-w-[480px] px-4 pt-3 pb-2">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-lg p-2 text-white/80 hover:bg-white/5 hover:text-white"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>
      {showSearch && (
        <label className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 focus-within:ring-2 focus-within:ring-white/20">
          <Search className="h-5 w-5 text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts, country, year…"
            className="w-full bg-transparent text-base placeholder:text-white/40 focus:outline-none"
            aria-label="Search"
          />
        </label>
      )}
    </div>
  </div>
);

const TabBar = ({ active, onChange }) => {
  const tabs = [
    { key: "sale", label: "For Sale", icon: List },
    { key: "admins", label: "Admins", icon: Shield },
    { key: "sell", label: "Sell", icon: Plus },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-neutral-950/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="mx-auto grid w-full max-w-[480px] grid-cols-4 gap-1 px-2 py-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cx(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-sm",
                isActive ? "text-white" : "text-white/60 hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cx("h-6 w-6", isActive ? "" : "opacity-80")} />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ---------- Details page ----------
const ScreenshotSlider = ({ images = [], labels = [] }) => {
  const [index, setIndex] = React.useState(0);
  const slides = labels.map((label, i) => ({
    label,
    src:
      images[i] ||
      `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
          <defs>
            <linearGradient id='g${i}' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0' stop-color='#0b0f1a'/>
              <stop offset='1' stop-color='#1f2937'/>
            </linearGradient>
          </defs>
          <rect width='1600' height='900' fill='url(#g${i})'/>
          <text x='50%' y='50%' fill='#d1d5db' font-size='56' font-family='Inter,Arial' dominant-baseline='middle' text-anchor='middle'>${label}</text>
        </svg>`
      )}`,
  }));
  const count = slides.length || 1;
  const go = (dir) => setIndex((i) => (i + dir + count) % count);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <figure key={i} className="min-w-full">
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img src={s.src} alt={s.label} className="h-full w-full object-cover" />
            </div>
            <figcaption className="px-3 py-2 text-sm text-white/70">{s.label}</figcaption>
          </figure>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Next screenshot"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
};

const DetailsScreen = ({ account, onChat }) => {
  const [deal, setDeal] = useState("instant");

  const shots = [
    { label: "Compte à valider · Alerte suppression (banner)", key: "validate" },
    { label: "Developer Registration Fee · reçu (2021-12-27)", key: "receipt" },
    { label: "Liste des apps · installations & mises à jour", key: "apps" },
    { label: "Transfert d'applications · écran", key: "transfer" },
  ];

  return (
    <section className="grid gap-4">
      {/* Header card */}
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[19px] font-semibold leading-tight truncate">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <img
                    src="https://freelogopng.com/images/all_img/1664285914google-play-logo-png.png"
                    alt="Google Play"
                    className="h-5 w-5 object-contain"
                  />
                  {account.title}
                </span>
              </h2>
              <GooglePlayLink href={account.playUrl} stopClick={false} />
            </div>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[14px] font-semibold text-white/90">
            {formatUSD(account.price)}
          </span>
        </header>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatChip icon={account.verified ? IdCard : XCircle} label={account.verified ? "Account verified with ID" : "Not verified"} />
          <StatChip icon={MapPin} label={`Country: ${account.country}`} />
          <StatChip icon={Calendar} label={`Year: ${account.year ?? "—"}`} />
          <StatChip icon={LayoutGrid} label={`Apps: ${account.stats.apps}`} />
          <StatChip icon={PlayCircle} label={`Live: ${account.stats.live}`} />
          <StatChip tone={account.stats.suspended === 0 ? "success" : "danger"} icon={Ban} label={`Suspended: ${account.stats.suspended}`} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DealToggle value={deal} onChange={setDeal} />
          <WhatsAppButton onClick={onChat} />
        </div>
      </article>

      {/* Screenshots slider */}
      <ScreenshotSlider images={shots.map((s, i) => account.images?.[i])} labels={shots.map((s) => s.label)} />
    </section>
  );
};

// ---------- Admins ----------
// Define which admins to exclude (removed from list)
const EXCLUDED_ADMINS = ["Nadia Zahra"]; // extend as needed

// Half star: outline star with a 50% filled overlay
const HalfStar = () => (
  <span className="relative inline-block h-5 w-5 align-middle">
    <Star className="h-5 w-5 text-white/25" fill="none" strokeWidth={1.5} />
    <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
      <Star className="h-5 w-5 text-yellow-400" fill="currentColor" stroke="none" />
    </span>
  </span>
);

const StarRow = ({ rating = 4.5 }) => {
  const full = Math.floor(rating);
  // For any rating between 4 and 5 (exclusive), show a half star.
  const needsHalf = rating < 5 && rating >= 4;
  const items = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) items.push("full");
    else if (i === full && needsHalf) items.push("half");
    else items.push("empty");
  }
  return (
    <div className="flex items-center gap-1">
      {items.map((t, i) =>
        t === "full" ? (
          <Star key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" stroke="none" />
        ) : t === "half" ? (
          <HalfStar key={i} />
        ) : (
          <Star key={i} className="h-5 w-5 text-white/25" fill="none" strokeWidth={1.5} />
        )
      )}
      <span className="ml-1 text-sm text-white/70">{rating.toFixed(1)}</span>
    </div>
  );
};

const AdminsScreen = () => {
  const admins = [
    { name: "Qousain Khan", rating: 4.9, deals: 412, photo: "https://i.imgur.com/Xk9OqdY.png" },
    { name: "Nauman Chaudhary", rating: 4.8, deals: 523, photo: "https://i.imgur.com/AaFiZhE.jpeg" },
    { name: "Ad Khan", rating: 4.7, deals: 434, photo: "https://i.imgur.com/CYTG6Oa.jpeg" },
    { name: "Sara Kettani", rating: 4.6, deals: 389 },
    { name: "Hamza Ramzi", rating: 4.5, deals: 276 },
    { name: "Nadia Zahra", rating: 4.4, deals: 241 },
  ];

  return (
    <section className="grid gap-3">
      {admins.filter(ad => !EXCLUDED_ADMINS.includes(ad.name)).map((ad, idx) => (
        <article key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05] transition">
          {/* Row 1: Avatar + Name + Stars */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-3">
            <Avatar name={ad.name} src={ad.photo} />
            <div className="min-w-0">
              {/* Top row: name + verified (left) and stars (right) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex-1 min-w-0 truncate text-[17px] font-semibold">{ad.name}</span>
                  {idx < admins.length - 2 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-300">
                      <BadgeCheck className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                </div>
                <StarRow rating={ad.rating} />
              </div>
              {/* Deals under the name */}
              <p className="text-[13px] font-medium text-white/60 mt-0.5">{ad.deals.toLocaleString()} deals</p>
            </div>
          </div>

          {/* Row 2: Actions only */}
          <div className="mt-3 flex items-center gap-2">
            <WhatsAppMini className="flex-1" onClick={() => alert(`Start WhatsApp chat with ${ad.name}`)} />
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 h-8 min-w-[88px] px-3 text-xs font-medium text-white/60 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-white/20"
              aria-label={`Report ${ad.name}`}
            >
              <Flag className="h-3.5 w-3.5 text-white/70" />
              Report
            </button>
          </div>
        </article>
      ))}
    </section>
  );
};

// ---------- Sell screen ----------
const SellScreen = () => {
  const existing = loadSellerCode();
  const [mode, setMode] = useState(existing ? "unlock" : "setup"); // setup | unlock | ready
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [msg, setMsg] = useState("");

  // simple listing form (enabled when mode === 'ready')
  const [form, setForm] = useState({
    title: "Google Play Account",
    country: "",
    year: "",
    price: "",
    verified: true,
    deal: "instant",
    apps: "",
    live: "",
    suspended: "",
    playUrl: "",
    whatsapp: "",
  });

  // Seller's existing listings (local/demo)
  const [sellerListings, setSellerListings] = useState([]);
  const seedListings = () => {
    if (sellerListings.length) return;
    const pool = [
      { title: "Google Play Account", country: "Morocco", year: 2020, price: 1100, verified: true, stats: { apps: 5, live: 5, suspended: 2 }, playUrl: "https://play.google.com/store/apps/dev?id=5258410538530331508" },
      { title: "Google Play Account", country: "India", year: 2019, price: 950, verified: false, stats: { apps: 3, live: 2, suspended: 1 }, playUrl: "https://play.google.com/store/apps/dev?id=8532907581042995001" },
      { title: "Google Play Account", country: "Egypt", year: 2021, price: 1380, verified: true, stats: { apps: 4, live: 4, suspended: 0 }, playUrl: "https://play.google.com/store/apps/developer?id=Masarat+App" },
    ];
    setSellerListings(pool);
  };

  const onCreateCode = () => {
    const c = generateSellerCode();
    setCode(c);
    setCopied(false);
    setSaved(false);
    setMode("setup");
  };

  const onContinueFromSetup = () => {
    if (!code || !SELLER_CODE_REGEX.test(code)) return setMsg("Code not generated");
    if (!saved) return setMsg("Please confirm you saved the code.");
    saveSellerCode(code);
    setMsg("");
    setMode("ready");
    seedListings();
  };

  const onUnlock = () => {
    if (!SELLER_CODE_REGEX.test(inputCode)) return setMsg("Invalid code format");
    const stored = loadSellerCode();
    if (stored && stored !== inputCode) return setMsg("Code doesn't match this device");
    saveSellerCode(inputCode);
    setMsg("");
    setMode("ready");
    seedListings();
  };

  const onLogout = () => {
    try { localStorage.removeItem(SELLER_CODE_KEY); } catch (e) {}
    setMode("unlock");
    setInputCode("");
    setMsg("");
  };

  const onSubmitListing = (e) => {
    e.preventDefault();
    const newItem = {
      title: form.title || "Google Play Account",
      country: form.country || "—",
      year: form.year || "—",
      price: Number(form.price || 0),
      verified: !!form.verified,
      stats: {
        apps: Number(form.apps || 0),
        live: Number(form.live || 0),
        suspended: Number(form.suspended || 0),
      },
      playUrl: form.playUrl || "",
      whatsapp: form.whatsapp || "",
      deal: form.deal || "instant",
    };
    setSellerListings((prev) => [newItem, ...prev]);
    setForm({ title: "Google Play Account", country: "", year: "", price: "", verified: true, deal: "instant", apps: "", live: "", suspended: "", playUrl: "", whatsapp: "" });
  };

  return (
    <section className="grid gap-3">
      {/* Card: Account creation or login via code */}
      {mode !== "ready" && (
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-[17px] font-semibold inline-flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Create new account or Login
          </h3>

          {/* Segmented switch */}
          <div className="mt-3">
            <div className="inline-flex rounded-full bg-white/5 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setMode("setup")}
                className={cx(
                  "min-w-[150px] px-4 py-2 text-[14px] font-medium rounded-full",
                  mode === "setup" ? "bg-white text-black" : "text-white/80 hover:text-white"
                )}
              >
                Create new account
              </button>
              <button
                type="button"
                onClick={() => setMode("unlock")}
                className={cx(
                  "min-w-[120px] px-4 py-2 text-[14px] font-medium rounded-full",
                  mode === "unlock" ? "bg-white text-black" : "text-white/80 hover:text-white"
                )}
              >
                Login
              </button>
            </div>
          </div>

          {mode === "setup" && (
            <div className="mt-3 grid gap-3">
              {!code && (
                <button onClick={onCreateCode} className="w-fit rounded-xl bg-white text-black px-5 py-2.5 text-base font-semibold">
                  Generate account code
                </button>
              )}
              {code && (
                <div className="grid gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <p className="text-sm text-white/70">Your seller code (keep it safe):</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <code className="select-all rounded-lg bg-white/5 px-3 py-2 text-base tracking-widest">{code}</code>
                      <button
                        onClick={async () => {
                          const ok = await copyToClipboard(code);
                          setCopied(!!ok);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                      >
                        <Clipboard className="h-4 w-4 inline mr-2" /> Copy
                      </button>
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-sm text-white/80">
                      <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
                      I saved this code securely.
                    </label>
                  </div>
                  {msg && <p className="text-sm text-red-300">{msg}</p>}
                  <button onClick={onContinueFromSetup} className="w-fit rounded-xl bg-emerald-500 text-black px-5 py-2.5 text-base font-semibold">
                    <CheckCircle2 className="h-5 w-5 inline mr-2" /> Start selling
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "unlock" && (
            <div className="mt-3 grid gap-3">
              <p className="text-sm text-white/70">Paste your seller code to continue.</p>
              <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="SK-ABCDE-ABCDE-ABCDE-ABCDE"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base placeholder:text-white/40 focus:outline-none"
              />
              {msg && <p className="text-sm text-red-300">{msg}</p>}
              <div className="flex items-center gap-2">
                <button onClick={onUnlock} className="rounded-xl bg-white text-black px-5 py-2.5 text-base font-semibold">Login</button>
                <button onClick={onCreateCode} className="rounded-xl border border-white/10 px-5 py-2.5 text-base">Create new account</button>
              </div>
            </div>
          )}
        </article>
      )}

      {/* When ready: top status, then listings, then create form */}
      {mode === "ready" && (
        <>
          {/* Compact status card on top */}
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Seller access connected</span>
              </div>
              <div className="flex items-center gap-2"><code className="rounded-md bg-white/5 px-2 py-1 text-xs tracking-widest text-white/70">{maskCode(loadSellerCode())}</code><button onClick={onLogout} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5">Logout</button></div>
            </div>
          </article>

          {/* Your listings first */}
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h4 className="text-[16px] font-semibold">Your listings</h4>
            <div className="mt-2 grid gap-2">
              {sellerListings.map((it, i) => (
                <article key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <strong className="truncate">{it.title}</strong>
                      {it.playUrl && <GooglePlayLink href={it.playUrl} />}
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[13px] font-semibold text-white/90">
                      {formatUSD(it.price)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatChip icon={MapPin} label={`Country: ${it.country}`} />
                    <StatChip icon={Calendar} label={`Year: ${it.year}`} />
                    <StatChip icon={IdCard} label={it.verified ? "Verified ID" : "Not verified"} />
                    {it.deal && (
                      <StatChip icon={CheckCircle2} label={it.deal === 'instant' ? 'Instant deal' : '7 days deal'} />
                    )}
                    {it.stats && (
                      <>
                        <StatChip icon={LayoutGrid} label={`Apps: ${it.stats.apps ?? 0}`} />
                        <StatChip icon={PlayCircle} label={`Live: ${it.stats.live ?? 0}`} />
                        <StatChip tone={(it.stats?.suspended ?? 0) === 0 ? "success" : "danger"} icon={Ban} label={`Suspended: ${it.stats.suspended ?? 0}`} />
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </article>

          {/* Create Listing after listings */}
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-[17px] font-semibold">Create Listing</h3>
            <form onSubmit={onSubmitListing} className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-white/70">Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-sm text-white/70">Country</span>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-white/70">Year</span>
                  <input
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-sm text-white/70">Price (USD)</span>
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, "") })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                />
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="grid gap-1">
                  <span className="text-sm text-white/70">Apps</span>
                  <input
                    inputMode="numeric"
                    value={form.apps}
                    onChange={(e) => setForm({ ...form, apps: e.target.value.replace(/[^0-9]/g, "") })}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-white/70">Live</span>
                  <input
                    inputMode="numeric"
                    value={form.live}
                    onChange={(e) => setForm({ ...form, live: e.target.value.replace(/[^0-9]/g, "") })}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-white/70">Suspended</span>
                  <input
                    inputMode="numeric"
                    value={form.suspended}
                    onChange={(e) => setForm({ ...form, suspended: e.target.value.replace(/[^0-9]/g, "") })}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-sm text-white/70">Google Play developer page link (optional)</span>
                <input
                  value={form.playUrl}
                  onChange={(e) => setForm({ ...form, playUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/dev?id=..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-white/70">WhatsApp number</span>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+212 6.. or +34 ..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base focus:outline-none w-full"
                />
              </label>
              <label className="mt-1 inline-flex items-center gap-3 text-base text-white/90">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={form.verified}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                />
                Account verified with ID
              </label>
              <div className="grid gap-1">
                <span className="text-sm text-white/70">Deal type</span>
                <DealToggle value={form.deal} onChange={(v) => setForm({ ...form, deal: v })} />
              </div>
              <button className="mt-2 w-fit rounded-xl bg-white text-black px-5 py-2.5 text-base font-semibold">
                Publish Listing
              </button>
            </form>
          </article>
        </>
      )}
    </section>
  );
};

const SettingsScreen = () => (
  <section className="grid gap-3">
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-[17px] font-semibold">Settings</h3>
      <p className="mt-1 text-base text-white/70">Dark theme · Notifications · Privacy</p>
    </article>
  </section>
);

// ---------- App root ----------
// Random account generator for demo seeding
const GP_LINKS_POOL = [
  "https://play.google.com/store/apps/dev?id=5258410538530331508",
  "https://play.google.com/store/apps/dev?id=8532907581042995001",
  "https://play.google.com/store/apps/developer?id=Masarat+App",
  "https://play.google.com/store/apps/dev?id=5700313618786177705",
  "https://play.google.com/store/apps/dev?id=6091752745250081031",
];
const COUNTRIES_POOL = [
  { name: "Morocco", code: "ma" },
  { name: "Spain", code: "es" },
  { name: "Pakistan", code: "pk" },
  { name: "India", code: "in" },
  { name: "Egypt", code: "eg" },
  { name: "Turkey", code: "tr" },
  { name: "United States", code: "us" },
  { name: "United Kingdom", code: "uk" },
  { name: "Germany", code: "de" },
  { name: "France", code: "fr" },
  { name: "Indonesia", code: "id" },
  { name: "Bangladesh", code: "bd" },
  { name: "Vietnam", code: "vn" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "Mexico", code: "mx" },
  { name: "Brazil", code: "br" },
  { name: "Nigeria", code: "ng" },
  { name: "South Africa", code: "za" },
  { name: "Algeria", code: "dz" },
];
function randi(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randi(0, arr.length - 1)];
}
function makeRandomAccounts(n, demoImages) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = pick(COUNTRIES_POOL);
    const year = randi(2018, 2023);
    const apps = randi(2, 12);
    const live = randi(1, Math.max(1, apps - 1));
    const suspended = Math.max(0, randi(0, Math.min(3, apps - live)));
    const verified = Math.random() < 0.75;
    const base = 900 + apps * 60 + (verified ? 200 : 0);
    const price = base + randi(-120, 420);
    out.push({
      id: `${c.code}-${year}-${i}`,
      title: "Google Play Account",
      subtitle: verified ? "Fully verified account" : "Not verified account",
      verified,
      country: c.name,
      year,
      price,
      stats: { apps, live, suspended },
      playUrl: pick(GP_LINKS_POOL),
      images: demoImages,
    });
  }
  return out;
}

export default function Index() {
  const [active, setActive] = useState("sale");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // Default screenshots for all accounts (fixed the unterminated array)
  const demoImages = [
    "https://hxwdzbdonwhcunjyttjx.supabase.co/storage/v1/object/public/photos/123.PNG",
    "https://hxwdzbdonwhcunjyttjx.supabase.co/storage/v1/object/public/photos/1234354.PNG",
    "https://hxwdzbdonwhcunjyttjx.supabase.co/storage/v1/object/public/photos/dfhsdgy.PNG",
  ];

  const accounts = useMemo(() => makeRandomAccounts(10, demoImages), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => `${a.title} ${a.subtitle} ${a.country} ${a.year}`.toLowerCase().includes(q));
  }, [accounts, search]);

  const handleChat = (id) => {
    alert(`Start WhatsApp chat for listing: ${id}`);
  };

  const titles = {
    sale: "Accounts for Sale",
    admins: "Admins",
    sell: "Sell Your Account",
    settings: "Settings",
  };

  const inDetails = !!selected;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Top bar */}
      <TopBar
        title={inDetails ? selected.title : titles[active]}
        search={search}
        setSearch={setSearch}
        showSearch={!inDetails && active === "sale"}
        onBack={inDetails ? () => setSelected(null) : undefined}
      />

      {/* Content */}
      <main className="mx-auto w-full max-w-[480px] px-4 pb-28 pt-3">
        {inDetails ? (
          <DetailsScreen account={selected} onChat={() => handleChat(selected.id)} />
        ) : active === "sale" ? (
          <section className="grid gap-3">
            {filtered.map((a) => (
              <Card key={a.id} account={a} onChat={() => handleChat(a.id)} onOpen={() => setSelected(a)} />
            ))}
          </section>
        ) : active === "admins" ? (
          <AdminsScreen />
        ) : active === "sell" ? (
          <SellScreen />
        ) : (
          <SettingsScreen />)
        }
      </main>

      {/* Bottom tab bar stays on all pages */}
      <TabBar active={active} onChange={(k) => { setActive(k); setSelected(null); }} />
    </div>
  );
}