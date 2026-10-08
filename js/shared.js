/* Lovie Loops shared runtime: cart, orders, chat widget, floating hearts.
   Load on every page: <script src="js/shared.js"></script> */
(function () {
  'use strict';

  /* ---- Config ---- */
  const CONFIG = {
    whatsapp: '', /* TODO: real WhatsApp number, digits only with country code, e.g. '919876543210' */
    shop: 'Lovie Loops',
    keys: { cart: 'sl-cart', orders: 'sl-orders', profile: 'sl-profile', address: 'sl-address', chat: 'sl-chat' },
    shippingFreeOver: 25,
    shipping: 2,
  };

  /* ---- Helpers ---- */
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---- Cart ---- */
  const cart = {
    list: () => load(CONFIG.keys.cart, []),
    add(item) {
      const items = cart.list();
      const found = items.find((i) => i.id === item.id);
      if (found) found.qty += 1;
      else items.push({ ...item, qty: 1 });
      save(CONFIG.keys.cart, items);
      cart.notify();
    },
    setQty(id, qty) {
      const items = cart.list()
        .map((i) => (i.id === id ? { ...i, qty: qty } : i))
        .filter((i) => i.qty > 0);
      save(CONFIG.keys.cart, items);
      cart.notify();
    },
    clear() { save(CONFIG.keys.cart, []); cart.notify(); },
    count: () => cart.list().reduce((n, i) => n + i.qty, 0),
    subtotal: () => cart.list().reduce((n, i) => n + i.qty * i.price, 0),
    notify() {
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        el.textContent = cart.count();
        el.classList.remove('bump');
        void el.offsetWidth; /* restart animation */
        el.classList.add('bump');
      });
    },
  };

  /* ---- Orders ---- */
  const orders = {
    list: () => load(CONFIG.keys.orders, []),
    add(o) { const all = orders.list(); all.unshift(o); save(CONFIG.keys.orders, all); },
    clear() { save(CONFIG.keys.orders, []); },
  };

  /* ---- Profile & address ---- */
  const store = {
    profile: () => load(CONFIG.keys.profile, { name: '', email: '', phone: '' }),
    saveProfile: (p) => save(CONFIG.keys.profile, p),
    address: () => load(CONFIG.keys.address, { name: '', phone: '', line1: '', line2: '', city: '', state: '', zip: '' }),
    saveAddress: (a) => save(CONFIG.keys.address, a),
  };

  function newOrderId() { return 'SL-' + Date.now().toString(36).toUpperCase().slice(-6); }

  function orderTotals() {
    const sub = cart.subtotal();
    const ship = sub >= CONFIG.shippingFreeOver || sub === 0 ? 0 : CONFIG.shipping;
    return { sub, ship, total: sub + ship };
  }

  function whatsappOrderUrl(order) {
    const lines = [
      `Hi ${CONFIG.shop}! 🎀 New order:`,
      `Order ID: ${order.id}`,
      ...order.items.map((i) => `• ${i.name} × ${i.qty} = $${(i.qty * i.price).toFixed(2)}`),
      `Total: $${order.total.toFixed(2)}`,
      `Name: ${order.address.name}`,
      `Address: ${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}, ${order.address.city}, ${order.address.state} ${order.address.zip}`,
      `Payment: ${order.payment}`,
      '',
      'Please confirm my order 💕',
    ];
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  /* ---- Floating hearts ---- */
  const HEARTS = ['💖', '🌸', '✨', '💕', '🎀'];
  function spawnHeart(initial) {
    const el = document.createElement('span');
    el.className = 'float-heart';
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = 14 + Math.random() * 22 + 'px';
    el.style.animationDuration = 6 + Math.random() * 6 + 's';
    if (initial) el.style.bottom = Math.random() * 80 + 'vh';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 13000);
  }

  /* ---- Chat widget (demo: messages stay on this device) ---- */
  const CHAT_REPLIES = [
    { re: /price|cost|much/i, msg: 'Scrunchies are $7–$10, and our Sweet $5 Deals are just $5! 🍭' },
    { re: /ship|deliver/i, msg: 'Free shipping over $25 🚚. Orders usually arrive in 3–5 days 💌' },
    { re: /return|refund/i, msg: '30-day snuggles guarantee — returns are free 💕' },
    { re: /order|buy|checkout/i, msg: 'Add cuties to your cart → Checkout → fill address → Place Order. We confirm on WhatsApp 🛍️' },
    { re: /\b(hi|hello|hey|hii)\b/i, msg: 'Hii cutie! 💕 What can I help you with?' },
    { re: /color/i, msg: 'Pink, lavender, mint, peach, sky blue, lemon, rose — new colors daily! 🌈' },
    { re: /pay/i, msg: 'We accept Card, UPI, Cash on Delivery, and PayPal — pay after we confirm your order 💳' },
  ];

  function chatReply(text) {
    const hit = CHAT_REPLIES.find((r) => r.re.test(text));
    return hit
      ? hit.msg
      : "That's so fetch! 🌸 This is a demo chat — messages stay on this device. After you place an order, reach me on WhatsApp 💌";
  }

  function initChat() {
    const css = document.createElement('style');
    css.textContent = `
      .sl-chat-fab { position: fixed; right: 20px; bottom: 20px; z-index: 60; width: 58px; height: 58px; border-radius: 50%; border: 2px solid #ffb6d5; background: linear-gradient(135deg, #ff6fa5, #f04f8c); color: #fff; font-size: 1.5rem; cursor: pointer; box-shadow: 0 8px 20px rgba(240,79,140,.4); transition: transform .2s; }
      .sl-chat-fab:hover { transform: scale(1.08); }
      .sl-chat-panel { position: fixed; right: 20px; bottom: 90px; z-index: 60; width: min(340px, calc(100vw - 40px)); max-height: min(480px, 70vh); display: flex; flex-direction: column; background: #fffafc; border: 2px solid #ffe3f0; border-radius: 22px; box-shadow: 0 14px 40px rgba(240,79,140,.3); overflow: hidden; }
      .sl-chat-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, #ff6fa5, #f04f8c); color: #fff; font-weight: 700; }
      .sl-chat-close { background: none; border: none; color: #fff; font-size: 1rem; cursor: pointer; }
      .sl-chat-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
      .sl-msg { max-width: 80%; padding: 9px 13px; border-radius: 16px; font-size: .92rem; line-height: 1.4; }
      .sl-msg.bot { align-self: flex-start; background: #ffe3f0; color: #5c3a52; border-bottom-left-radius: 4px; }
      .sl-msg.me { align-self: flex-end; background: linear-gradient(135deg, #ff6fa5, #f04f8c); color: #fff; border-bottom-right-radius: 4px; }
      .sl-chat-form { display: flex; gap: 8px; padding: 10px 12px; border-top: 2px solid #ffe3f0; background: #fff; }
      .sl-chat-input { flex: 1; padding: 10px 14px; border: 2px solid #ffb6d5; border-radius: 999px; font-family: inherit; font-size: .95rem; outline: none; background: #fffafc; color: #5c3a52; }
      .sl-chat-input:focus { border-color: #ff6fa5; }
      .sl-chat-send { width: 42px; height: 42px; border-radius: 50%; border: none; background: linear-gradient(135deg, #ff6fa5, #f04f8c); color: #fff; font-size: 1.05rem; cursor: pointer; }
    `;
    document.head.appendChild(css);

    const host = document.createElement('div');
    host.innerHTML = `
      <button class="sl-chat-fab" aria-label="Open chat">💬</button>
      <div class="sl-chat-panel" hidden>
        <div class="sl-chat-head"><span>💕 Chat with ${esc(CONFIG.shop)}</span><button class="sl-chat-close" aria-label="Close chat">✕</button></div>
        <div class="sl-chat-body"></div>
        <form class="sl-chat-form">
          <input class="sl-chat-input" placeholder="Type a message…" autocomplete="off" />
          <button class="sl-chat-send" aria-label="Send">➤</button>
        </form>
      </div>`;
    document.body.appendChild(host);

    const fab = host.querySelector('.sl-chat-fab');
    const panel = host.querySelector('.sl-chat-panel');
    const body = host.querySelector('.sl-chat-body');
    const form = host.querySelector('.sl-chat-form');
    const input = host.querySelector('.sl-chat-input');

    const history = load(CONFIG.keys.chat, []);
    if (history.length === 0) {
      history.push({ who: 'bot', text: 'Hii cutie! 💕 Ask me anything about scrunchies 🎀' });
      save(CONFIG.keys.chat, history);
    }

    function append(who, text) {
      const el = document.createElement('div');
      el.className = 'sl-msg ' + who;
      el.textContent = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }
    history.forEach((m) => append(m.who, m.text));

    fab.addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) input.focus(); });
    host.querySelector('.sl-chat-close').addEventListener('click', () => { panel.hidden = true; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      append('me', text);
      history.push({ who: 'me', text });
      setTimeout(() => {
        const reply = chatReply(text);
        append('bot', reply);
        history.push({ who: 'bot', text: reply });
        save(CONFIG.keys.chat, history);
      }, 600);
    });
  }

  /* ---- Confetti ---- */
  function confetti(x, y) {
    const colors = ['#ff6fa5', '#a78bfa', '#ffd166', '#7dd3a8', '#ff9ebd', '#8fb8ff'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.className = 'sl-confetti';
      p.style.left = (x || innerWidth / 2) + 'px';
      p.style.top = (y || innerHeight / 3) + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 140 - 70).toFixed(0) + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270).toFixed(0) + 'deg');
      p.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  }

  /* ---- Boot ---- */
  const css = document.createElement('style');
  css.textContent = `
    /* vivid animated gradient everywhere */
    body { background: linear-gradient(120deg, #ffe0ef, #e6d9ff, #ffedd6, #ffe0ef); background-size: 300% 300%; animation: sl-bg 16s ease infinite; }
    @keyframes sl-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

    /* floating color blobs */
    .sl-blob { position: fixed; border-radius: 50%; filter: blur(70px); opacity: .5; z-index: -1; pointer-events: none; animation: sl-drift 16s ease-in-out infinite alternate; }
    @keyframes sl-drift { from { transform: translate(0, 0) scale(1); } to { transform: translate(60px, -40px) scale(1.15); } }

    /* chunky sticker buttons */
    .btn { border-radius: 999px; border: 3px solid var(--pink-dark, #f04f8c); box-shadow: 0 5px 0 var(--pink-dark, #f04f8c); font-family: 'Baloo 2', 'Quicksand', sans-serif; font-weight: 800; transition: transform .15s, box-shadow .15s; }
    .btn:hover { transform: translateY(-2px) rotate(-1.5deg) scale(1.02); box-shadow: 0 8px 0 var(--pink-dark, #f04f8c); }
    .btn:active { transform: translateY(2px); box-shadow: 0 2px 0 var(--pink-dark, #f04f8c); }

    /* cursor sparkles */
    .sl-cursor { position: fixed; z-index: 98; pointer-events: none; font-size: .85rem; animation: sl-fadeUp .8s ease-out forwards; transform: translate(-50%, -50%); }
    @keyframes sl-fadeUp { to { opacity: 0; transform: translate(-50%, -46px) scale(.4); } }

    /* confetti pieces */
    .sl-confetti { position: fixed; width: 9px; height: 9px; border-radius: 2px; z-index: 99; pointer-events: none; animation: sl-fall .9s ease-out forwards; }
    @keyframes sl-fall { from { opacity: 1; transform: translate(0, 0) rotate(0); } to { opacity: 0; transform: translate(var(--dx), 130px) rotate(var(--rot)); } }

    .float-heart { position: fixed; bottom: -50px; z-index: 1; pointer-events: none; opacity: .55; animation: sl-rise linear forwards; }
    @keyframes sl-rise { to { transform: translateY(-110vh) rotate(20deg); } }
    [data-cart-count].bump { display: inline-block; animation: sl-bump .3s; }
    @keyframes sl-bump { 0% { transform: scale(1); } 50% { transform: scale(1.6); } 100% { transform: scale(1); } }
  `;
  document.head.appendChild(css);

  /* chunky font for buttons on pages that don't load it */
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap';
  document.head.appendChild(fontLink);

  /* blobs */
  const blobColors = ['#ff9ebd', '#c9a7eb', '#ffd0a8'];
  blobColors.forEach((c, i) => {
    const b = document.createElement('div');
    b.className = 'sl-blob';
    b.style.background = c;
    b.style.width = (300 + i * 70) + 'px';
    b.style.height = (300 + i * 70) + 'px';
    b.style.animationDelay = (i * -6) + 's';
    const pos = [['-80px', '10%'], ['60%', '-100px'], ['70%', '70%']][i];
    b.style.left = pos[0];
    b.style.top = pos[1];
    document.body.appendChild(b);
  });

  /* cursor sparkle trail (fine pointers only) */
  if (matchMedia('(pointer: fine)').matches) {
    let lastSparkle = 0;
    document.addEventListener('pointermove', (e) => {
      const now = Date.now();
      if (now - lastSparkle < 90) return;
      lastSparkle = now;
      if (e.target.closest('.sl-chat-panel')) return;
      const s = document.createElement('span');
      s.className = 'sl-cursor';
      s.textContent = ['✨', '⭐', '💗'][Math.floor(Math.random() * 3)];
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 800);
    });
  }

  window.SL = { CONFIG, cart, orders, store, newOrderId, orderTotals, whatsappOrderUrl, esc, load, save, spawnHeart, confetti };

  for (let i = 0; i < 6; i++) spawnHeart(true);
  setInterval(() => spawnHeart(), 1400);

  initChat();
  cart.notify(); /* set badge counts on load */
})();
