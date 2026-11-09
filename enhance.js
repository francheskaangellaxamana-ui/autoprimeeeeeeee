/* AUTOPRIME enhancements: favorites, compare, browse filters + saved searches,
   recently viewed, inspection reports, seller reviews, report listing,
   support chat, help center, tickets, dashboards.
   Academic prototype: all data is sample data kept in this browser (localStorage). */
(function () {
    "use strict";
    const DEALER = "dealer@autoprime.demo";
    const DEALER_NAME = "AUTOPRIME Dealer";
    const K = {
        fav: "autoprimeFavorites", compare: "autoprimeCompare", viewed: "autoprimeRecentlyViewed",
        searches: "autoprimeFilterSearches", tickets: "autoprimeTickets", reports: "autoprimeReports",
        reviews: "autoprimeReviews", roles: "autoprimeRoles", verifs: "autoprimeVerifications",
        purchasedDemo: "autoprimeDemoPurchases"
    };
    const read = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? f; } catch (_) { return f; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } };
    const user = () => read("autoprimeSession", null);
    const lc = v => String(v || "").toLowerCase();
    const ukey = () => lc(user()?.email || "guest");
    const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    const num = v => Number(String(v || "").replace(/[^0-9.]/g, "")) || 0;
    const peso = n => n ? "₱" + Number(n).toLocaleString("en-PH") : "Price not specified";
    const slug = t => lc(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const page = document.body.dataset.page || (location.pathname.split("/").pop() || "index.html").replace(".html", "");
    const fmtDate = d => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
    const toast = msg => {
        let t = document.querySelector(".autoprime-toast");
        if (!t) { t = document.createElement("div"); t.className = "autoprime-toast"; document.body.appendChild(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3200);
    };
    const perUser = (k) => read(k, {})[ukey()] || [];
    const setPerUser = (k, list) => { const all = read(k, {}); all[ukey()] = list; write(k, all); };

    /* ---------------- Vehicle catalog ---------------- */
    let catalog = null, catalogPromise = null;
    const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

    function parseCards(doc, category) {
        return [...doc.querySelectorAll(".listing-section .vehicle-card")].map((card, i) => {
            const title = card.querySelector("h3")?.textContent.trim() || "Vehicle";
            const meta = (card.querySelector(".vehicle-info > p")?.textContent || "").split("•").map(s => s.trim());
            const lis = [...card.querySelectorAll("li")].map(li => li.textContent.trim());
            const engine = lis[0] || "";
            const words = title.split(/\s+/);
            return {
                id: "d-" + slug(title), source: "dealer", title, brand: words[0], model: words.slice(1).join(" "),
                category, image: card.querySelector("img")?.getAttribute("src") || "image/mustang.jpg",
                price: num(card.querySelector("h4")?.textContent), year: num(meta[0]), transmission: meta[1] || "Automatic",
                mileage: num(meta[2]), engine, fuel: /diesel/i.test(engine) ? "Diesel" : /hybrid/i.test(engine) ? "Hybrid" : /electric/i.test(engine) ? "Electric" : "Gasoline",
                seats: lis[1] || "", color: lis[2] || "", condition: "Used – Excellent",
                seller: DEALER_NAME, sellerEmail: DEALER, addedAt: Date.UTC(2026, 9, 1 + i * 3 + (category === "suv" ? 1 : category === "pickup" ? 2 : 0))
            };
        });
    }
    function userListings() {
        const sold = read("autoprimeManualSoldListings", []).map(String);
        return read("autoprimeListings", []).filter(l => !sold.includes(String(l.id))).map(l => ({
            id: "u-" + l.id, listingId: l.id, source: "member", title: [l.brand, l.model].filter(Boolean).join(" "),
            brand: l.brand || "", model: l.model || "", category: l.category || "sedan", image: l.image || "image/mustang.jpg",
            price: num(l.price), year: num(l.year), transmission: l.transmission || "Automatic", mileage: num(l.mileage),
            engine: l.engine || "Not specified", fuel: /diesel/i.test(l.engine) ? "Diesel" : /hybrid/i.test(l.engine) ? "Hybrid" : "Gasoline",
            seats: l.seats || "", color: l.color || "", condition: l.condition || "Used", description: l.description || "",
            seller: l.sellerName || l.sellerEmail || "Member seller", sellerEmail: l.sellerEmail || "", addedAt: Number(l.id) || Date.now()
        }));
    }
    function loadCatalog() {
        if (catalogPromise) return catalogPromise;
        catalogPromise = Promise.all(["sedan", "suv", "pickup"].map(c =>
            (window.AUTOPRIME_CATALOG_HTML && window.AUTOPRIME_CATALOG_HTML[c] ? Promise.resolve("<div class=\"listing-section\">" + window.AUTOPRIME_CATALOG_HTML[c] + "</div>") : fetch(c + ".html").then(r => r.text())).then(html => parseCards(new DOMParser().parseFromString(html, "text/html"), c)).catch(() => [])
        )).then(lists => { catalog = lists.flat().concat(userListings()); return catalog; });
        return catalogPromise;
    }
    const byId = id => (catalog || []).find(v => v.id === id);
    const byTitle = t => (catalog || []).find(v => lc(v.title) === lc(String(t || "").trim()));

    /* ---------------- Inspection & reviews (illustrative sample data) ---------------- */
    function inspection(v) {
        const h = hash(v.id), grades = ["Excellent", "Very Good", "Good"];
        const g = n => grades[(h >>> n) % 3];
        const d = new Date(2026, 9, 1 + (h % 25));
        return {
            overall: g(1), exterior: g(3), interior: g(5), engine: g(7), tires: ["85% tread", "78% tread", "92% tread"][(h >>> 9) % 3],
            date: fmtDate(d),
            history: ["Change oil & filter at " + Math.max(5000, Math.round(v.mileage / 10000) * 10000 - 5000).toLocaleString() + " km",
                "Brake pads replaced " + (2026 - ((h >>> 4) % 2)), "Casa-maintained, complete service records"].slice(0, 2 + (h % 2)),
            remarks: ["No signs of flood or major accident damage.", "Minor cosmetic scratches on rear bumper; mechanically sound.", "Clean underchassis, aircon cold, all electronics working."][(h >>> 2) % 3]
        };
    }
    const SEED_REVIEWS = [
        { sellerEmail: DEALER, author: "Maria S.", rating: 5, text: "Smooth transaction and the car was exactly as described. Inspection report was accurate.", date: "2026-10-12", verified: true },
        { sellerEmail: DEALER, author: "John R.", rating: 4, text: "Helpful staff, quick replies to my questions. Paperwork took a little longer than expected.", date: "2026-09-28", verified: true },
        { sellerEmail: DEALER, author: "Angela T.", rating: 5, text: "Clear pricing and no hidden fees. Would buy again.", date: "2026-09-03", verified: false }
    ];
    const reviewsFor = email => SEED_REVIEWS.concat(read(K.reviews, [])).filter(r => lc(r.sellerEmail) === lc(email))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const stars = n => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));
    function avgRating(email) { const r = reviewsFor(email); return r.length ? r.reduce((s, x) => s + Number(x.rating), 0) / r.length : 0; }
    function hasPurchased(v) {
        const me = lc(user()?.email); if (!me) return false;
        if (read("autoprimeTransactions", []).some(t => lc(t.buyerEmail) === me && lc(t.vehicle) === lc(v.title))) return true;
        return (read(K.purchasedDemo, {})[me] || []).includes(v.id);
    }

    /* ---------------- Favorites / compare / viewed ---------------- */
    const favs = () => perUser(K.fav);
    const isFav = id => favs().includes(id);
    function toggleFav(id) {
        let list = favs();
        if (list.includes(id)) { list = list.filter(x => x !== id); toast("Removed from Favorites."); }
        else { list.unshift(id); toast("Saved to Favorites ♥"); }
        setPerUser(K.fav, list); refresh();
    }
    const compareList = () => read(K.compare, []);
    function toggleCompare(id) {
        let list = compareList();
        if (list.includes(id)) { list = list.filter(x => x !== id); toast("Removed from comparison."); }
        else if (list.length >= 3) { toast("You can compare up to 3 vehicles. Remove one first."); return; }
        else { list.push(id); toast(list.length === 1 ? "Added. Pick one or two more vehicles to compare." : "Added to comparison (" + list.length + "/3)."); }
        write(K.compare, list); refresh();
    }
    function addViewed(id) {
        const list = perUser(K.viewed).filter(x => x !== id); list.unshift(id); setPerUser(K.viewed, list.slice(0, 8));
    }

    /* ---------------- Card rendering & decoration ---------------- */
    function cardHtml(v) {
        return `<div class="vehicle-card" data-category="${esc(v.category)}" data-year="${esc(v.year)}" data-mileage="${esc(v.mileage.toLocaleString())} km"
            data-condition="${esc(v.condition)}" data-description="${esc(v.description || "")}" data-listing-id="${esc(v.listingId || "")}" data-seller-email="${esc(v.source === "member" ? v.sellerEmail : "")}">
            <img src="${esc(v.image)}" alt="${esc(v.title)}" loading="lazy">
            <div class="vehicle-info">
                <span class="vehicle-type">${esc(v.category.toUpperCase())}</span>${v.source === "member" ? '<span class="listing-badge">USER LISTING</span>' : ""}
                <h3>${esc(v.title)}</h3>
                <p>${esc(v.year)} • ${esc(v.transmission)} • ${esc(v.mileage.toLocaleString())} km</p>
                <ul><li>${esc(v.engine)}</li>${v.seats ? `<li>${esc(v.seats)}</li>` : ""}${v.color ? `<li>${esc(v.color)}</li>` : ""}</ul>
                <h4>${esc(peso(v.price))}</h4>
                <button type="button" class="view-vehicle">View Vehicle</button>
            </div></div>`;
    }
    function renderCards(host, list) {
        host.innerHTML = list.map(cardHtml).join("");
        window.AutoPrimeVehicles?.attach();
        decorate();
    }
    function decorate() {
        document.querySelectorAll(".vehicle-card").forEach(card => {
            const title = card.querySelector("h3")?.textContent.trim();
            const v = byTitle(title); if (!v) return;
            let bar = card.querySelector(".ap-card-actions");
            if (!bar) {
                bar = document.createElement("div"); bar.className = "ap-card-actions";
                bar.innerHTML = `<button type="button" class="ap-heart" aria-label="Save to favorites"></button><button type="button" class="ap-compare-btn">⇄ Compare</button>`;
                card.style.position = "relative"; card.appendChild(bar);
                bar.querySelector(".ap-heart").addEventListener("click", e => { e.stopPropagation(); toggleFav(v.id); });
                bar.querySelector(".ap-compare-btn").addEventListener("click", e => { e.stopPropagation(); toggleCompare(v.id); });
            }
            const h = bar.querySelector(".ap-heart"), on = isFav(v.id);
            h.classList.toggle("on", on); h.textContent = on ? "♥" : "♡"; h.setAttribute("aria-pressed", on);
            h.setAttribute("aria-label", on ? "Remove from favorites" : "Save to favorites");
            const c = bar.querySelector(".ap-compare-btn"), inC = compareList().includes(v.id);
            c.classList.toggle("on", inC); c.textContent = inC ? "✓ Comparing" : "⇄ Compare";
        });
    }
    function navCounts() {
        document.querySelectorAll('[data-count="fav"]').forEach(el => { const n = favs().length; el.textContent = n || ""; });
        document.querySelectorAll('[data-count="compare"]').forEach(el => { const n = compareList().length; el.textContent = n || ""; });
        let bar = document.querySelector(".ap-compare-bar");
        const n = compareList().length;
        if (page === "compare" || !n) { bar?.remove(); return; }
        if (!bar) { bar = document.createElement("div"); bar.className = "ap-compare-bar"; document.body.appendChild(bar); }
        bar.innerHTML = `<span>${n} vehicle${n > 1 ? "s" : ""} selected to compare</span><a href="compare.html" class="primary-button">Compare Now</a><button type="button" aria-label="Clear comparison">&times;</button>`;
        bar.querySelector("button").onclick = () => { write(K.compare, []); refresh(); };
    }

    /* ---------------- Generic modal ---------------- */
    function modal(title, html, onMount) {
        document.querySelector(".ap-modal")?.remove();
        const m = document.createElement("div");
        m.className = "ap-modal show";
        m.innerHTML = `<div class="ap-modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><button type="button" class="ap-modal-close" aria-label="Close">&times;</button><h2>${esc(title)}</h2>${html}</div>`;
        document.body.appendChild(m);
        const close = () => m.remove();
        m.querySelector(".ap-modal-close").onclick = close;
        m.addEventListener("click", e => { if (e.target === m) close(); });
        onMount && onMount(m, close);
        m.querySelector("input,select,textarea")?.focus();
        return m;
    }

    /* ---------------- Vehicle details modal additions ---------------- */
    function enhanceVehicleModal(vm) {
        const title = vm.querySelector(".modal-title")?.textContent;
        const v = byTitle(title);
        vm.querySelector(".ap-modal-extra")?.remove();
        if (!v) return;
        addViewed(v.id);
        const msgBtn = vm.querySelector(".message-seller-action");
        if (msgBtn && !msgBtn.dataset.sellerEmail) { msgBtn.dataset.sellerEmail = DEALER; msgBtn.disabled = false; msgBtn.title = "Message AUTOPRIME Dealer"; }
        const ins = inspection(v);
        const avg = avgRating(v.sellerEmail), revs = reviewsFor(v.sellerEmail);
        const extra = document.createElement("div");
        extra.className = "ap-modal-extra";
        extra.innerHTML = `
            <div class="ap-modal-tools">
                <button type="button" class="ap-tool" data-t="fav">${isFav(v.id) ? "♥ Saved" : "♡ Save"}</button>
                <button type="button" class="ap-tool" data-t="cmp">${compareList().includes(v.id) ? "✓ Comparing" : "⇄ Compare"}</button>
                <button type="button" class="ap-tool ap-tool-warn" data-t="report">⚑ Report Listing</button>
            </div>
            <div class="ap-seller-line"><span>Seller: <strong>${esc(v.seller)}</strong></span><span class="ap-stars">${avg ? stars(avg) + " " + avg.toFixed(1) + " (" + revs.length + ")" : "No reviews yet"}</span></div>
            <details class="ap-inspection" open>
                <summary>Vehicle Inspection Report <em class="ap-demo-tag">Illustrative sample</em></summary>
                <dl>
                    <dt>Overall condition</dt><dd>${ins.overall}</dd><dt>Exterior</dt><dd>${ins.exterior}</dd>
                    <dt>Interior</dt><dd>${ins.interior}</dd><dt>Engine</dt><dd>${ins.engine}</dd>
                    <dt>Tires</dt><dd>${ins.tires}</dd><dt>Inspection date</dt><dd>${ins.date}</dd>
                </dl>
                <p><strong>Maintenance history</strong></p><ul>${ins.history.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
                <p><strong>Remarks:</strong> ${esc(ins.remarks)}</p>
            </details>
            <details class="ap-reviews">
                <summary>Seller Ratings &amp; Reviews ${avg ? `· ${avg.toFixed(1)} / 5` : ""}</summary>
                <div class="ap-review-list">${revs.length ? revs.map(r => `<div class="ap-review"><div><span class="ap-stars">${stars(r.rating)}</span>${r.verified ? ' <span class="ap-verified">✓ Verified Buyer</span>' : ""}</div><p>${esc(r.text)}</p><small>${esc(r.author)} · ${fmtDate(r.date)}</small></div>`).join("") : '<p class="ap-empty-sm">This seller has no reviews yet.</p>'}</div>
                <div class="ap-review-form-host"></div>
            </details>`;
        vm.querySelector(".vehicle-modal-info").appendChild(extra);
        extra.querySelector('[data-t="fav"]').onclick = e => { toggleFav(v.id); e.target.textContent = isFav(v.id) ? "♥ Saved" : "♡ Save"; };
        extra.querySelector('[data-t="cmp"]').onclick = e => { toggleCompare(v.id); e.target.textContent = compareList().includes(v.id) ? "✓ Comparing" : "⇄ Compare"; };
        extra.querySelector('[data-t="report"]').onclick = () => openReport(v);
        renderReviewForm(extra.querySelector(".ap-review-form-host"), v, () => enhanceVehicleModal(vm));
    }
    function renderReviewForm(host, v, done) {
        const u = user();
        if (!u) { host.innerHTML = '<p class="ap-empty-sm">Log in and complete a purchase to review this seller.</p>'; return; }
        if (lc(u.email) === lc(v.sellerEmail)) { host.innerHTML = ""; return; }
        if (!hasPurchased(v)) {
            host.innerHTML = '<p class="ap-empty-sm">Only buyers with a completed purchase can review.</p><button type="button" class="ap-btn-ghost ap-sim-purchase">Simulate completed purchase (demo)</button>';
            host.querySelector(".ap-sim-purchase").onclick = () => {
                const all = read(K.purchasedDemo, {}); const me = lc(u.email); all[me] = (all[me] || []).concat(v.id); write(K.purchasedDemo, all);
                toast("Demo: purchase marked as completed. You can now leave a review."); done();
                setTimeout(() => document.querySelector(".vehicle-modal.show .ap-reviews")?.setAttribute("open", ""), 0);
            };
            return;
        }
        host.innerHTML = `<form class="ap-review-form"><p><strong>Write a review</strong></p>
            <div class="ap-star-input" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="rating" value="${n}" ${n === 5 ? "checked" : ""}><span>★</span></label>`).join("")}</div>
            <textarea name="text" required maxlength="500" rows="3" placeholder="How was your experience with this seller?"></textarea>
            <button type="submit" class="primary-button">Submit Review</button><p class="ap-msg"></p></form>`;
        host.querySelector("form").onsubmit = e => {
            e.preventDefault();
            const f = e.target, text = f.text.value.trim();
            if (text.length < 5) { f.querySelector(".ap-msg").textContent = "Please write at least a few words."; return; }
            const list = read(K.reviews, []);
            list.unshift({ sellerEmail: v.sellerEmail, sellerName: v.seller, vehicle: v.title, author: (u.name || u.email).split(" ")[0] + ".", authorEmail: u.email, rating: Number(f.rating.value), text, date: new Date().toISOString(), verified: true });
            write(K.reviews, list); toast("Thanks! Your review was posted."); done();
            setTimeout(() => document.querySelector(".vehicle-modal.show .ap-reviews")?.setAttribute("open", ""), 0);
        };
    }
    function openReport(v) {
        const reasons = ["Incorrect vehicle information", "Misleading photos", "Suspicious seller", "Possible scam", "Other concerns"];
        modal("Report this listing", `<p class="ap-hint">Reporting: <strong>${esc(v.title)}</strong> · ${esc(v.seller)}</p>
            <form class="ap-form"><fieldset><legend>Reason for report</legend>${reasons.map((r, i) => `<label class="ap-radio"><input type="radio" name="reason" value="${esc(r)}" ${i === 0 ? "checked" : ""}> ${esc(r)}</label>`).join("")}</fieldset>
            <label>Description<textarea name="desc" rows="4" maxlength="1000" required placeholder="Tell us what looks wrong with this listing."></textarea></label>
            <button type="submit" class="primary-button">Submit Report</button><p class="ap-msg" aria-live="polite"></p></form>`, (m, close) => {
            m.querySelector("form").onsubmit = e => {
                e.preventDefault();
                const f = e.target, desc = f.desc.value.trim();
                if (desc.length < 10) { f.querySelector(".ap-msg").textContent = "Please describe the problem (at least 10 characters)."; return; }
                const ref = "RPT-" + Date.now().toString().slice(-6);
                const list = read(K.reports, []); list.unshift({ ref, vehicleId: v.id, vehicle: v.title, reason: f.reason.value, desc, by: user()?.email || "guest", date: new Date().toISOString(), status: "Under Review" }); write(K.reports, list);
                m.querySelector(".ap-modal-card").innerHTML = `<button type="button" class="ap-modal-close" aria-label="Close">&times;</button><h2>Report submitted</h2><p>Thank you. Our safety team will review this listing.</p><p class="ap-ref">Reference: <strong>${ref}</strong></p><p class="ap-hint">Simulated: no real moderation team receives this report in the prototype.</p><button type="button" class="primary-button ap-ok">Done</button>`;
                m.querySelector(".ap-modal-close").onclick = close; m.querySelector(".ap-ok").onclick = close;
            };
        });
    }

    /* ---------------- Messaging additions (buyer ↔ seller) ---------------- */
    function enhanceMessageModal(mm) {
        const recipient = mm.dataset.recipient, vehicleName = mm.dataset.vehicle;
        const v = byTitle(vehicleName);
        let head = mm.querySelector(".ap-msg-head");
        if (!head) { head = document.createElement("div"); head.className = "ap-msg-head"; mm.querySelector(".message-recipient").before(head); }
        const name = lc(recipient) === DEALER ? DEALER_NAME : (v && lc(v.sellerEmail) === lc(recipient) ? v.seller : recipient);
        head.innerHTML = `${v ? `<img src="${esc(v.image)}" alt="">` : ""}<div><strong>${esc(name)}</strong><span>${esc(vehicleName || "Vehicle")}${v ? " · " + esc(peso(v.price)) : ""}</span></div>`;
        statusMarks(mm);
    }
    function statusMarks(mm) {
        const me = lc(user()?.email), peer = lc(mm.dataset.recipient);
        const mine = read("autoprimeMessages", []).filter(m => lc(m.from) === me && lc(m.to) === peer);
        const bubbles = mm.querySelectorAll(".message-bubble.mine");
        bubbles.forEach((b, i) => {
            const m = mine[i]; if (!m || b.querySelector(".ap-status")) return;
            const s = document.createElement("span"); s.className = "ap-status"; s.textContent = m.read ? "✓✓ Read" : "✓ Sent";
            b.querySelector("small")?.append(" · ", s);
        });
    }
    function dealerReply(text) {
        const t = lc(text);
        if (/avail|still/.test(t)) return "Hi! Yes, this vehicle is still available. You can reserve it by tapping Buy Vehicle and completing ID verification.";
        if (/price|discount|nego|last/.test(t)) return "Thanks for asking! The listed price already includes a full inspection. We can discuss a small discount for cash purchases during your visit.";
        if (/mileage|km|odometer/.test(t)) return "The mileage shown is from the odometer at inspection and matches the service records.";
        if (/condition|accident|flood|scratch/.test(t)) return "Please see the Vehicle Inspection Report on the listing. It has no flood or major accident history.";
        if (/reserv|view|visit|test/.test(t)) return "You're welcome to schedule a viewing or test drive. What day and time works for you?";
        return "Thanks for your message! A sales associate will follow up shortly. Is there anything specific you'd like to know about this vehicle?";
    }
    document.addEventListener("submit", e => {
        const form = e.target;
        if (!form.classList || !form.classList.contains("message-compose")) return;
        const mm = form.closest(".autoprime-message-modal");
        if (!mm || lc(mm.dataset.recipient) !== DEALER || !user()) return;
        const vehicle = mm.dataset.vehicle;
        const sent = read("autoprimeMessages", []).filter(m => lc(m.from) === lc(user().email) && lc(m.to) === DEALER).pop();
        if (!sent) return;
        const thread = mm.querySelector(".message-thread");
        const typing = document.createElement("p"); typing.className = "message-note ap-typing"; typing.textContent = "AUTOPRIME Dealer is typing… (simulated)";
        setTimeout(() => thread.appendChild(typing), 50);
        setTimeout(() => {
            const all = read("autoprimeMessages", []);
            all.forEach(m => { if (lc(m.from) === lc(user().email) && lc(m.to) === DEALER) m.read = true; });
            all.push({ id: Date.now() * 1000, from: DEALER, fromName: DEALER_NAME, to: user().email, vehicle, text: dealerReply(sent.text), sentAt: new Date().toISOString(), read: true });
            write("autoprimeMessages", all);
            if (mm.classList.contains("show") && lc(mm.dataset.recipient) === DEALER) window.AutoPrimeMessaging?.open(DEALER, vehicle);
            typing.remove();
        }, 1600);
    });

    /* ---------------- Support live chat (simulated, separate from seller chat) ---------------- */
    function supportReply(t) {
        t = lc(t);
        if (/id|verif|face/.test(t)) return "ID verification happens when you buy a vehicle, or anytime from My Account → ID Verification. Please use sample IDs only in this demo.";
        if (/pay|refund|bank|gcash/.test(t)) return "Payment methods and refunds are explained in Help Center → Payments & Transactions. For a specific transaction, please submit a support ticket.";
        if (/scam|report|fraud|suspicious/.test(t)) return "Never send money before verifying the seller. Use the ⚑ Report Listing button on any vehicle to alert our safety team.";
        if (/save|search|favorite/.test(t)) return "Use Save Search on the Browse page and the ♥ button on any listing. Both appear in My Account.";
        if (/seller|message/.test(t)) return "To ask about a specific vehicle, open it and tap Message Seller. This chat is for AUTOPRIME support only.";
        if (/hi|hello|hey/.test(t)) return "Hello! How can I help you today?";
        return "Thanks! I've noted your concern. For detailed help, you can also submit a ticket in the Help Center and we'll give you a reference number.";
    }
    function setupSupportChat() {
        const btn = document.createElement("button");
        btn.type = "button"; btn.className = "ap-support-fab"; btn.textContent = "💬 Support"; btn.setAttribute("aria-label", "Open customer support chat");
        const panel = document.createElement("section");
        panel.className = "ap-support"; panel.setAttribute("aria-label", "Customer support chat"); panel.hidden = true;
        panel.innerHTML = `<header class="ap-support-head"><div><strong>AUTOPRIME Support</strong><small>Simulated assistant · not a live agent</small></div><button type="button" aria-label="Close support chat">&times;</button></header>
            <div class="ap-support-log" aria-live="polite"></div>
            <form class="ap-support-form"><input type="text" maxlength="500" placeholder="Type your question…" aria-label="Message"><button type="submit">Send</button></form>`;
        document.body.append(btn, panel);
        const log = panel.querySelector(".ap-support-log");
        const KEY = "autoprimeSupportChat";
        const history = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (_) { return []; } };
        const save = h => sessionStorage.setItem(KEY, JSON.stringify(h));
        const draw = () => {
            const h = history();
            if (!h.length) h.push({ me: false, text: "Hi! 👋 Welcome to AUTOPRIME Support. Ask me about buying, verification, payments, or safety.", at: Date.now() });
            log.innerHTML = h.map(m => `<div class="ap-bubble ${m.me ? "me" : ""}">${esc(m.text)}<small>${new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>`).join("");
            log.scrollTop = log.scrollHeight;
        };
        const open = () => { panel.hidden = false; btn.hidden = true; draw(); panel.querySelector("input").focus(); };
        btn.onclick = open;
        panel.querySelector(".ap-support-head button").onclick = () => { panel.hidden = true; btn.hidden = false; };
        document.addEventListener("click", e => { if (e.target.closest("[data-open-support]")) { e.preventDefault(); open(); } });
        panel.querySelector("form").onsubmit = e => {
            e.preventDefault();
            const input = panel.querySelector("input"), text = input.value.trim(); if (!text) return;
            const h = history(); h.push({ me: true, text, at: Date.now() }); save(h); input.value = ""; draw();
            const typing = document.createElement("p"); typing.className = "ap-typing"; typing.textContent = "Support is typing…"; log.appendChild(typing);
            setTimeout(() => { const h2 = history(); h2.push({ me: false, text: supportReply(text), at: Date.now() }); save(h2); draw(); }, 900);
        };
    }

    /* ---------------- Recently viewed / recently added ---------------- */
    function miniCards(ids) {
        const list = ids.map(byId).filter(Boolean);
        return list.map(v => `<article class="ap-mini"><img src="${esc(v.image)}" alt="${esc(v.title)}" loading="lazy"><div><strong>${esc(v.title)}</strong><span>${esc(peso(v.price))}</span><button type="button" class="ap-link-btn" data-open-vehicle="${esc(v.id)}">View Details →</button></div></article>`).join("");
    }
    function openVehicle(id) {
        const v = byId(id); if (!v) return;
        window.AutoPrimeVehicles?.open({
            type: v.category.toUpperCase(), title: v.title, meta: `${v.year} • ${v.transmission} • ${v.mileage.toLocaleString()} km`,
            price: peso(v.price), image: v.image, imageAlt: v.title, specs: [v.engine, v.seats, v.color].filter(Boolean),
            year: String(v.year), mileage: v.mileage.toLocaleString() + " km", condition: v.condition, description: v.description || "",
            listingId: v.listingId || "", sellerEmail: v.source === "member" ? v.sellerEmail : ""
        });
    }
    document.addEventListener("click", e => { const b = e.target.closest("[data-open-vehicle]"); if (b) openVehicle(b.dataset.openVehicle); });
    function renderRecentlyViewed() {
        document.querySelectorAll("[data-recently-viewed]").forEach(host => {
            const ids = perUser(K.viewed);
            host.innerHTML = ids.length ? miniCards(ids) : '<p class="ap-empty">Vehicles you open will appear here so you can find them again quickly.</p>';
        });
    }

    /* ---------------- Browse + saved searches ---------------- */
    const FILTER_KEYS = ["q", "category", "brand", "model", "minPrice", "maxPrice", "minYear", "maxMileage", "transmission", "fuel"];
    const FILTER_LABEL = { q: "Keyword", category: "Category", brand: "Brand", model: "Model", minPrice: "Min ₱", maxPrice: "Max ₱", minYear: "Year from", maxMileage: "Max km", transmission: "Transmission", fuel: "Fuel" };
    function criteriaText(c) {
        const parts = FILTER_KEYS.filter(k => c[k]).map(k => FILTER_LABEL[k] + ": " + (/Price/.test(k) ? Number(c[k]).toLocaleString() : c[k]));
        return parts.length ? parts.join(" · ") : "All vehicles";
    }
    function matches(v, c) {
        if (c.q) { const hay = lc([v.title, v.category, v.engine, v.fuel, v.transmission, v.color, v.year].join(" ")); if (!lc(c.q).split(/\s+/).every(t => hay.includes(t))) return false; }
        if (c.category && v.category !== c.category) return false;
        if (c.brand && lc(v.brand) !== lc(c.brand)) return false;
        if (c.model && !lc(v.model).includes(lc(c.model))) return false;
        if (c.minPrice && v.price < Number(c.minPrice)) return false;
        if (c.maxPrice && v.price > Number(c.maxPrice)) return false;
        if (c.minYear && v.year < Number(c.minYear)) return false;
        if (c.maxMileage && v.mileage > Number(c.maxMileage)) return false;
        if (c.transmission && lc(v.transmission) !== lc(c.transmission)) return false;
        if (c.fuel && lc(v.fuel) !== lc(c.fuel)) return false;
        return true;
    }
    function setupBrowse() {
        const form = document.getElementById("browseFilters"); if (!form) return;
        const grid = document.getElementById("browseGrid"), count = document.getElementById("resultCount"), msg = document.getElementById("browseMsg");
        const brands = [...new Set(catalog.map(v => v.brand).filter(Boolean))].sort();
        form.brand.innerHTML = '<option value="">All brands</option>' + brands.map(b => `<option>${esc(b)}</option>`).join("");
        const params = new URLSearchParams(location.search);
        FILTER_KEYS.forEach(k => { if (params.get(k)) form[k].value = params.get(k); });
        const criteria = () => { const c = {}; FILTER_KEYS.forEach(k => { const v = String(form[k].value || "").trim(); if (v) c[k] = v; }); return c; };
        const run = () => {
            const c = criteria();
            if (c.minPrice && c.maxPrice && Number(c.minPrice) > Number(c.maxPrice)) { msg.textContent = "Min price is higher than max price."; msg.className = "ap-msg error"; }
            else if (!msg.classList.contains("ok")) msg.textContent = "";
            const sortSel = document.getElementById("sortBy"), sort = sortSel ? sortSel.value : "newest";
            const list = catalog.filter(v => matches(v, c)).sort((a, b) => sort === "price-asc" ? (a.price || 0) - (b.price || 0) : sort === "price-desc" ? (b.price || 0) - (a.price || 0) : (b.addedAt || 0) - (a.addedAt || 0));
            count.textContent = list.length + " vehicle" + (list.length === 1 ? "" : "s") + " found";
            if (list.length) renderCards(grid, list);
            else grid.innerHTML = '<div class="ap-empty">No vehicles match these filters. Try widening your price range or clearing a filter.</div>';
            const qs = new URLSearchParams(c).toString();
            history.replaceState(null, "", "browse.html" + (qs ? "?" + qs : ""));
        };
        form.addEventListener("input", () => { msg.className = "ap-msg"; run(); });
        form.addEventListener("change", run);
        document.getElementById("sortBy")?.addEventListener("change", run);
        form.addEventListener("reset", () => setTimeout(run, 0));
        document.getElementById("saveSearchBtn").onclick = () => {
            const c = criteria();
            const suggested = c.brand || c.category ? [c.brand, c.model, c.category && c.category.toUpperCase()].filter(Boolean).join(" ") : "My search";
            modal("Save this search", `<p class="ap-hint">${esc(criteriaText(c))}</p><form class="ap-form"><label>Search name<input name="name" required maxlength="60" value="${esc(suggested)}"></label><button class="primary-button" type="submit">Save Search</button><p class="ap-msg"></p></form>`, (m, close) => {
                m.querySelector("form").onsubmit = e => {
                    e.preventDefault(); const name = e.target.name.value.trim();
                    if (!name) { m.querySelector(".ap-msg").textContent = "Please give your search a name."; return; }
                    const list = perUser(K.searches); list.unshift({ id: Date.now(), name, criteria: c, savedAt: new Date().toISOString() }); setPerUser(K.searches, list.slice(0, 30));
                    close(); msg.textContent = "✓ Search saved. Find it in My Account → Saved Searches."; msg.className = "ap-msg ok";
                    if (!user()) toast("Saved for this browser. Log in to keep searches with your account.");
                };
            });
        };
        run();
    }
    function savedSearchesHtml() {
        const list = perUser(K.searches);
        if (!list.length) return '<div class="ap-empty">You have no saved searches yet. Set filters on <a href="browse.html">Browse Vehicles</a> and tap <strong>Save Search</strong>.</div>';
        return '<div class="ap-list">' + list.map(s => `<div class="ap-list-item" data-sid="${s.id}"><div><strong>${esc(s.name)}</strong><small>${esc(criteriaText(s.criteria))}</small><small>Saved ${fmtDate(s.savedAt)} · ${catalog.filter(v => matches(v, s.criteria)).length} matching now</small></div>
            <div class="ap-item-actions"><a class="primary-button" href="browse.html?${new URLSearchParams(s.criteria)}">Open</a><button type="button" class="ap-btn-ghost" data-rename>Rename</button><button type="button" class="ap-btn-danger" data-del>Delete</button></div></div>`).join("") + "</div>";
    }
    function bindSavedSearches(host, rerender) {
        host.querySelectorAll("[data-sid]").forEach(row => {
            const id = Number(row.dataset.sid);
            row.querySelector("[data-del]").onclick = () => { if (!confirm("Delete this saved search?")) return; setPerUser(K.searches, perUser(K.searches).filter(s => s.id !== id)); toast("Saved search deleted."); rerender(); };
            row.querySelector("[data-rename]").onclick = () => {
                const s = perUser(K.searches).find(x => x.id === id);
                modal("Rename saved search", `<form class="ap-form"><label>New name<input name="name" required maxlength="60" value="${esc(s.name)}"></label><button class="primary-button" type="submit">Save Name</button></form>`, (m, close) => {
                    m.querySelector("form").onsubmit = e => { e.preventDefault(); const n = e.target.name.value.trim(); if (!n) return; setPerUser(K.searches, perUser(K.searches).map(x => x.id === id ? { ...x, name: n } : x)); close(); toast("Saved search renamed."); rerender(); };
                });
            };
        });
    }

    /* ---------------- Compare page ---------------- */
    function setupCompare() {
        const host = document.getElementById("compareTable"), picker = document.getElementById("comparePicker"); if (!host) return;
        const draw = () => {
            const ids = compareList(), list = ids.map(byId).filter(Boolean);
            picker.innerHTML = '<option value="">Choose a vehicle…</option>' + catalog.filter(v => !ids.includes(v.id)).map(v => `<option value="${esc(v.id)}">${esc(v.title)} — ${esc(peso(v.price))}</option>`).join("");
            picker.disabled = ids.length >= 3;
            if (list.length < 2) {
                host.innerHTML = `<div class="ap-empty">${list.length ? `<strong>${esc(list[0].title)}</strong> is selected. Add at least one more vehicle to compare.` : "No vehicles selected yet. Choose vehicles above, or tap ⇄ Compare on any listing."}</div>`;
                if (list.length) host.querySelector(".ap-empty").insertAdjacentHTML("beforeend", ` <button class="ap-btn-ghost" data-rm="${list[0].id}">Remove</button>`);
            } else {
                const rows = [["Price", v => peso(v.price), "min", v => v.price], ["Brand", v => v.brand], ["Model", v => v.model], ["Category", v => v.category.toUpperCase()],
                    ["Year", v => v.year, "max", v => v.year], ["Mileage", v => v.mileage.toLocaleString() + " km", "min", v => v.mileage], ["Transmission", v => v.transmission],
                    ["Fuel type", v => v.fuel], ["Engine", v => v.engine], ["Condition", v => v.condition], ["Seller", v => v.seller]];
                host.innerHTML = `<p class="ap-hint">Rows marked <span class="ap-diff-key">Different</span> show where the vehicles differ. <span class="ap-best-key">Best</span> marks the lowest price, newest year, and lowest mileage.</p>
                <div class="ap-table-scroll"><table class="ap-compare"><thead><tr><th></th>${list.map(v => `<th><img src="${esc(v.image)}" alt=""><strong>${esc(v.title)}</strong><div class="ap-th-actions"><button type="button" class="ap-link-btn" data-open-vehicle="${v.id}">Details</button><button type="button" class="ap-link-btn" data-rm="${v.id}">Remove</button></div></th>`).join("")}</tr></thead>
                <tbody>${rows.map(([label, fn, best, val]) => {
                    const vals = list.map(fn), diff = new Set(vals.map(String)).size > 1;
                    let bestIdx = -1; if (best && diff) { const nums = list.map(val); const target = best === "min" ? Math.min(...nums) : Math.max(...nums); bestIdx = nums.indexOf(target); }
                    return `<tr class="${diff ? "diff" : ""}"><th scope="row">${label}${diff ? ' <span class="ap-diff-key">Different</span>' : ""}</th>${vals.map((x, i) => `<td class="${i === bestIdx ? "best" : ""}">${esc(x)}${i === bestIdx ? ' <span class="ap-best-key">Best</span>' : ""}</td>`).join("")}</tr>`;
                }).join("")}</tbody></table></div>`;
            }
            host.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { write(K.compare, compareList().filter(x => x !== b.dataset.rm)); refresh(); });
        };
        picker.onchange = () => { if (picker.value) { toggleCompare(picker.value); } };
        setupCompare.draw = draw; draw();
    }

    /* ---------------- Favorites page ---------------- */
    function drawFavorites() {
        const g = document.getElementById("favoritesGrid"); if (!g) return;
        const list = favs().map(byId).filter(Boolean);
        if (list.length) renderCards(g, list);
        else g.innerHTML = '<div class="ap-empty">No favorites yet. Tap the ♡ on any vehicle to save it here. <a href="browse.html">Browse vehicles →</a></div>';
    }

    /* ---------------- Help center ---------------- */
    const HELP = [
        ["Buying a Vehicle", [["How to purchase a vehicle", "Open any listing, review the details and inspection report, then tap Buy Vehicle. You'll log in, verify your ID, and submit your request."],
            ["How to reserve a vehicle", "Send a buy request to hold a vehicle while the seller reviews it. Message the seller first to confirm availability and viewing schedules."],
            ["Purchase verification process", "Every purchase needs a government ID, consent to share it, a simulated face check (or manual review), and a final review before submission."]]],
        ["Account & Verification", [["Government ID requirements", "Accepted IDs: Driver's License, PhilSys National ID, Passport, UMID, Postal ID, Voter's ID, or another government ID. Upload JPG, JPEG, PNG, or PDF. Passports only need the information page."],
            ["Face verification", "The face check in this prototype is simulated — the camera is never turned on and no biometric data is collected. You can choose manual verification instead."],
            ["Account security", "Use a unique password, log out on shared devices, and never share your login with sellers or anyone claiming to be AUTOPRIME staff."]]],
        ["Payments & Transactions", [["Payment methods", "Sample payment methods include bank transfer, manager's check, and dealer financing. This prototype does not process real payments."],
            ["Refunds", "Refund requests are reviewed case by case. Submit a support ticket with your receipt number and reason."],
            ["Transaction concerns", "Find every receipt under Transactions. If something looks wrong, submit a ticket under Payments & Transactions."]]],
        ["Safety & Security", [["Avoiding scams", "Never pay before seeing the vehicle and its documents. Be cautious of prices far below market value or sellers who rush you."],
            ["Reporting suspicious listings", "Tap ⚑ Report Listing on the vehicle details, choose a reason, and describe the issue. You'll get a reference number."],
            ["Safe vehicle purchasing", "Meet in public places, check the OR/CR against the seller's ID, and review the inspection report before buying."]]],
        ["Contact Support", [["Submit a concern", "Use the Submit a Support Ticket form below. You'll receive a ticket reference number to track its status."],
            ["Ask for assistance", "Open the 💬 Support chat at the bottom of any page for quick answers (simulated assistant)."]]]
    ];
    const FAQ = [
        ["How do I buy a vehicle on AUTOPRIME?", "Open a listing, tap Buy Vehicle, log in, then complete the 4-step ID verification. Private sellers must accept your request before the sale completes."],
        ["Can I reserve a vehicle before paying?", "Yes. Your buy request acts as a reservation while the seller reviews it. You can request cancellation while it is pending."],
        ["What payment methods are accepted?", "Sample methods are bank transfer, manager's check, and dealer financing. No real payments are processed in this prototype."],
        ["Why do I need to verify my identity?", "ID verification protects buyers and sellers from fraud. Use sample IDs only for this demo — never upload a real ID."],
        ["How do I create an account?", "Tap Log In in the menu and choose Create Account. Enter your name, email, and a password of at least 6 characters."],
        ["What are saved searches?", "Saved searches remember your filters (brand, price, year, mileage, and more). Reopen them from My Account with one click."],
        ["How do I contact a seller?", "Tap Message Seller on the vehicle details. Conversations are linked to the vehicle and appear in My Messages."],
        ["Is the support chat the same as seller messaging?", "No. Support chat is for help with AUTOPRIME. To ask about a vehicle, use Message Seller."]
    ];
    function setupHelp() {
        const grid = document.getElementById("helpGrid"); if (!grid) return;
        grid.innerHTML = HELP.map(([cat, arts]) => `<div class="ap-help-cat"><h3>${esc(cat)}</h3>${arts.map(([t, b]) => `<details class="ap-article"><summary>${esc(t)}</summary><p>${esc(b)}</p></details>`).join("")}</div>`).join("");
        document.getElementById("faqList").innerHTML = FAQ.map(([q, a]) => `<details class="ap-faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");
        const input = document.getElementById("helpSearch"), empty = document.getElementById("helpEmpty");
        input.addEventListener("input", () => {
            const q = lc(input.value.trim()); let any = 0;
            grid.querySelectorAll(".ap-help-cat").forEach(cat => {
                let shown = 0;
                cat.querySelectorAll(".ap-article").forEach(a => { const ok = !q || lc(a.textContent + cat.querySelector("h3").textContent).includes(q); a.hidden = !ok; if (ok) shown++; if (q && ok) a.open = true; });
                cat.hidden = !shown; any += shown;
            });
            empty.hidden = !!any;
        });
        const form = document.getElementById("ticketForm"), msg = document.getElementById("ticketMsg");
        const u = user(); if (u) { form.name.value = u.name || ""; form.email.value = u.email || ""; }
        form.onsubmit = e => {
            e.preventDefault();
            const d = Object.fromEntries(new FormData(form)); Object.keys(d).forEach(k => d[k] = String(d[k]).trim());
            const missing = ["name", "email", "category", "subject", "description"].find(k => !d[k]);
            if (missing) { msg.textContent = "Please fill in every field."; msg.className = "ap-msg error"; form[missing].focus(); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { msg.textContent = "Please enter a valid email address."; msg.className = "ap-msg error"; return; }
            const btn = form.querySelector("button"); btn.disabled = true; btn.textContent = "Submitting…";
            setTimeout(() => {
                const ref = "TKT-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
                const list = read(K.tickets, []); list.unshift({ ref, ...d, email: lc(d.email), status: "Open", createdAt: new Date().toISOString() }); write(K.tickets, list);
                form.reset(); if (u) { form.name.value = u.name || ""; form.email.value = u.email || ""; }
                btn.disabled = false; btn.textContent = "Submit Ticket";
                msg.innerHTML = `✓ Ticket submitted. Your reference number is <strong>${ref}</strong>. (Sample reference — no real support team receives it.)`; msg.className = "ap-msg ok";
                drawTickets();
            }, 700);
        };
        drawTickets();
        if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
    }
    function myTickets() {
        const all = read(K.tickets, []), me = lc(user()?.email);
        return me ? all.filter(t => t.email === me) : all.filter(t => t.guest !== false).slice(0, 10);
    }
    function ticketStatus(t) { const age = Date.now() - new Date(t.createdAt).getTime(); return age > 120000 ? "In Review" : t.status; }
    function ticketsHtml() {
        const list = myTickets();
        if (!list.length) return '<div class="ap-empty">No support tickets yet. <a href="help.html#ticket">Submit a ticket →</a></div>';
        return '<div class="ap-list">' + list.map(t => `<div class="ap-list-item"><div><strong>${esc(t.subject)}</strong><small>${esc(t.ref)} · ${esc(t.category)} · ${fmtDate(t.createdAt)}</small></div><span class="ap-badge ap-badge-${slug(ticketStatus(t))}">${esc(ticketStatus(t))}</span></div>`).join("") + "</div>";
    }
    function drawTickets() { const h = document.getElementById("ticketList"); if (h) h.innerHTML = ticketsHtml() + '<p class="ap-hint">Simulated status: tickets move from Open to In Review after a short time.</p>'; }

    /* ---------------- Account dashboards ---------------- */
    const role = () => read(K.roles, {})[lc(user()?.email)] || "buyer";
    function verifs() {
        const me = lc(user()?.email); const all = read(K.verifs, []); let changed = false;
        all.forEach(v => { if (v.status === "Pending" && v.method === "face" && Date.now() - new Date(v.submittedAt).getTime() > 20000) { v.status = "Verified"; changed = true; } });
        if (changed) write(K.verifs, all);
        return all.filter(v => lc(v.email) === me);
    }
    function conversations(filterFn) {
        const me = lc(user()?.email);
        const msgs = read("autoprimeMessages", []).filter(m => lc(m.from) === me || lc(m.to) === me);
        const map = new Map();
        msgs.forEach(m => { const peer = lc(m.from) === me ? lc(m.to) : lc(m.from); const k = peer + "|" + m.vehicle; const c = map.get(k) || { peer, vehicle: m.vehicle, msgs: [] }; c.msgs.push(m); map.set(k, c); });
        let list = [...map.values()];
        if (filterFn) list = list.filter(filterFn);
        list.sort((a, b) => new Date(b.msgs[b.msgs.length - 1].sentAt) - new Date(a.msgs[a.msgs.length - 1].sentAt));
        if (!list.length) return '<div class="ap-empty">No conversations yet. Open a vehicle and tap <strong>Message Seller</strong> to start one.</div>';
        return '<div class="ap-list">' + list.map(c => {
            const last = c.msgs[c.msgs.length - 1], v = byTitle(c.vehicle), unread = c.msgs.filter(m => !m.read && lc(m.to) === me).length;
            const name = c.peer === DEALER ? DEALER_NAME : (c.msgs.find(m => lc(m.from) === c.peer)?.fromName || c.peer);
            return `<div class="ap-list-item ap-convo">${v ? `<img src="${esc(v.image)}" alt="">` : ""}<div><strong>${esc(name)} ${unread ? `<span class="chat-unread-badge">${unread} new</span>` : ""}</strong><small>About: ${esc(c.vehicle)}</small><small>“${esc(String(last.text).slice(0, 80))}” · ${new Date(last.sentAt).toLocaleString()}</small></div><button type="button" class="primary-button" data-chat="${esc(c.peer)}" data-vehicle="${esc(c.vehicle)}">Open Chat</button></div>`;
        }).join("") + "</div>";
    }
    function setupAccount() {
        const gate = document.getElementById("accountGate"), app = document.getElementById("accountApp"); if (!gate) return;
        const u = user();
        document.getElementById("accountLoginBtn").onclick = () => window.AutoPrimeAuth?.open("login");
        if (!u) { gate.hidden = false; app.hidden = true; return; }
        gate.hidden = true; app.hidden = false;
        const buyerTabs = [["profile", "Profile"], ["purchases", "My Purchases"], ["saved", "Saved Searches"], ["favorites", "Favorites / Wishlist"], ["messages", "My Messages"], ["verification", "ID Verification"], ["status", "Verification Status"], ["tickets", "Support Tickets"], ["viewed", "Recently Viewed"]];
        const sellerTabs = [["seller-profile", "Seller Profile"], ["listings", "My Vehicle Listings"], ["inquiries", "Buyer Inquiries"], ["seller-messages", "Messages"], ["reviews", "Seller Reviews"]];
        const tabs = role() === "seller" ? sellerTabs : buyerTabs;
        const nav = document.getElementById("dashNav"), body = document.getElementById("dashBody");
        let current = location.hash.slice(1); if (!tabs.some(t => t[0] === current)) current = tabs[0][0];
        nav.innerHTML = `<p class="ap-role-tag">${role() === "seller" ? "SELLER DASHBOARD" : "CUSTOMER DASHBOARD"}</p>` + tabs.map(([id, l]) => `<a href="#${id}" class="${id === current ? "active" : ""}">${l}</a>`).join("");
        const me = lc(u.email);
        const sections = {
            profile: () => profileHtml(u, "buyer"),
            "seller-profile": () => profileHtml(u, "seller"),
            purchases: () => {
                const reqs = read("autoprimePurchaseRequests", []).filter(r => lc(r.buyerEmail) === me);
                const tx = read("autoprimeTransactions", []).filter(t => lc(t.buyerEmail) === me);
                return `<h2>My Purchases</h2>${reqs.length || tx.length ? '<div class="ap-list">' + reqs.map(r => `<div class="ap-list-item"><div><strong>${esc(r.vehicle)}</strong><small>Buy request · ${esc(r.price)} · ${fmtDate(r.createdAt)}</small></div><span class="ap-badge ap-badge-${slug(r.status)}">${esc(r.status)}</span></div>`).join("") + tx.map(t => `<div class="ap-list-item"><div><strong>${esc(t.vehicle)}</strong><small>Receipt ${esc(t.receiptNumber)} · ${esc(t.amount)}</small></div><span class="ap-badge ap-badge-verified">Completed</span></div>`).join("") + "</div>" : '<div class="ap-empty">No purchases yet. <a href="browse.html">Find a vehicle →</a></div>'}<p><a class="ap-link" href="transactions.html">View all receipts and requests →</a></p>`;
            },
            saved: () => `<h2>Saved Searches</h2><p class="ap-hint">Reopen a search to restore its filters and see matching vehicles.</p>${savedSearchesHtml()}`,
            favorites: () => `<h2>Favorites / Wishlist</h2><div class="vehicle-grid" id="dashFavGrid"></div>`,
            messages: () => `<h2>My Messages</h2><p class="ap-hint">Conversations with sellers about specific vehicles. For help with AUTOPRIME itself, use 💬 Support.</p>${conversations()}`,
            verification: () => `<h2>ID Verification</h2><ol class="ap-steps"><li><strong>Select ID type</strong> — Driver's License, PhilSys, Passport, UMID, Postal, Voter's, or other government ID.</li><li><strong>Upload ID</strong> — front (and back when applicable) as JPG, JPEG, PNG, or PDF, and give consent.</li><li><strong>Face verification</strong> — simulated check, or choose manual verification.</li><li><strong>Review &amp; submit</strong> — confirm your details.</li></ol>
                <div class="ap-notice">Academic prototype: use sample/dummy ID files only. No real government ID or biometric data should be submitted.</div><button type="button" class="primary-button" id="startVerify">Start ID Verification</button>`,
            status: () => {
                const list = verifs();
                return `<h2>Verification Status</h2>${list.length ? '<div class="ap-list">' + list.map(v => `<div class="ap-list-item"><div><strong>${esc(v.idType)}</strong><small>${esc(v.vehicle)} · ${v.method === "face" ? "Face check (simulated)" : "Manual review"} · Submitted ${new Date(v.submittedAt).toLocaleString()}</small><small>Files: ${esc(v.frontName)}${v.backName ? ", " + esc(v.backName) : ""}</small></div><div class="ap-item-actions"><span class="ap-badge ap-badge-${slug(v.status)}">${esc(v.status)}</span>${v.status === "Pending" ? `<button class="ap-btn-ghost" data-vset="${v.id}" data-s="Verified">Demo: Approve</button><button class="ap-btn-danger" data-vset="${v.id}" data-s="Rejected">Demo: Reject</button>` : ""}${v.status === "Rejected" ? '<button class="primary-button" data-reverify>Resubmit</button>' : ""}</div></div>`).join("") + '</div><p class="ap-hint">Simulated review: face-check submissions are marked Verified after about 20 seconds; manual reviews stay Pending until approved.</p>' : '<div class="ap-empty">No ID submitted yet. <a href="#verification">Start verification →</a></div>'}`;
            },
            tickets: () => `<h2>Support Tickets</h2>${ticketsHtml()}<p><a class="ap-link" href="help.html#ticket">Submit a new ticket →</a></p>`,
            viewed: () => `<h2>Recently Viewed Vehicles</h2><div class="ap-mini-grid" data-recently-viewed></div>`,
            listings: () => {
                const list = userListings().filter(v => lc(v.sellerEmail) === me);
                return `<h2>My Vehicle Listings</h2>${list.length ? '<div class="vehicle-grid" id="dashListingGrid"></div>' : '<div class="ap-empty">You have no active listings.</div>'}<p><a class="primary-button" href="sell.html">List / Manage Vehicles</a></p>`;
            },
            inquiries: () => {
                const reqs = read("autoprimePurchaseRequests", []).filter(r => lc(r.sellerEmail) === me);
                return `<h2>Buyer Inquiries</h2><h3 class="ap-sub">Buy requests</h3>${reqs.length ? '<div class="ap-list">' + reqs.map(r => `<div class="ap-list-item"><div><strong>${esc(r.vehicle)}</strong><small>From ${esc(r.buyerName || r.buyerEmail)} · ${esc(r.price)} · ${fmtDate(r.createdAt)}</small></div><span class="ap-badge ap-badge-${slug(r.status)}">${esc(r.status)}</span></div>`).join("") + '</div><p><a class="ap-link" href="sell.html#purchaseRequests">Accept or decline requests →</a></p>' : '<div class="ap-empty">No buy requests yet.</div>'}<h3 class="ap-sub">Questions from buyers</h3>${conversations(c => c.msgs.some(m => lc(m.to) === me))}`;
            },
            "seller-messages": () => `<h2>Messages</h2>${conversations()}`,
            reviews: () => {
                const r = reviewsFor(me), avg = avgRating(me);
                return `<h2>Seller Reviews</h2>${r.length ? `<p class="ap-big-rating"><span class="ap-stars">${stars(avg)}</span> ${avg.toFixed(1)} / 5 · ${r.length} review${r.length > 1 ? "s" : ""}</p><div class="ap-review-list">${r.map(x => `<div class="ap-review"><div><span class="ap-stars">${stars(x.rating)}</span>${x.verified ? ' <span class="ap-verified">✓ Verified Buyer</span>' : ""}</div><p>${esc(x.text)}</p><small>${esc(x.author)} · ${esc(x.vehicle || "")} · ${fmtDate(x.date)}</small></div>`).join("")}</div>` : '<div class="ap-empty">No reviews yet. Buyers can review you after a completed purchase.</div>'}`;
            }
        };
        body.innerHTML = `<section class="ap-card">${sections[current]()}</section>`;
        if (current === "favorites") { const g = document.getElementById("dashFavGrid"); const l = favs().map(byId).filter(Boolean); if (l.length) renderCards(g, l); else g.outerHTML = '<div class="ap-empty">No favorites yet. Tap ♡ on any vehicle.</div>'; }
        if (current === "listings") { const g = document.getElementById("dashListingGrid"); if (g) renderCards(g, userListings().filter(v => lc(v.sellerEmail) === me)); }
        if (current === "viewed") renderRecentlyViewed();
        if (current === "saved") bindSavedSearches(body, setupAccount);
        body.querySelectorAll("[data-chat]").forEach(b => b.onclick = () => window.AutoPrimeMessaging?.open(b.dataset.chat, b.dataset.vehicle));
        const startV = () => window.AutoPrimeId?.open({ standalone: true, vehicleTitle: "Account verification", price: "", sellerEmail: "", vehicleDetails: {} });
        body.querySelector("#startVerify")?.addEventListener("click", startV);
        body.querySelectorAll("[data-reverify]").forEach(b => b.onclick = startV);
        body.querySelectorAll("[data-vset]").forEach(b => b.onclick = () => { write(K.verifs, read(K.verifs, []).map(v => String(v.id) === b.dataset.vset ? { ...v, status: b.dataset.s } : v)); toast("Demo: verification marked " + b.dataset.s + "."); setupAccount(); });
        body.querySelectorAll("[data-role]").forEach(b => b.onclick = () => { const all = read(K.roles, {}); all[me] = b.dataset.role; write(K.roles, all); location.hash = ""; toast("Switched to " + b.dataset.role + " dashboard."); setupAccount(); });
    }
    function profileHtml(u, r) {
        const v = verifs()[0];
        return `<h2>${r === "seller" ? "Seller Profile" : "Profile"}</h2><dl class="ap-dl"><dt>Name</dt><dd>${esc(u.name || "—")}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Account type</dt><dd>${r === "seller" ? "Seller" : "Customer / Buyer"}</dd><dt>ID verification</dt><dd>${v ? `<span class="ap-badge ap-badge-${slug(v.status)}">${esc(v.status)}</span>` : "Not submitted"}</dd>${r === "seller" ? `<dt>Seller rating</dt><dd>${avgRating(u.email) ? avgRating(u.email).toFixed(1) + " / 5" : "No reviews yet"}</dd>` : ""}</dl>
            <div class="ap-notice">Buyer and seller tools are kept separate. Switch dashboards to use the other set of features (demo).</div>
            <button type="button" class="ap-btn-dark" data-role="${r === "seller" ? "buyer" : "seller"}">Switch to ${r === "seller" ? "Customer" : "Seller"} Dashboard</button>`;
    }

    /* ---------------- Home ---------------- */
    function setupHome() {
        const g = document.getElementById("recentlyAddedGrid"); if (!g) return;
        renderCards(g, catalog.slice().sort((a, b) => b.addedAt - a.addedAt).slice(0, 3));
        renderRecentlyViewed();
    }

    /* ---------------- Wiring ---------------- */
    function refresh() {
        if (!catalog) return;
        catalog = catalog.filter(v => v.source === "dealer").concat(userListings());
        decorate(); navCounts(); renderRecentlyViewed();
        if (page === "compare") setupCompare.draw && setupCompare.draw();
        if (page === "favorites") drawFavorites();
        if (page === "account") setupAccount();
    }
    window.AutoPrimeEnhance = { refresh };

    function observe() {
        new MutationObserver(muts => {
            muts.forEach(m => {
                const t = m.target;
                if (m.type === "attributes" && t.classList) {
                    if (t.classList.contains("vehicle-modal") && t.classList.contains("show")) enhanceVehicleModal(t);
                    if (t.classList.contains("vehicle-modal") && !t.classList.contains("show")) refresh();
                    if (t.classList.contains("autoprime-message-modal") && t.classList.contains("show")) enhanceMessageModal(t);
                }
                if (m.type === "childList" && t.classList && t.classList.contains("message-thread")) statusMarks(t.closest(".autoprime-message-modal"));
            });
        }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
    }

    document.addEventListener("DOMContentLoaded", () => {
        setupSupportChat();
        observe();
        loadCatalog().then(() => {
            decorate(); navCounts();
            if (page === "index") setupHome();
            if (page === "browse") setupBrowse();
            if (page === "compare") setupCompare();
            if (page === "favorites") drawFavorites();
            if (page === "help") setupHelp();
            if (page === "account") { setupAccount(); window.addEventListener("hashchange", setupAccount); }
        });
        window.addEventListener("storage", refresh);
    });
})();
