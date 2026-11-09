
(function () {
    "use strict";

    const STORAGE_KEY = "autoprimeListings";

    function getListings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveListings(listings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function getCardData(card) {
        const img = card.querySelector("img");
        const title = card.querySelector("h3");
        const meta = card.querySelector(".vehicle-info > p");
        const price = card.querySelector("h4");
        const type = card.querySelector(".vehicle-type");
        const listItems = [...card.querySelectorAll(".vehicle-info li")].map(li => li.textContent.trim());

        const details = {
            type: type ? type.textContent.trim() : "",
            title: title ? title.textContent.trim() : "",
            meta: meta ? meta.textContent.trim() : "",
            price: price ? price.textContent.trim() : "",
            image: img ? img.getAttribute("src") : "",
            imageAlt: img ? img.getAttribute("alt") : "",
            specs: listItems
        };

        return details;
    }

    function addDetailsButton(card) {
        if (card.querySelector(".view-vehicle")) return;

        const info = card.querySelector(".vehicle-info");
        if (!info) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "view-vehicle";
        button.textContent = "View Vehicle";
        info.appendChild(button);
    }

    function createModal() {
        if (document.querySelector(".vehicle-modal")) return;

        const modal = document.createElement("div");
        modal.className = "vehicle-modal";
        modal.innerHTML = `
            <div class="vehicle-modal-card" role="dialog" aria-modal="true" aria-label="Vehicle details">
                <button class="vehicle-modal-close" type="button" aria-label="Close">&times;</button>
                <div class="vehicle-modal-content">
                    <img class="modal-image" src="" alt="">
                    <div class="vehicle-modal-info">
                        <span class="vehicle-type modal-type"></span>
                        <h2 class="modal-title"></h2>
                        <p class="modal-meta"></p>
                        <div class="modal-price"></div>
                        <ul class="vehicle-detail-list"></ul>
                        <div class="modal-market-actions">
                            <button class="primary-button buy-vehicle-action" type="button">Buy Vehicle</button>
                            <button class="message-action-button message-seller-action" type="button">Message Seller</button>
                            <a class="secondary-dark-button modal-sell-link" href="sell.html">Sell / List a Vehicle</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector(".vehicle-modal-close").addEventListener("click", closeModal);
        modal.addEventListener("click", function (event) {
            if (event.target === modal) closeModal();
        });
    }

    function openModal(data) {
        createModal();
        const modal = document.querySelector(".vehicle-modal");

        modal.querySelector(".modal-image").src = data.image || "image/mustang.jpg";
        modal.querySelector(".modal-image").alt = data.imageAlt || data.title;
        modal.querySelector(".modal-type").textContent = data.type || "VEHICLE";
        modal.querySelector(".modal-title").textContent = data.title;
        modal.querySelector(".modal-meta").textContent = data.meta;
        modal.querySelector(".modal-price").textContent = data.price;
        const buyButton = modal.querySelector(".buy-vehicle-action");
        if (buyButton) {
            buyButton.dataset.vehicleTitle = data.title || "Vehicle";
            const messageButton = modal.querySelector(".message-seller-action");
            if (messageButton) {
                messageButton.dataset.sellerEmail = data.sellerEmail || "";
                messageButton.dataset.vehicleTitle = data.title || "Vehicle";
                messageButton.disabled = !data.sellerEmail;
                messageButton.title = data.sellerEmail ? "Message the seller" : "Seller messaging is available for member listings";
            }
            buyButton.dataset.listingId = data.listingId || "";
            buyButton.dataset.sellerEmail = data.sellerEmail || "";
            buyButton.dataset.vehiclePrice = data.price || "";
            buyButton.dataset.vehicleImage = data.image || "";
            buyButton.dataset.vehicleType = data.type || "";
            buyButton.dataset.vehicleMeta = data.meta || "";
            buyButton.dataset.vehicleYear = data.year || "";
            buyButton.dataset.vehicleMileage = data.mileage || "";
            buyButton.dataset.vehicleCondition = data.condition || "";
            buyButton.dataset.vehicleDescription = data.description || "";
            buyButton.dataset.vehicleSpecs = JSON.stringify(data.specs || []);
            buyButton.disabled = false;
            buyButton.textContent = "Buy Vehicle";

            try {
                const session = JSON.parse(localStorage.getItem("autoprimeSession") || "null");
                if (data.sellerEmail && session && session.email &&
                    data.sellerEmail.toLowerCase() === session.email.toLowerCase()) {
                    buyButton.disabled = true;
                    buyButton.textContent = "This Is Your Listing";
                }
            } catch (e) {}
        }

        const list = modal.querySelector(".vehicle-detail-list");
        list.innerHTML = "";

        const specs = data.specs || [];
        specs.forEach(function (spec) {
            const li = document.createElement("li");
            li.innerHTML = "<strong>Specification</strong><span>" + escapeHtml(spec) + "</span>";
            list.appendChild(li);
        });

        if (data.year) addDetail(list, "Year", data.year);
        if (data.mileage) addDetail(list, "Mileage", data.mileage);
        if (data.condition) addDetail(list, "Condition", data.condition);
        if (data.description) addDetail(list, "Description", data.description);

        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function addDetail(list, label, value) {
        const li = document.createElement("li");
        li.innerHTML = "<strong>" + escapeHtml(label) + "</strong><span>" + escapeHtml(value) + "</span>";
        list.appendChild(li);
    }

    function closeModal() {
        const modal = document.querySelector(".vehicle-modal");
        if (modal) modal.classList.remove("show");
        document.body.style.overflow = "";
    }

    function attachCardHandlers() {
        document.querySelectorAll(".vehicle-card").forEach(function (card) {
            addDetailsButton(card);
            const button = card.querySelector(".view-vehicle");
            if (button && !button.dataset.bound) {
                button.dataset.bound = "true";
                button.addEventListener("click", function () {
                    const data = getCardData(card);
                    Object.assign(data, {
                        year: card.dataset.year,
                        mileage: card.dataset.mileage,
                        condition: card.dataset.condition,
                        description: card.dataset.description,
                        listingId: card.dataset.listingId || "",
                        sellerEmail: card.dataset.sellerEmail || ""
                    });
                    openModal(data);
                });
            }
        });
    }

    function insertStoredListings() {
        const listings = getListings();
        if (!listings.length) return;

        const grids = {
            sedan: document.querySelector(".listing-section .vehicle-grid"),
            suv: document.querySelector(".listing-section .vehicle-grid"),
            pickup: document.querySelector(".listing-section .vehicle-grid")
        };

        const page = location.pathname.toLowerCase();
        let currentCategory = "";
        if (page.includes("sedan")) currentCategory = "sedan";
        if (page.includes("suv")) currentCategory = "suv";
        if (page.includes("pickup")) currentCategory = "pickup";

        if (!currentCategory || !grids[currentCategory]) return;

        const grid = grids[currentCategory];
        listings.filter(item => item.category === currentCategory).forEach(function (item) {
            const card = document.createElement("div");
            card.className = "vehicle-card dynamic-listing";
            card.dataset.category = item.category;
            card.dataset.year = item.year;
            card.dataset.mileage = item.mileage;
            card.dataset.condition = item.condition;
            card.dataset.description = item.description;
            card.dataset.listingId = item.id || "";
            card.dataset.sellerEmail = item.sellerEmail || "";
            card.innerHTML = `
                <img src="${item.image || "image/mustang.jpg"}" alt="${escapeHtml(item.brand + " " + item.model)}">
                <div class="vehicle-info">
                    <span class="vehicle-type">${escapeHtml(item.category.toUpperCase())}</span>
                    <span class="listing-badge">USER LISTING</span>
                    <h3>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</h3>
                    <p>${escapeHtml(item.year)} • ${escapeHtml(item.transmission || "Automatic")} • ${escapeHtml(item.mileage)} km</p>
                    <ul>
                        <li>${escapeHtml(item.engine || "Engine not specified")}</li>
                        <li>${escapeHtml(item.seats || "Seats not specified")}</li>
                        <li>${escapeHtml(item.color || "Color not specified")}</li>
                    </ul>
                    <h4>${escapeHtml(item.price || "Price not specified")}</h4>
                    <button type="button" class="view-vehicle">View Vehicle</button>
                    ${(() => {
                        try {
                            const session = JSON.parse(localStorage.getItem("autoprimeSession") || "null");
                            return session && session.email && item.sellerEmail &&
                                session.email.toLowerCase() === item.sellerEmail.toLowerCase()
                                ? `<button type="button" class="remove-my-listing" data-listing-id="${escapeHtml(item.id)}">Remove My Listing</button>`
                                : "";
                        } catch (e) { return ""; }
                    })()}
                </div>
            `;
            grid.prepend(card);
        });
    }

    function setupSearch() {
        const input = document.querySelector(".site-search");
        if (!input) return;

        /* Global vehicle index: the header search can find vehicles even when
           the user is currently on a different category page. */
        const builtInVehicles = [
            { name: "Toyota Vios 1.3 XLE", category: "sedan", url: "sedan.html" },
            { name: "Honda Civic RS Turbo", category: "sedan", url: "sedan.html" },
            { name: "Toyota Camry 2.5V Hybrid", category: "sedan", url: "sedan.html" },
            { name: "Honda City RS", category: "sedan", url: "sedan.html" },
            { name: "Toyota Corolla Altis", category: "sedan", url: "sedan.html" },
            { name: "Toyota Fortuner 2.8", category: "suv", url: "suv.html" },
            { name: "Mitsubishi Montero Sport", category: "suv", url: "suv.html" },
            { name: "Ford Everest Titanium", category: "suv", url: "suv.html" },
            { name: "Isuzu MU-X LS-E", category: "suv", url: "suv.html" },
            { name: "Honda CR-V V Turbo", category: "suv", url: "suv.html" },
            { name: "Toyota Hilux 2.4 G", category: "pickup", url: "pickup.html" },
            { name: "Ford Ranger Wildtrak", category: "pickup", url: "pickup.html" },
            { name: "Nissan Navara Pro-4X", category: "pickup", url: "pickup.html" },
            { name: "Isuzu D-Max LS", category: "pickup", url: "pickup.html" },
            { name: "Mitsubishi Strada GLS", category: "pickup", url: "pickup.html" }
        ];

        const storedVehicles = getListings().map(function (item) {
            return {
                name: ((item.brand || "") + " " + (item.model || "")).trim(),
                category: item.category || "vehicle",
                url: (item.category || "sedan") + ".html"
            };
        }).filter(function (item) { return item.name; });

        const searchIndex = builtInVehicles.concat(storedVehicles);
        const cards = [...document.querySelectorAll(".vehicle-card")];
        const count = document.querySelector(".search-result-count");

        let resultsBox = document.querySelector(".header-search-results");
        if (!resultsBox) {
            resultsBox = document.createElement("div");
            resultsBox.className = "header-search-results";
            input.parentElement.appendChild(resultsBox);
        }

        function normalize(value) {
            return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        }

        function findGlobalMatches(query) {
            const terms = normalize(query).split(" ").filter(Boolean);
            if (!terms.length) return [];
            return searchIndex.filter(function (item) {
                const haystack = normalize(item.name + " " + item.category);
                return terms.every(function (term) { return haystack.includes(term); });
            }).slice(0, 7);
        }

        function destination(item, query) {
            return item.url + "?search=" + encodeURIComponent(query || item.name) + "#vehicles";
        }

        function renderSuggestions(query) {
            const matches = findGlobalMatches(query);
            resultsBox.innerHTML = "";

            if (!query.trim()) {
                resultsBox.classList.remove("show");
                return matches;
            }

            if (!matches.length) {
                const empty = document.createElement("div");
                empty.className = "header-search-empty";
                empty.textContent = "No matching vehicle found.";
                resultsBox.appendChild(empty);
                resultsBox.classList.add("show");
                return matches;
            }

            matches.forEach(function (item, index) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "header-search-result" + (index === 0 ? " active" : "");
                button.innerHTML = "<strong>" + escapeHtml(item.name) + "</strong><span>" + escapeHtml(item.category.toUpperCase()) + "</span>";
                button.addEventListener("mousedown", function (event) {
                    event.preventDefault();
                    saveSearch(item.name);
                    window.location.href = destination(item, item.name);
                });
                resultsBox.appendChild(button);
            });
            resultsBox.classList.add("show");
            return matches;
        }

        function filterCurrentPage(query) {
            if (!cards.length) return;
            const terms = normalize(query).split(" ").filter(Boolean);
            let visible = 0;

            cards.forEach(function (card) {
                const haystack = normalize(card.textContent + " " + (card.dataset.category || ""));
                const show = !terms.length || terms.every(function (term) { return haystack.includes(term); });
                card.style.display = show ? "" : "none";
                if (show) visible++;
            });

            if (count) {
                count.textContent = visible + " vehicle" + (visible === 1 ? "" : "s") + " found.";
            }
        }

        /* ---- Automatic search history (saved per customer, shown when the bar is clicked) ---- */
        let autosaveTimer = null;

        function saveSearch(query) {
            if (window.AutoPrimeSavedSearches) window.AutoPrimeSavedSearches.add(query);
        }

        // Save a search automatically once the customer pauses on something that has results.
        function scheduleAutosave() {
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(function () {
                const query = input.value.trim();
                if (query.length >= 3 && findGlobalMatches(query).length) saveSearch(query);
            }, 1200);
        }

        function renderRecent() {
            const api = window.AutoPrimeSavedSearches;
            const items = api ? api.list().slice(0, 6) : [];
            resultsBox.innerHTML = "";
            if (!items.length) {
                resultsBox.classList.remove("show");
                return;
            }

            const head = document.createElement("div");
            head.className = "header-search-recent-head";
            head.innerHTML = "<span>Recent searches</span>";
            const clear = document.createElement("button");
            clear.type = "button";
            clear.textContent = "Clear all";
            clear.addEventListener("mousedown", function (event) {
                event.preventDefault();
                api.clear();
                renderRecent();
            });
            head.appendChild(clear);
            resultsBox.appendChild(head);

            items.forEach(function (item) {
                const row = document.createElement("div");
                row.className = "header-search-recent-item";

                const open = document.createElement("button");
                open.type = "button";
                open.className = "header-search-recent-open";
                open.innerHTML = '<span class="recent-icon" aria-hidden="true">&#8634;</span><strong>' + escapeHtml(item.query) + "</strong>";
                open.addEventListener("mousedown", function (event) {
                    event.preventDefault();
                    searchFor(item.query);
                });

                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "header-search-recent-remove";
                remove.setAttribute("aria-label", "Remove " + item.query + " from recent searches");
                remove.innerHTML = "&times;";
                remove.addEventListener("mousedown", function (event) {
                    event.preventDefault();
                    api.remove(item.id);
                    renderRecent();
                });

                row.appendChild(open);
                row.appendChild(remove);
                resultsBox.appendChild(row);
            });
            resultsBox.classList.add("show");
        }

        function searchFor(query) {
            input.value = query;
            const matches = findGlobalMatches(query);
            if (matches.length) {
                saveSearch(query);
                window.location.href = destination(matches[0], query);
            } else {
                runSearch();
            }
        }

        function runSearch() {
            const query = input.value.trim();
            filterCurrentPage(query);
            if (query) renderSuggestions(query);
            else renderRecent();
        }

        const params = new URLSearchParams(window.location.search);
        const initialSearch = params.get("search");
        if (initialSearch) input.value = initialSearch;

        // Until the customer types something new, clicking the bar shows their previous searches
        // (even when the page pre-filled the bar with the search they just ran).
        let typedByUser = false;

        input.addEventListener("input", function () {
            typedByUser = true;
            runSearch();
            scheduleAutosave();
        });
        input.addEventListener("search", runSearch); // the native "x" clear button
        function showDropdownForFocus() {
            if (typedByUser && input.value.trim()) renderSuggestions(input.value);
            else renderRecent();
        }
        input.addEventListener("focus", showDropdownForFocus);
        input.addEventListener("click", function () {
            if (!resultsBox.classList.contains("show")) showDropdownForFocus();
        });
        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const matches = findGlobalMatches(input.value);
                if (matches.length) {
                    saveSearch(input.value.trim());
                    window.location.href = destination(matches[0], input.value.trim());
                }
            }
            if (event.key === "Escape") resultsBox.classList.remove("show");
        });
        document.addEventListener("click", function (event) {
            if (!input.parentElement.contains(event.target)) resultsBox.classList.remove("show");
        });

        // Lets other parts of the site (e.g. the homepage list) open a search on the right page.
        window.AutoPrimeSearch = {
            resolveUrl: function (query) {
                const matches = findGlobalMatches(query);
                return matches.length ? destination(matches[0], query) : null;
            }
        };

        // On first load only filter the page; do not pop the dropdown open.
        filterCurrentPage(input.value.trim());
    }

    function setupSellForm() {
        const form = document.getElementById("sellForm");
        if (!form) return;

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const category = document.getElementById("sellCategory")?.value?.toLowerCase();
            const brand = document.getElementById("sellBrand")?.value?.trim();
            const model = document.getElementById("sellModel")?.value?.trim();
            const year = document.getElementById("sellYear")?.value?.trim();
            const mileage = document.getElementById("sellMileage")?.value?.trim();
            const price = document.getElementById("sellPrice")?.value?.trim() || "Contact seller";
            const description = document.getElementById("sellDescription")?.value?.trim() || "";
            const photoInput = document.getElementById("sellPhotos");

            if (!category || !brand || !model || !year || !mileage) {
                alert("Please complete the required vehicle information.");
                return;
            }

            const listing = {
                id: Date.now(),
                category,
                brand,
                model,
                year,
                mileage,
                price,
                description,
                condition: document.getElementById("sellCondition")?.value || "Used",
                engine: document.getElementById("sellEngine")?.value?.trim() || "",
                seats: "",
                color: document.getElementById("sellColor")?.value?.trim() || "",
                transmission: document.getElementById("sellTransmission")?.value || "Automatic",
                image: "",
                sellerEmail: (function () {
                    try {
                        const session = JSON.parse(localStorage.getItem("autoprimeSession") || "null");
                        return session && session.email ? session.email : "";
                    } catch (e) {
                        return "";
                    }
                })(),
                sellerName: (function () {
                    try {
                        const session = JSON.parse(localStorage.getItem("autoprimeSession") || "null");
                        return session && session.name ? session.name : "";
                    } catch (e) {
                        return "";
                    }
                })(),
                createdAt: new Date().toISOString()
            };

            const finish = function (imageData) {
                listing.image = imageData || "";
                const listings = getListings();
                listings.push(listing);
                saveListings(listings);

                try {
                    const seller = JSON.parse(localStorage.getItem("autoprimeSession") || "null");
                    if (seller && seller.email && window.AutoPrimeAuth && window.AutoPrimeAuth.addNotification) {
                        const name = [listing.brand, listing.model].filter(Boolean).join(" ") || "Your vehicle";
                        window.AutoPrimeAuth.addNotification(seller.email, "Your listing for " + name + " is now live in " + String(category).toUpperCase() + ". You can edit it, mark it as sold, or remove it from My Active Selling List.", "listing-posted", "sell.html");
                    }
                } catch (e) {}

                const message = document.createElement("div");
                message.className = "sell-success";
                message.style.display = "block";
                message.textContent = "Vehicle listed successfully! Redirecting you to the " + category.toUpperCase() + " listings...";
                form.parentNode.insertBefore(message, form);

                setTimeout(function () {
                    window.location.href = category + ".html";
                }, 1000);
            };

            if (photoInput && photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    finish(e.target.result);
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                finish("");
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeModal();
    });

    document.addEventListener("error", function (event) {
        const img = event.target;
        if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = "true";
        img.src = "image/mustang.jpg";
    }, true);

    window.AutoPrimeVehicles = { open: openModal, attach: attachCardHandlers, getCardData: getCardData };

    document.addEventListener("DOMContentLoaded", function () {
        insertStoredListings();
        attachCardHandlers();
        setupSearch();
        setupSellForm();
    });
})();


/* AUTOPRIME - Edit / Remove Seller Listings */
const AUTOPRIME_LISTINGS_KEY = "autoprimeListings";
const AUTOPRIME_MANUAL_SOLD_KEY = "autoprimeManualSoldListings";

function getAutoPrimeListings() {
    try {
        return JSON.parse(localStorage.getItem(AUTOPRIME_LISTINGS_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

function saveAutoPrimeListings(listings) {
    localStorage.setItem(AUTOPRIME_LISTINGS_KEY, JSON.stringify(listings));
}

function getCurrentAutoPrimeUser() {
    try {
        return JSON.parse(localStorage.getItem("autoprimeSession") || "null");
    } catch (e) {
        return null;
    }
}

function findOwnedListingIndex(listings, listingId) {
    const session = getCurrentAutoPrimeUser();
    if (!session || !session.email) return -1;

    return listings.findIndex(function (listing) {
        const sameId = String(listing.id) === String(listingId);
        const owner = listing.sellerEmail &&
            listing.sellerEmail.toLowerCase() === session.email.toLowerCase();
        return sameId && owner;
    });
}

function editListing(listingId) {
    if (window.AutoPrimeAuth && !window.AutoPrimeAuth.requireAuth("sell")) return;
    const listings = getAutoPrimeListings();
    const index = findOwnedListingIndex(listings, listingId);
    if (index < 0) {
        alert("You can only edit vehicle listings that belong to your account.");
        return;
    }

    const listing = listings[index];
    const newPrice = prompt("Enter the new price:", listing.price || "");
    if (newPrice === null) return;

    const newMileage = prompt("Enter the new mileage:", listing.mileage || "");
    if (newMileage === null) return;

    const newDescription = prompt("Enter the new description:", listing.description || "");
    if (newDescription === null) return;

    listing.price = newPrice.trim() || listing.price;
    listing.mileage = newMileage.trim() || listing.mileage;
    listing.description = newDescription.trim();
    listing.updatedAt = new Date().toISOString();

    saveAutoPrimeListings(listings);
    alert("Your vehicle listing has been updated successfully!");
    renderSellerListings();
}

function removeListing(listingId) {
    if (window.AutoPrimeAuth && !window.AutoPrimeAuth.requireAuth("sell")) return;
    const listings = getAutoPrimeListings();
    const index = findOwnedListingIndex(listings, listingId);
    if (index < 0) {
        alert("You can only remove vehicle listings that belong to your account.");
        return;
    }

    const listing = listings[index];
    const vehicleName = [listing.brand, listing.model].filter(Boolean).join(" ") || "this vehicle";
    if (!confirm(`Are you sure you want to remove ${vehicleName}?`)) return;

    listings.splice(index, 1);
    saveAutoPrimeListings(listings);

    // Close any pending buyer requests for a listing that no longer exists.
    try {
        const requests = JSON.parse(localStorage.getItem("autoprimePurchaseRequests") || "[]");
        let changed = false;
        requests.forEach(function (request) {
            if (String(request.listingId || "") === String(listingId) && request.status === "Pending") {
                request.status = "Cancelled";
                request.updatedAt = new Date().toISOString();
                changed = true;
            }
        });
        if (changed) localStorage.setItem("autoprimePurchaseRequests", JSON.stringify(requests));
    } catch (e) {}

    alert("Your vehicle listing has been removed.");
    renderSellerListings();

    // Remove the card immediately when the seller is viewing a category page.
    document.querySelectorAll('.vehicle-card[data-listing-id]').forEach(function (card) {
        if (String(card.dataset.listingId) === String(listingId)) card.remove();
    });
}


function getAutoPrimeManualSoldListings() {
    try {
        return JSON.parse(localStorage.getItem(AUTOPRIME_MANUAL_SOLD_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

function saveAutoPrimeManualSoldListings(listings) {
    localStorage.setItem(AUTOPRIME_MANUAL_SOLD_KEY, JSON.stringify(listings));
}

function markListingSold(listingId) {
    if (window.AutoPrimeAuth && !window.AutoPrimeAuth.requireAuth("sell")) return;

    const listings = getAutoPrimeListings();
    const index = findOwnedListingIndex(listings, listingId);
    if (index < 0) {
        alert("You can only mark your own vehicle listing as sold.");
        return;
    }

    const listing = listings[index];
    const vehicleName = [listing.brand, listing.model].filter(Boolean).join(" ") || listing.name || "this vehicle";
    if (!confirm(`Mark ${vehicleName} as SOLD? This will remove it from the active marketplace.`)) return;

    const session = getCurrentAutoPrimeUser();
    const soldListings = getAutoPrimeManualSoldListings();
    soldListings.unshift({
        ...listing,
        soldAt: new Date().toISOString(),
        soldBy: session && session.email ? session.email : listing.sellerEmail || "",
        soldStatus: "SOLD",
        manualSale: true
    });
    saveAutoPrimeManualSoldListings(soldListings);

    listings.splice(index, 1);
    saveAutoPrimeListings(listings);

    try {
        const requests = JSON.parse(localStorage.getItem("autoprimePurchaseRequests") || "[]");
        let changed = false;
        requests.forEach(function (request) {
            if (String(request.listingId || "") === String(listingId) && request.status === "Pending") {
                request.status = "Cancelled";
                request.updatedAt = new Date().toISOString();
                changed = true;
            }
        });
        if (changed) localStorage.setItem("autoprimePurchaseRequests", JSON.stringify(requests));
    } catch (e) {}

    document.querySelectorAll('.vehicle-card[data-listing-id]').forEach(function (card) {
        if (String(card.dataset.listingId) === String(listingId)) card.remove();
    });

    alert(`${vehicleName} has been marked as SOLD.`);
    renderSellerListings();
    if (window.AutoPrimeAuth && typeof window.AutoPrimeAuth.renderSellerSoldVehicles === "function") {
        window.AutoPrimeAuth.renderSellerSoldVehicles();
    }
}

function renderSellerListings() {
    const container =
        document.getElementById("myListings") ||
        document.getElementById("sellerListings");

    if (!container) return;

    const session = getCurrentAutoPrimeUser();
    if (!session || !session.email) {
        container.innerHTML = `
            <div class="no-listings auth-listings-lock">
                <h3>Sign in to manage your listings</h3>
                <p>Your vehicle listings are connected to your AUTOPRIME account.</p>
                <button type="button" class="primary-button inline-auth-button" onclick="window.AutoPrimeAuth && window.AutoPrimeAuth.open('login', 'sell')">Log In / Create Account</button>
            </div>`;
        return;
    }

    let listings = getAutoPrimeListings();

    // Give old listings an ID so editing/removing always targets the correct car.
    let migrated = false;
    listings.forEach(function (vehicle, index) {
        if (!vehicle.id) {
            vehicle.id = Date.now() + index;
            migrated = true;
        }
    });
    if (migrated) saveAutoPrimeListings(listings);

    const ownedListings = listings.filter(function (vehicle) {
        return vehicle.sellerEmail &&
            vehicle.sellerEmail.toLowerCase() === session.email.toLowerCase();
    });

    if (!ownedListings.length) {
        container.innerHTML = `
            <div class="no-listings">
                <h3>No vehicle listings yet</h3>
                <p>Vehicles you list for sale will appear here. You can edit, mark them sold, or remove them.</p>
            </div>`;
        return;
    }

    container.innerHTML = ownedListings.map(function (vehicle) {
        const title = [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || vehicle.name || "Vehicle";
        return `
        <div class="seller-listing-card" data-listing-id="${escapeListingHTML(vehicle.id)}">
            ${vehicle.image ? `<img class="seller-listing-image" src="${escapeListingHTML(vehicle.image)}" alt="${escapeListingHTML(title)}">` : ""}
            <div class="seller-listing-info">
                <span class="listing-badge">ACTIVE LISTING</span>
                <h3>${escapeListingHTML(title)}</h3>
                <p><strong>Category:</strong> ${escapeListingHTML(vehicle.category || vehicle.type || "Vehicle")}</p>
                <p><strong>Price:</strong> ${escapeListingHTML(vehicle.price || "Not specified")}</p>
                <p><strong>Mileage:</strong> ${escapeListingHTML(vehicle.mileage || "Not specified")}</p>
                <p><strong>Description:</strong> ${escapeListingHTML(vehicle.description || "No description")}</p>
            </div>
            <div class="listing-actions">
                <button type="button" class="edit-listing-btn" onclick="editListing('${escapeListingHTML(vehicle.id)}')">Edit Listing</button>
                <button type="button" class="mark-sold-btn" onclick="markListingSold('${escapeListingHTML(vehicle.id)}')">Mark as Sold</button>
                <button type="button" class="remove-listing-btn" onclick="removeListing('${escapeListingHTML(vehicle.id)}')">Remove Listing</button>
            </div>
        </div>`;
    }).join("");
}

function escapeListingHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", renderSellerListings);


/* ================= AUTOPRIME ACCOUNT / AUTHENTICATION =================
   Static front-end demo: accounts and sessions are stored in localStorage.
   A production marketplace should use a server, HTTPS, hashed passwords,
   database sessions, and verified seller/buyer identities. */
(function () {
    "use strict";

    const ACCOUNTS_KEY = "autoprimeAccounts";
    const SESSION_KEY = "autoprimeSession";
    const PURCHASES_KEY = "autoprimePurchaseRequests";
    const TRANSACTIONS_KEY = "autoprimeTransactions";
    const NOTIFICATIONS_KEY = "autoprimeNotifications";
    let pendingIntent = null;
    let pendingBuy = null;

    // This auth/transactions module is a separate IIFE from the main UI module,
    // so it needs its own HTML-escaping helper. Keeping it local also prevents
    // transaction data from being inserted into the page as raw HTML.
    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch (e) { return fallback; }
    }

    function addNotification(email, message, type, link) {
        email = String(email || "").toLowerCase();
        if (!email) return;
        const notifications = readJSON(NOTIFICATIONS_KEY, []);
        notifications.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            email: email,
            message: String(message || "AUTOPRIME notification"),
            type: type || "info",
            link: link || "",
            read: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 200)));
        updateNotificationNav();
    }

    function userNotifications() {
        const user = currentUser();
        if (!user || !user.email) return [];
        return readJSON(NOTIFICATIONS_KEY, []).filter(function (n) {
            return String(n.email || "").toLowerCase() === user.email.toLowerCase();
        });
    }

    function markAllNotificationsRead() {
        const user = currentUser();
        if (!user || !user.email) return;
        const notifications = readJSON(NOTIFICATIONS_KEY, []);
        notifications.forEach(function (n) {
            if (String(n.email || "").toLowerCase() === user.email.toLowerCase()) n.read = true;
        });
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        renderNotificationsPanel();
        updateNotificationNav();
    }

    function ensureNotificationsPanel() {
        if (document.querySelector('.notifications-panel')) return;
        const panel = document.createElement('aside');
        panel.className = 'notifications-panel';
        panel.innerHTML = '<div class="notifications-panel-head"><div><span class="small-title">ACCOUNT ACTIVITY</span><h3>Notifications</h3></div><button type="button" class="notifications-close" aria-label="Close">&times;</button></div><div class="notifications-actions"><button type="button" class="mark-notifications-read">Mark all as read</button></div><div class="notifications-list"></div>';
        document.body.appendChild(panel);
        panel.querySelector('.notifications-close').addEventListener('click', function(){ panel.classList.remove('show'); });
        panel.querySelector('.mark-notifications-read').addEventListener('click', markAllNotificationsRead);
    }

    function renderNotificationsPanel() {
        ensureNotificationsPanel();
        const panel = document.querySelector('.notifications-panel');
        const list = panel.querySelector('.notifications-list');
        if (!isLoggedIn()) {
            panel.classList.remove('show');
            list.innerHTML = '';
            return;
        }
        const notes = userNotifications();
        list.innerHTML = notes.length ? notes.map(function(n){
            let date = '';
            try { date = new Date(n.createdAt).toLocaleString('en-PH'); } catch(e) {}
            return '<div class="notification-item ' + (n.read ? 'read' : 'unread') + '">' +
                '<div class="notification-dot"></div><div><p>' + escapeHtml(n.message) + '</p><small>' + escapeHtml(date) + '</small>' +
                (n.link ? '<a href="' + escapeHtml(n.link) + '">View details</a>' : '') + '</div></div>';
        }).join('') : '<div class="no-notifications">No notifications yet.</div>';
    }

    function toggleNotifications() {
        if (!requireAuth()) return;
        ensureNotificationsPanel();
        renderNotificationsPanel();
        document.querySelector('.notifications-panel').classList.toggle('show');
    }

    function updateNotificationNav() {
        const nav = document.querySelector('header nav');
        if (!nav) return;
        let button = nav.querySelector('.notifications-nav-button');
        if (!isLoggedIn()) { if (button) button.remove(); return; }
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'notifications-nav-button';
            button.addEventListener('click', toggleNotifications);
            const account = nav.querySelector('.account-control');
            if (account) nav.insertBefore(button, account); else nav.appendChild(button);
        }
        const unread = userNotifications().filter(function(n){ return !n.read; }).length;
        button.innerHTML = 'Notifications' + (unread ? ' <span class="notification-badge">' + unread + '</span>' : '');
        button.title = unread ? unread + ' unread notification(s)' : 'Notifications';
    }

    function currentUser() {
        return readJSON(SESSION_KEY, null);
    }

    function isLoggedIn() {
        const user = currentUser();
        return !!(user && user.email);
    }

    function ensureAuthModal() {
        if (document.querySelector(".auth-modal")) return;

        const modal = document.createElement("div");
        modal.className = "auth-modal";
        modal.innerHTML = `
            <div class="auth-card" role="dialog" aria-modal="true" aria-label="AUTOPRIME account">
                <button class="auth-close" type="button" aria-label="Close">&times;</button>
                <div class="auth-brand">AUTO<span>PRIME</span></div>
                <h2 class="auth-heading">Welcome to AUTOPRIME</h2>
                <p class="auth-subtitle">Create an account or log in to buy and sell vehicles.</p>

                <div class="auth-tabs">
                    <button type="button" class="auth-tab active" data-auth-tab="login">Log In</button>
                    <button type="button" class="auth-tab" data-auth-tab="register">Create Account</button>
                </div>

                <form class="auth-form login-form" data-auth-form="login">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" required autocomplete="email">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Enter your password" required autocomplete="current-password">
                    <p class="auth-message" aria-live="polite"></p>
                    <button class="auth-submit" type="submit">Log In</button>
                </form>

                <form class="auth-form register-form" data-auth-form="register" hidden>
                    <label>Full Name</label>
                    <input type="text" name="name" placeholder="Your full name" required autocomplete="name">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" required autocomplete="email">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="At least 6 characters" minlength="6" required autocomplete="new-password">
                    <label>Confirm Password</label>
                    <input type="password" name="confirmPassword" placeholder="Repeat your password" minlength="6" required autocomplete="new-password">
                    <p class="auth-message" aria-live="polite"></p>
                    <button class="auth-submit" type="submit">Create Account</button>
                </form>
            </div>`;
        document.body.appendChild(modal);

        modal.querySelector(".auth-close").addEventListener("click", closeAuth);
        modal.addEventListener("click", function (event) {
            if (event.target === modal) closeAuth();
        });
        modal.querySelectorAll(".auth-tab").forEach(function (tab) {
            tab.addEventListener("click", function () { showAuthTab(tab.dataset.authTab); });
        });
        modal.querySelector('[data-auth-form="login"]').addEventListener("submit", login);
        modal.querySelector('[data-auth-form="register"]').addEventListener("submit", register);
    }

    function showAuthTab(tabName) {
        ensureAuthModal();
        document.querySelectorAll(".auth-tab").forEach(function (tab) {
            tab.classList.toggle("active", tab.dataset.authTab === tabName);
        });
        document.querySelectorAll(".auth-form").forEach(function (form) {
            form.hidden = form.dataset.authForm !== tabName;
            const msg = form.querySelector(".auth-message");
            if (msg) msg.textContent = "";
        });
    }

    function openAuth(tabName, intent) {
        pendingIntent = intent || pendingIntent;
        ensureAuthModal();
        showAuthTab(tabName || "login");
        document.querySelector(".auth-modal").classList.add("show");
        document.body.style.overflow = "hidden";
        setTimeout(function () {
            const form = document.querySelector(`[data-auth-form="${tabName || "login"}"]`);
            const first = form && form.querySelector("input");
            if (first) first.focus();
        }, 50);
    }

    function closeAuth() {
        const modal = document.querySelector(".auth-modal");
        if (modal) modal.classList.remove("show");
        if (!document.querySelector(".vehicle-modal.show")) document.body.style.overflow = "";
    }

    function login(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const email = form.email.value.trim().toLowerCase();
        const password = form.password.value;
        const accounts = readJSON(ACCOUNTS_KEY, []);
        const account = accounts.find(function (item) {
            return item.email.toLowerCase() === email && item.password === password;
        });
        const message = form.querySelector(".auth-message");
        if (!account) {
            message.textContent = "Incorrect email or password.";
            message.className = "auth-message error";
            return;
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({name: account.name, email: account.email}));
        closeAuth();
        updateAccountNav();
        unlockSellPage();
        finishPendingIntent();
        renderSellerSoldVehicles();
        renderTransactionsPage();
    }

    function register(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const name = form.name.value.trim();
        const email = form.email.value.trim().toLowerCase();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        const message = form.querySelector(".auth-message");

        if (password.length < 6) {
            message.textContent = "Password must contain at least 6 characters.";
            message.className = "auth-message error";
            return;
        }
        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            message.className = "auth-message error";
            return;
        }

        const accounts = readJSON(ACCOUNTS_KEY, []);
        if (accounts.some(function (item) { return item.email.toLowerCase() === email; })) {
            message.textContent = "An account with this email already exists. Log in instead.";
            message.className = "auth-message error";
            return;
        }

        accounts.push({id: Date.now(), name: name, email: email, password: password});
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        localStorage.setItem(SESSION_KEY, JSON.stringify({name: name, email: email}));
        closeAuth();
        updateAccountNav();
        unlockSellPage();
        showToast("Account created. You are now signed in.");
        finishPendingIntent();
        renderSellerSoldVehicles();
        renderTransactionsPage();
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
        pendingIntent = null;
        updateAccountNav();
        lockSellPage();
        if (typeof renderSellerListings === "function") renderSellerListings();
        renderSellerPurchaseRequests();
        renderBuyerPurchaseRequests();
        renderSellerSoldVehicles();
        renderTransactionsPage();
        updateNotificationNav();
        showToast("You have been logged out.");
    }

    function requireAuth(intent) {
        if (isLoggedIn()) return true;
        pendingIntent = intent || null;
        openAuth("login", intent);
        return false;
    }

    function finishPendingIntent() {
        const intent = pendingIntent;
        pendingIntent = null;
        if (!intent) {
            if (typeof renderSellerListings === "function") renderSellerListings();
            return;
        }
        if (intent === "sell") {
            if (!location.pathname.toLowerCase().endsWith("sell.html")) {
                location.href = "sell.html";
            } else {
                unlockSellPage();
                if (typeof renderSellerListings === "function") renderSellerListings();
                renderSellerPurchaseRequests();
            }
            return;
        }
        if (intent.startsWith("buy:")) {
            const details = pendingBuy || { vehicleTitle: intent.slice(4) };
            pendingBuy = null;
            createPurchaseRequest(details.vehicleTitle, details.listingId, details.sellerEmail, details.price, details.vehicleDetails || {});
        }
    }

    function moneyValue(value) {
        const numeric = String(value || "").replace(/[^0-9.]/g, "");
        const number = Number(numeric);
        return Number.isFinite(number) ? number : 0;
    }

    function formatPeso(value) {
        const number = moneyValue(value);
        if (!number) return value || "Price not specified";
        return "₱" + number.toLocaleString("en-PH", { maximumFractionDigits: 0 });
    }

    function makeReceiptNumber() {
        const now = new Date();
        const stamp = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");
        return "APR-" + stamp + "-" + String(Date.now()).slice(-7);
    }

    function createTransaction(data) {
        const transactions = readJSON(TRANSACTIONS_KEY, []);
        const transaction = {
            id: data.id || Date.now(),
            receiptNumber: makeReceiptNumber(),
            listingId: data.listingId || "",
            vehicle: data.vehicle || "Vehicle",
            amount: data.amount || "Price not specified",
            buyerName: data.buyerName || "Buyer",
            buyerEmail: data.buyerEmail || "",
            sellerName: data.sellerName || "Seller",
            sellerEmail: data.sellerEmail || "",
            image: data.image || "",
            category: data.category || "",
            meta: data.meta || "",
            year: data.year || "",
            mileage: data.mileage || "",
            condition: data.condition || "",
            description: data.description || "",
            specs: Array.isArray(data.specs) ? data.specs : [],
            status: "Completed",
            completedAt: new Date().toISOString()
        };
        transactions.unshift(transaction);
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        return transaction;
    }

    /* ---------- Buyer valid-ID step: part of every vehicle purchase ---------- */
    const IDS_KEY = "autoprimeBuyerIds";
    const ID_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const ID_MAX_ORIGINAL = 8 * 1024 * 1024;   // biggest file we will try to read
    const ID_MAX_PDF = 700 * 1024;             // PDFs cannot be compressed in the browser
    const ID_STORAGE_FULL = "Your ID could not be saved because this browser's storage is full. Try smaller images.";
    let idModalContext = null;
    let idPreviewUrls = [];

    function readIdStore() { return readJSON(IDS_KEY, {}); }

    function saveBuyerId(key, record) {
        const store = readIdStore();
        store[key] = record;
        try {
            localStorage.setItem(IDS_KEY, JSON.stringify(store));
            return true;
        } catch (e) {
            return false;
        }
    }

    function removeBuyerId(key) {
        const store = readIdStore();
        if (!(key in store)) return;
        delete store[key];
        try { localStorage.setItem(IDS_KEY, JSON.stringify(store)); } catch (e) {}
    }

    // An ID is only kept while it is needed: IDs attached to declined, cancelled
    // or unavailable buy requests are deleted.
    function purgeStaleIds() {
        const store = readIdStore();
        const keys = Object.keys(store);
        if (!keys.length) return;
        const requests = readJSON(PURCHASES_KEY, []);
        const closed = { "Declined": true, "Cancelled": true, "Unavailable": true };
        let changed = false;
        keys.forEach(function (key) {
            const request = requests.find(function (r) { return String(r.id) === key; });
            if (request && closed[request.status]) { delete store[key]; changed = true; }
        });
        if (changed) {
            try { localStorage.setItem(IDS_KEY, JSON.stringify(store)); } catch (e) {}
        }
    }

    // Read an uploaded ID. Photos are resized and re-encoded as JPEG so they fit
    // in localStorage; PDFs are stored as-is (small ones only).
    function fileToStoredId(file) {
        return new Promise(function (resolve, reject) {
            if (!ID_ALLOWED_TYPES.includes(file.type)) { reject(new Error("Use a JPG, PNG, WEBP, or PDF file.")); return; }
            if (file.size > ID_MAX_ORIGINAL) { reject(new Error("Each file must be 8 MB or smaller.")); return; }
            const reader = new FileReader();
            reader.onerror = function () { reject(new Error("Could not read the selected file.")); };
            reader.onload = function () {
                const dataUrl = reader.result;
                if (file.type === "application/pdf") {
                    if (file.size > ID_MAX_PDF) { reject(new Error("That PDF is too large for this demo (700 KB max). Upload a photo of your ID instead.")); return; }
                    resolve({ name: file.name, type: file.type, data: dataUrl });
                    return;
                }
                const img = new Image();
                img.onerror = function () { reject(new Error("That image could not be opened. Try another file.")); };
                img.onload = function () {
                    const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    const ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve({ name: file.name, type: "image/jpeg", data: canvas.toDataURL("image/jpeg", 0.8) });
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        });
    }

    const ID_TYPES = ["Driver's License","National ID (PhilSys)","Passport","UMID","Postal ID","Voter's ID","Other Government-Issued ID"];
    const ID_FRONT_ONLY = ["Passport"];
    function ensureIdModal() {
        let modal = document.querySelector(".id-modal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.className = "id-modal";
        modal.innerHTML = `
            <div class="id-modal-card" role="dialog" aria-modal="true" aria-label="Identity verification">
                <button type="button" class="id-modal-close" aria-label="Close">&times;</button>
                <p class="small-title">IDENTITY VERIFICATION</p>
                <p class="id-step-label">Step 1 of 4</p>
                <div class="id-progress"><span></span><span></span><span></span><span></span></div>
                <div class="id-modal-vehicle">
                    <img class="id-modal-vehicle-img" alt="">
                    <div>
                        <strong class="id-modal-vehicle-title"></strong>
                        <span class="id-modal-vehicle-price"></span>
                        <small class="id-modal-seller"></small>
                    </div>
                </div>
                <div class="id-step" data-step="1">
                    <h2>Select your ID type</h2>
                    <p class="id-modal-intro"></p>
                    <label class="id-field">Government ID type <em class="id-required">Required</em>
                        <select class="id-type"><option value="">Choose an ID type…</option>${ID_TYPES.map(t => `<option>${t}</option>`).join("")}</select>
                    </label>
                </div>
                <div class="id-step" data-step="2" hidden>
                    <h2>Upload your government ID</h2>
                    <p class="id-hint">Accepted formats: JPG, JPEG, PNG, PDF. Please use a sample or dummy ID only.</p>
                    <div class="id-upload-grid">
                        <label>Government ID &mdash; <span class="id-front-label">Front</span> <em class="id-required">Required</em>
                            <input type="file" class="id-front" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">
                            <span class="id-file-preview" data-side="front"></span>
                        </label>
                        <label class="id-back-wrap">Government ID &mdash; Back <em class="id-required">Required</em>
                            <input type="file" class="id-back" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">
                            <span class="id-file-preview" data-side="back"></span>
                        </label>
                    </div>
                    <div class="id-privacy"><strong>Privacy notice</strong><p>Your ID is used only to confirm that you are the person making this vehicle purchase. It is shown only to the seller of this vehicle (or AUTOPRIME Dealer), is never used for marketing, and is removed when the request is cancelled. In this academic prototype, files stay in this browser only.</p></div>
                    <label class="id-consent"><input type="checkbox" class="id-consent-box"> <span class="id-consent-text"></span></label>
                </div>
                <div class="id-step" data-step="3" hidden>
                    <h2>Verify Your Identity</h2>
                    <ol class="id-face-steps"><li>Find a well-lit place and remove hats or sunglasses.</li><li>Hold your device at eye level and look straight ahead.</li><li>Keep still while the check runs, then turn your head slowly when asked.</li></ol>
                    <div class="id-face-box"><div class="id-face-oval"></div><p class="id-face-status">Ready to start</p></div>
                    <button type="button" class="primary-button id-face-start">Start Face Verification</button>
                    <p class="id-face-consent">By starting, you agree to a simulated face check. <strong>Simulated feature:</strong> this prototype does not turn on your camera and does not collect any biometric data.</p>
                    <button type="button" class="id-manual-link">Use manual verification instead</button>
                </div>
                <div class="id-step" data-step="4" hidden>
                    <h2>Review and submit</h2>
                    <dl class="id-review"></dl>
                </div>
                <p class="id-upload-note">Demo notice: please use a sample or dummy ID image, not a real identity document.</p>
                <p class="id-modal-error" aria-live="polite"></p>
                <div class="id-modal-actions">
                    <button type="button" class="id-cancel">Cancel</button>
                    <button type="button" class="id-back-step" hidden>Back</button>
                    <button type="button" class="id-next">Continue</button>
                    <button type="button" class="id-submit" hidden>Submit ID &amp; Continue Purchase</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        let step = 1, faceMethod = "";
        const $ = sel => modal.querySelector(sel);
        const needsBack = () => ID_FRONT_ONLY.indexOf($(".id-type").value) === -1;
        const allowed = f => /\.(jpe?g|png|pdf)$/i.test(f.name);
        function show(n) {
            step = n;
            modal.querySelectorAll(".id-step").forEach(el => { el.hidden = Number(el.dataset.step) !== n; });
            modal.querySelectorAll(".id-progress span").forEach((el, i) => el.classList.toggle("done", i < n));
            $(".id-step-label").textContent = "Step " + n + " of 4";
            $(".id-back-step").hidden = n === 1;
            $(".id-next").hidden = n === 4;
            $(".id-submit").hidden = n !== 4;
            $(".id-modal-error").textContent = "";
            if (n === 2) {
                $(".id-back-wrap").hidden = !needsBack();
                $(".id-front-label").textContent = needsBack() ? "Front" : "Information Page";
            }
            if (n === 4) {
                const f = $(".id-front").files[0], b = $(".id-back").files[0];
                const rows = [["ID type", $(".id-type").value], [needsBack() ? "ID front" : "Information page", f ? f.name : "—"]];
                if (needsBack()) rows.push(["ID back", b ? b.name : "—"]);
                rows.push(["Face verification", faceMethod === "face" ? "Completed (simulated)" : "Manual review requested"], ["Consent", "Given"]);
                $(".id-review").innerHTML = rows.map(r => "<dt>" + escapeHtml(r[0]) + "</dt><dd>" + escapeHtml(r[1]) + "</dd>").join("");
            }
        }
        modal._reset = function () {
            $(".id-type").value = ""; faceMethod = "";
            $(".id-face-status").textContent = "Ready to start";
            $(".id-face-box").classList.remove("scanning", "ok");
            $(".id-face-start").disabled = false; $(".id-face-start").textContent = "Start Face Verification";
            show(1);
        };
        $(".id-next").addEventListener("click", function () {
            const error = $(".id-modal-error");
            if (step === 1 && !$(".id-type").value) { error.textContent = "Please select the type of government ID you will use."; return; }
            if (step === 2) {
                const f = $(".id-front").files[0], b = $(".id-back").files[0];
                if (!f) { error.textContent = "Please upload the " + (needsBack() ? "front of your ID." : "information page of your passport."); return; }
                if (!allowed(f) || (b && !allowed(b))) { error.textContent = "Only JPG, JPEG, PNG, or PDF files are accepted."; return; }
                if (needsBack() && !b) { error.textContent = "Please upload the back of your ID."; return; }
                if (!$(".id-consent-box").checked) { error.textContent = "Please tick the box to agree to share your ID."; return; }
            }
            if (step === 3 && !faceMethod) { error.textContent = "Please start face verification or choose manual verification."; return; }
            show(step + 1);
        });
        $(".id-back-step").addEventListener("click", () => show(Math.max(1, step - 1)));
        $(".id-face-start").addEventListener("click", function () {
            const btn = this; btn.disabled = true; btn.textContent = "Checking…";
            $(".id-face-box").classList.add("scanning");
            $(".id-face-status").textContent = "Simulating face check…";
            setTimeout(function () {
                $(".id-face-box").classList.remove("scanning"); $(".id-face-box").classList.add("ok");
                $(".id-face-status").textContent = "✓ Face check complete (simulated)";
                btn.textContent = "Completed"; faceMethod = "face";
            }, 2200);
        });
        $(".id-manual-link").addEventListener("click", function () {
            faceMethod = "manual";
            $(".id-face-status").textContent = "Manual verification selected — our team will review your ID.";
        });

        $(".id-modal-close").addEventListener("click", closeIdModal);
        $(".id-cancel").addEventListener("click", closeIdModal);
        modal.addEventListener("click", function (event) { if (event.target === modal) closeIdModal(); });

        function showPreview(input, side) {
            const holder = modal.querySelector('.id-file-preview[data-side="' + side + '"]');
            holder.innerHTML = "";
            const file = input.files && input.files[0];
            if (!file) return;
            if (file.type.indexOf("image/") === 0) {
                const url = URL.createObjectURL(file);
                idPreviewUrls.push(url);
                const img = document.createElement("img");
                img.src = url;
                img.alt = "ID preview";
                holder.appendChild(img);
            } else {
                holder.textContent = "📄 " + file.name;
            }
        }
        $(".id-front").addEventListener("change", function () { showPreview(this, "front"); });
        $(".id-back").addEventListener("change", function () { showPreview(this, "back"); });

        $(".id-submit").addEventListener("click", function () {
            const context = idModalContext;
            if (!context) return;
            const error = $(".id-modal-error");
            const submit = $(".id-submit");
            const front = $(".id-front").files[0];
            const back = needsBack() ? $(".id-back").files[0] : null;
            const idType = $(".id-type").value, method = faceMethod;
            error.textContent = "";
            submit.disabled = true;
            submit.textContent = "Processing ID…";
            Promise.all([fileToStoredId(front), back ? fileToStoredId(back) : Promise.resolve(null)])
                .then(function (files) {
                    try {
                        const user = currentUser();
                        const list = readJSON("autoprimeVerifications", []);
                        list.unshift({ id: Date.now(), email: user ? user.email : "", idType: idType, method: method,
                            frontName: front.name, backName: back ? back.name : "", vehicle: context.vehicleTitle || "Vehicle",
                            status: "Pending", submittedAt: new Date().toISOString() });
                        localStorage.setItem("autoprimeVerifications", JSON.stringify(list.slice(0, 50)));
                    } catch (e) {}
                    closeIdModal();
                    if (context.standalone) { showToast("ID submitted. Track its progress under My Account → Verification Status."); if (window.AutoPrimeEnhance) window.AutoPrimeEnhance.refresh(); return; }
                    completePurchase(context, { front: files[0], back: files[1], idType: idType });
                })
                .catch(function (err) {
                    error.textContent = err && err.message ? err.message : "Could not process the ID. Please try again.";
                })
                .then(function () {
                    submit.disabled = false;
                    submit.textContent = "Submit ID & Continue Purchase";
                });
        });
        return modal;
    }

    function openIdModal(details) {
        const modal = ensureIdModal();
        idModalContext = details;
        const vehicleDetails = details.vehicleDetails || {};
        const isPrivate = !!details.sellerEmail;

        modal.querySelector(".id-front").value = "";
        modal.querySelector(".id-back").value = "";
        modal.querySelectorAll(".id-file-preview").forEach(function (el) { el.innerHTML = ""; });
        modal.querySelector(".id-consent-box").checked = false;
        modal.querySelector(".id-modal-error").textContent = "";

        const img = modal.querySelector(".id-modal-vehicle-img");
        img.src = vehicleDetails.image || "image/mustang.jpg";
        img.onerror = function () { img.onerror = null; img.src = "image/mustang.jpg"; };
        modal.querySelector(".id-modal-vehicle-title").textContent = details.vehicleTitle || "Vehicle";
        modal.querySelector(".id-modal-vehicle-price").textContent = formatPeso(details.price);
        modal.querySelector(".id-modal-seller").textContent = isPrivate
            ? "Seller: " + getSellerName(details.sellerEmail)
            : "Sold by AUTOPRIME Dealer";
        modal.querySelector(".id-modal-intro").textContent = isPrivate
            ? "A valid government-issued ID is required to buy a vehicle. It is sent to the seller together with your buy request, so the seller can see which car you want and who you are."
            : "A valid government-issued ID is required to buy a vehicle. AUTOPRIME Dealer keeps it on file for this purchase.";
        modal.querySelector(".id-consent-text").textContent = isPrivate
            ? "I agree to share this ID with the seller for this purchase only."
            : "I agree to share my ID with AUTOPRIME Dealer for vehicle purchase verification purposes only.";
        modal.querySelector(".id-submit").textContent = "Submit ID & Continue Purchase";
        modal.querySelector(".id-modal-vehicle").style.display = details.standalone ? "none" : "";
        if (details.standalone) {
            modal.querySelector(".id-modal-intro").textContent = "Verify your identity ahead of time so future purchases go faster. Please use a sample ID for this demo.";
            modal.querySelector(".id-consent-text").textContent = "I agree to share my ID with AUTOPRIME Dealer for vehicle purchase verification purposes only.";
        }
        if (modal._reset) modal._reset();

        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeIdModal() {
        const modal = document.querySelector(".id-modal");
        if (modal) modal.classList.remove("show");
        idModalContext = null;
        idPreviewUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        idPreviewUrls = [];
        if (!document.querySelector(".vehicle-modal.show") && !document.querySelector(".auth-modal.show")) {
            document.body.style.overflow = "";
        }
    }

    // Step 1 of buying: checks, then ask the buyer for a valid ID.
    function createPurchaseRequest(vehicleTitle, listingId, sellerEmail, price, vehicleDetails) {
        if (!isLoggedIn()) {
            pendingBuy = { vehicleTitle, listingId, sellerEmail, price, vehicleDetails: vehicleDetails || {} };
            requireAuth("buy:" + vehicleTitle);
            return;
        }
        const user = currentUser();

        if (sellerEmail && user.email && sellerEmail.toLowerCase() === user.email.toLowerCase()) {
            showToast("You cannot buy your own vehicle listing.");
            return;
        }

        if (sellerEmail) {
            const duplicate = readJSON(PURCHASES_KEY, []).some(function (request) {
                return request.status === "Pending" &&
                    request.buyerEmail === user.email &&
                    String(request.listingId || "") === String(listingId || "") &&
                    request.vehicle === (vehicleTitle || "Vehicle");
            });
            if (duplicate) {
                showToast("You already sent a purchase request for this vehicle.");
                return;
            }
        }

        openIdModal({
            vehicleTitle: vehicleTitle || "Vehicle",
            listingId: listingId || "",
            sellerEmail: sellerEmail || "",
            price: price || "",
            vehicleDetails: vehicleDetails || {}
        });
    }

    // Step 2: the ID has been provided, so the purchase / buy request goes through.
    function completePurchase(details, idData) {
        const user = currentUser();
        if (!user) return;
        const vehicleTitle = details.vehicleTitle;
        const listingId = details.listingId;
        const sellerEmail = details.sellerEmail;
        const price = details.price;
        const vehicleDetails = details.vehicleDetails || {};
        const submittedAt = new Date().toISOString();
        const idRecord = {
            front: idData.front,
            back: idData.back || null,
            buyerEmail: user.email,
            sellerEmail: sellerEmail || "sales@autoprime.com",
            submittedAt: submittedAt
        };

        // Built-in AUTOPRIME inventory has no private seller account, so the
        // purchase is completed immediately and a receipt is generated.
        if (!sellerEmail) {
            const txId = Date.now();
            if (!saveBuyerId("tx-" + txId, idRecord)) { showToast(ID_STORAGE_FULL); return; }
            const transaction = createTransaction({
                id: txId,
                listingId: listingId || "",
                vehicle: vehicleTitle || "Vehicle",
                amount: price || "Price not specified",
                buyerName: user.name,
                buyerEmail: user.email,
                sellerName: "AUTOPRIME Dealer",
                sellerEmail: "sales@autoprime.com",
                ...vehicleDetails
            });
            showToast("Purchase completed. Receipt " + transaction.receiptNumber + " created.");
            setTimeout(function () { location.href = "transactions.html?receipt=" + encodeURIComponent(transaction.receiptNumber); }, 550);
            return;
        }

        const requests = readJSON(PURCHASES_KEY, []);
        const requestId = Date.now();
        if (!saveBuyerId(String(requestId), idRecord)) { showToast(ID_STORAGE_FULL); return; }

        requests.unshift({
            id: requestId,
            listingId: listingId || "",
            vehicle: vehicleTitle || "Vehicle",
            price: price || "Price not specified",
            vehicleDetails: vehicleDetails,
            sellerEmail: sellerEmail,
            buyerName: user.name,
            buyerEmail: user.email,
            idSubmitted: true,
            idSubmittedAt: submittedAt,
            status: "Pending",
            createdAt: submittedAt
        });
        try {
            localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));
        } catch (e) {
            removeBuyerId(String(requestId));
            showToast(ID_STORAGE_FULL);
            return;
        }
        addNotification(sellerEmail, (user.name || user.email) + " sent a buy request for " + (vehicleTitle || "your vehicle") + " with a valid ID attached.", "buy-request", "sell.html#purchaseRequests");
        showToast("Buy request sent with your valid ID. The seller must accept it before the sale is completed.");
        const vehicleClose = document.querySelector(".vehicle-modal.show .vehicle-modal-close");
        if (vehicleClose) vehicleClose.click();
        renderBuyerPurchaseRequests();
    }

    function getSellerName(email) {
        const accounts = readJSON(ACCOUNTS_KEY, []);
        const match = accounts.find(function (a) { return a.email && a.email.toLowerCase() === String(email || "").toLowerCase(); });
        return match ? match.name : "Seller";
    }

    function acceptPurchaseRequest(requestId) {
        if (!requireAuth("sell")) return;
        const user = currentUser();
        const requests = readJSON(PURCHASES_KEY, []);
        const request = requests.find(function (r) { return String(r.id) === String(requestId); });
        if (!request || request.status !== "Pending") {
            showToast("This purchase request is no longer available.");
            renderSellerPurchaseRequests();
            return;
        }
        if (!request.sellerEmail || request.sellerEmail.toLowerCase() !== user.email.toLowerCase()) {
            showToast("You can only accept purchase requests for your own vehicles.");
            return;
        }
        // A private seller request is valid only while the original listing is still active.
        if (request.listingId) {
            const activeListings = readJSON("autoprimeListings", []);
            const activeListing = activeListings.find(function (item) {
                return String(item.id) === String(request.listingId);
            });
            if (!activeListing) {
                request.status = "Unavailable";
                request.updatedAt = new Date().toISOString();
                localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));
                showToast("This vehicle is no longer available for sale.");
                renderSellerPurchaseRequests();
                return;
            }
            if (!activeListing.sellerEmail || activeListing.sellerEmail.toLowerCase() !== user.email.toLowerCase()) {
                showToast("This listing does not belong to your account.");
                return;
            }
        }

        if (!confirm("Accept " + request.buyerName + "'s purchase of " + request.vehicle + " for " + formatPeso(request.price) + "?")) return;

        const transaction = createTransaction({
            listingId: request.listingId,
            vehicle: request.vehicle,
            amount: request.price,
            buyerName: request.buyerName,
            buyerEmail: request.buyerEmail,
            sellerName: user.name || getSellerName(user.email),
            sellerEmail: user.email,
            ...(request.vehicleDetails || {})
        });
        request.status = "Completed";
        request.transactionId = transaction.id;
        request.receiptNumber = transaction.receiptNumber;
        request.completedAt = transaction.completedAt;

        // Once one buyer is accepted, all other pending requests for that same car
        // are closed so the vehicle cannot accidentally be sold more than once.
        requests.forEach(function (other) {
            if (String(other.id) !== String(request.id) &&
                String(other.listingId || "") === String(request.listingId || "") &&
                other.status === "Pending") {
                other.status = "Unavailable";
                other.updatedAt = transaction.completedAt;
            }
        });
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));

        purgeStaleIds();

        // A sold vehicle is automatically removed from active marketplace listings.
        if (request.listingId) {
            const listings = readJSON("autoprimeListings", []);
            const updated = listings.filter(function (item) { return String(item.id) !== String(request.listingId); });
            localStorage.setItem("autoprimeListings", JSON.stringify(updated));
        }

        addNotification(request.buyerEmail, "Your buy request for " + request.vehicle + " was APPROVED. Receipt " + transaction.receiptNumber + " is ready.", "approved", "transactions.html?receipt=" + encodeURIComponent(transaction.receiptNumber));
        addNotification(user.email, "You approved " + request.buyerName + "'s buy request for " + request.vehicle + ".", "sale", "transactions.html?receipt=" + encodeURIComponent(transaction.receiptNumber));
        showToast("Sale completed. Transaction receipt " + transaction.receiptNumber + " created for both buyer and seller.");
        renderSellerPurchaseRequests();
        renderBuyerPurchaseRequests();
        renderSellerSoldVehicles();
        renderTransactionsPage();
        if (typeof renderSellerListings === "function") renderSellerListings();
    }

    function declinePurchaseRequest(requestId) {
        if (!requireAuth("sell")) return;
        const user = currentUser();
        const requests = readJSON(PURCHASES_KEY, []);
        const request = requests.find(function (r) { return String(r.id) === String(requestId); });
        if (!request || !request.sellerEmail || request.sellerEmail.toLowerCase() !== user.email.toLowerCase()) return;
        request.status = "Declined";
        request.updatedAt = new Date().toISOString();
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));
        purgeStaleIds();
        addNotification(request.buyerEmail, "Your buy request for " + request.vehicle + " was DECLINED by the seller.", "declined", "transactions.html#myBuyRequests");
        renderSellerPurchaseRequests();
        renderBuyerPurchaseRequests();
        showToast("Purchase request declined.");
    }

    function renderSellerPurchaseRequests() {
        const container = document.getElementById("sellerPurchaseRequests");
        if (!container) return;
        const user = currentUser();
        if (!user || !user.email) {
            container.innerHTML = '<div class="no-listings"><h3>Log in to view purchase requests</h3><p>Buyer requests for your vehicles will appear here.</p></div>';
            return;
        }
        const requests = readJSON(PURCHASES_KEY, []).filter(function (r) {
            return r.sellerEmail && r.sellerEmail.toLowerCase() === user.email.toLowerCase();
        });
        if (!requests.length) {
            container.innerHTML = '<div class="no-listings"><h3>No purchase requests yet</h3><p>When a buyer requests one of your vehicles, you can approve or decline it here.</p></div>';
            return;
        }
        container.innerHTML = requests.map(function (r) {
            const pending = r.status === "Pending";
            const cancelRequested = r.status === "Cancel Requested";
            return '<div class="purchase-request-card">' +
                '<div class="pr-body">' + requestVehicleImage(r) + '<div class="pr-text">' +
                '<span class="receipt-status ' + String(r.status || "Pending").toLowerCase().replace(/\s+/g,'-') + '">' + escapeHtml(r.status || "Pending") + '</span>' +
                '<h3>' + escapeHtml(r.vehicle) + '</h3>' +
                requestVehicleFacts(r) +
                '<p><strong>Buyer:</strong> ' + escapeHtml(r.buyerName) + ' (' + escapeHtml(r.buyerEmail) + ')</p>' +
                '<p><strong>Price:</strong> ' + escapeHtml(formatPeso(r.price)) + '</p>' +
                (r.cancelComment ? '<p class="cancel-comment"><strong>Cancellation comment:</strong> ' + escapeHtml(r.cancelComment) + '</p>' : '') +
                (r.receiptNumber ? '<p><strong>Receipt:</strong> ' + escapeHtml(r.receiptNumber) + '</p>' : '') +
                buyerIdBlock(r) + '</div></div>' +
                '<div class="purchase-request-actions">' +
                (pending ? '<button type="button" class="accept-sale-btn" data-request-id="' + escapeHtml(r.id) + '">Approve Buy Request</button><button type="button" class="decline-sale-btn" data-request-id="' + escapeHtml(r.id) + '">Decline</button>' : '') +
                (cancelRequested ? '<button type="button" class="approve-cancel-btn" data-request-id="' + escapeHtml(r.id) + '">Approve Cancellation</button><button type="button" class="decline-cancel-btn" data-request-id="' + escapeHtml(r.id) + '">Decline Cancellation</button>' : '') +
                (r.receiptNumber ? '<a class="receipt-link-btn" href="transactions.html?receipt=' + encodeURIComponent(r.receiptNumber) + '">View Receipt</a>' : '') +
                '</div></div>';
        }).join("");
    }

    // The car the buyer wants, shown on the seller's request card.
    function requestVehicleImage(r) {
        const d = (r && r.vehicleDetails) || {};
        if (!d.image) return "";
        return '<img class="pr-vehicle-img" src="' + escapeHtml(d.image) + '" alt="' + escapeHtml(r.vehicle || "Vehicle") + '" onerror="this.onerror=null;this.src=\'image/mustang.jpg\';">';
    }

    function requestVehicleFacts(r) {
        const d = (r && r.vehicleDetails) || {};
        const mileage = d.mileage ? String(d.mileage) + (/km/i.test(String(d.mileage)) ? "" : " km") : "";
        const facts = [d.category, d.meta || [d.year, mileage].filter(Boolean).join(" • "), d.condition].filter(Boolean);
        if (!facts.length) return "";
        return '<div class="pr-facts">' + facts.map(function (f) { return '<span>' + escapeHtml(f) + '</span>'; }).join("") + '</div>';
    }

    // The buyer's valid ID, visible to the seller on the buy request.
    function buyerIdBlock(r) {
        if (!r.idSubmitted) {
            return '<p class="pr-id-missing"><strong>Buyer ID:</strong> none on file (this request was sent before ID upload was required).</p>';
        }
        const closed = r.status === "Declined" || r.status === "Cancelled" || r.status === "Unavailable";
        const record = readIdStore()[String(r.id)];
        if (closed || !record) {
            return '<p class="pr-id-missing"><strong>Buyer ID:</strong> removed because this request is closed.</p>';
        }
        function thumb(file, side, label) {
            if (!file) return "";
            const preview = file.type === "application/pdf"
                ? '<span class="id-pdf-thumb">PDF</span>'
                : '<img src="' + escapeHtml(file.data) + '" alt="' + escapeHtml(label) + '">';
            return '<button type="button" class="view-id-btn" data-request-id="' + escapeHtml(r.id) + '" data-side="' + side + '" title="View ' + label + '">' + preview + '<span>' + label + '</span></button>';
        }
        return '<div class="pr-id"><strong>Buyer&rsquo;s valid ID <small>(click to enlarge)</small></strong><div class="pr-id-thumbs">' +
            thumb(record.front, "front", "Front") + thumb(record.back, "back", "Back") + '</div></div>';
    }

    function dataUrlToBlobUrl(dataUrl) {
        const parts = String(dataUrl).split(",");
        const mime = (parts[0].match(/:(.*?);/) || [])[1] || "application/octet-stream";
        const binary = atob(parts[1] || "");
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: mime }));
    }

    function closeIdViewer() {
        const viewer = document.querySelector(".id-viewer");
        if (!viewer) return;
        if (viewer.dataset.blobUrl) URL.revokeObjectURL(viewer.dataset.blobUrl);
        viewer.remove();
    }

    // Only the seller or the buyer of that request may open the ID.
    function openIdViewer(requestId, side) {
        const user = currentUser();
        if (!user || !user.email) return;
        const me = user.email.toLowerCase();
        const request = readJSON(PURCHASES_KEY, []).find(function (r) { return String(r.id) === String(requestId); });
        const record = readIdStore()[String(requestId)];
        const allowed = request && [request.sellerEmail, request.buyerEmail].some(function (e) { return String(e || "").toLowerCase() === me; });
        const file = record && (side === "back" ? record.back : record.front);
        if (!allowed || !file) { showToast("This ID is not available."); return; }

        closeIdViewer();
        const viewer = document.createElement("div");
        viewer.className = "id-viewer";
        let body;
        if (file.type === "application/pdf") {
            const url = dataUrlToBlobUrl(file.data);
            viewer.dataset.blobUrl = url;
            body = '<iframe class="id-viewer-frame" src="' + url + '" title="Buyer ID (PDF)"></iframe>';
        } else {
            body = '<img class="id-viewer-img" src="' + escapeHtml(file.data) + '" alt="Buyer valid ID">';
        }
        viewer.innerHTML = '<div class="id-viewer-card"><button type="button" class="id-viewer-close" aria-label="Close">&times;</button>' +
            '<h3>Valid ID &mdash; ' + (side === "back" ? "Back" : "Front") + '</h3>' +
            '<p>' + escapeHtml(request.buyerName || request.buyerEmail || "Buyer") + ' &middot; for ' + escapeHtml(request.vehicle || "vehicle") + '</p>' + body + '</div>';
        document.body.appendChild(viewer);
        viewer.addEventListener("click", function (event) { if (event.target === viewer) closeIdViewer(); });
        viewer.querySelector(".id-viewer-close").addEventListener("click", closeIdViewer);
    }

    function requestCancellation(requestId) {
        if (!requireAuth()) return;
        const user = currentUser();
        const requests = readJSON(PURCHASES_KEY, []);
        const request = requests.find(function(r){ return String(r.id) === String(requestId); });
        if (!request || String(request.buyerEmail || '').toLowerCase() !== user.email.toLowerCase()) { showToast('Request not found.'); return; }
        if (request.status !== 'Pending') { showToast('Only a pending buy request can be cancelled.'); return; }
        const comment = prompt('Tell the seller why you want to cancel this buy request:');
        if (comment === null) return;
        if (!comment.trim()) { showToast('Please enter a cancellation comment.'); return; }
        request.status = 'Cancel Requested';
        request.cancelComment = comment.trim();
        request.cancelRequestedAt = new Date().toISOString();
        request.updatedAt = request.cancelRequestedAt;
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));
        addNotification(request.sellerEmail, (user.name || user.email) + ' requested to cancel the buy request for ' + request.vehicle + '. Comment: ' + comment.trim(), 'cancel-request', 'sell.html#purchaseRequests');
        renderBuyerPurchaseRequests();
        renderSellerPurchaseRequests();
        showToast('Cancellation request sent to the seller.');
    }

    function approveCancellation(requestId) {
        if (!requireAuth('sell')) return;
        const user = currentUser();
        const requests = readJSON(PURCHASES_KEY, []);
        const request = requests.find(function(r){ return String(r.id) === String(requestId); });
        if (!request || String(request.sellerEmail || '').toLowerCase() !== user.email.toLowerCase() || request.status !== 'Cancel Requested') return;
        request.status = 'Cancelled';
        request.cancelResolvedAt = new Date().toISOString();
        request.updatedAt = request.cancelResolvedAt;
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));
        purgeStaleIds();
        addNotification(request.buyerEmail, 'The seller APPROVED your cancellation request for ' + request.vehicle + '.', 'cancel-approved', 'transactions.html#myBuyRequests');
        renderSellerPurchaseRequests();
        renderBuyerPurchaseRequests();
        showToast('Cancellation approved.');
    }

    function declineCancellation(requestId) {
        if (!requireAuth('sell')) return;
        const user = currentUser();
        const requests = readJSON(PURCHASES_KEY, []);
        const request = requests.find(function(r){ return String(r.id) === String(requestId); });
        if (!request || String(request.sellerEmail || '').toLowerCase() !== user.email.toLowerCase() || request.status !== 'Cancel Requested') return;
        request.status = 'Pending';
        request.cancelDeclinedAt = new Date().toISOString();
        request.updatedAt = request.cancelDeclinedAt;
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(requests));
        addNotification(request.buyerEmail, 'The seller DECLINED your cancellation request for ' + request.vehicle + '. Your buy request is still pending.', 'cancel-declined', 'transactions.html#myBuyRequests');
        renderSellerPurchaseRequests();
        renderBuyerPurchaseRequests();
        showToast('Cancellation declined; the buy request is pending again.');
    }

    function renderBuyerPurchaseRequests() {
        const container = document.getElementById('buyerPurchaseRequests');
        if (!container) return;
        const user = currentUser();
        if (!user || !user.email) { container.innerHTML = ''; return; }
        const requests = readJSON(PURCHASES_KEY, []).filter(function(r){ return String(r.buyerEmail || '').toLowerCase() === user.email.toLowerCase(); });
        if (!requests.length) {
            container.innerHTML = '<div class="no-listings"><h3>No buy requests yet</h3><p>Your requests to private sellers will appear here.</p></div>';
            return;
        }
        container.innerHTML = requests.map(function(r){
            const canCancel = r.status === 'Pending';
            return '<div class="purchase-request-card">' +
                '<div><span class="receipt-status ' + String(r.status || 'Pending').toLowerCase().replace(/\s+/g,'-') + '">' + escapeHtml(r.status || 'Pending') + '</span>' +
                '<h3>' + escapeHtml(r.vehicle) + '</h3><p><strong>Seller:</strong> ' + escapeHtml(getSellerName(r.sellerEmail)) + ' (' + escapeHtml(r.sellerEmail) + ')</p>' +
                '<p><strong>Price:</strong> ' + escapeHtml(formatPeso(r.price)) + '</p>' +
                (r.idSubmitted ? '<p><strong>Valid ID:</strong> ✓ Sent to the seller with this request</p>' : '') +
                (r.cancelComment ? '<p><strong>Your cancellation comment:</strong> ' + escapeHtml(r.cancelComment) + '</p>' : '') +
                (r.receiptNumber ? '<p><strong>Receipt:</strong> ' + escapeHtml(r.receiptNumber) + '</p>' : '') + '</div>' +
                '<div class="purchase-request-actions">' +
                (canCancel ? '<button type="button" class="request-cancel-btn" data-request-id="' + escapeHtml(r.id) + '">Request Cancellation</button>' : '') +
                (r.receiptNumber ? '<a class="receipt-link-btn" href="transactions.html?receipt=' + encodeURIComponent(r.receiptNumber) + '">View Receipt</a>' : '') +
                '</div></div>';
        }).join('');
    }

    function vehicleHistoryCard(transaction, role) {
        // Render transaction history defensively. Older localStorage records may
        // contain missing or unexpected values, so never let one record crash
        // the whole Transactions page.
        try {
            const t = transaction && typeof transaction === "object" ? transaction : {};
            const isPurchase = role === "purchase";
            const statusText = isPurchase ? "PURCHASED" : "SOLD";
            const counterpartLabel = isPurchase ? "Seller" : "Buyer";

            function safeText(value, fallback) {
                if (value === null || value === undefined || value === "") return fallback || "";
                try { return String(value); } catch (e) { return fallback || ""; }
            }

            const sellerName = safeText(t.sellerName, "");
            const sellerEmail = safeText(t.sellerEmail, "");
            const buyerName = safeText(t.buyerName, "");
            const buyerEmail = safeText(t.buyerEmail, "");
            const counterpart = isPurchase
                ? (sellerName || sellerEmail || "Seller")
                : (buyerName || buyerEmail || "Buyer");

            const rawImage = safeText(t.image, "").trim();
            const image = rawImage || "image/mustang.jpg";
            const vehicleName = safeText(t.vehicle, "Vehicle") || "Vehicle";
            const receiptRaw = safeText(t.receiptNumber, "");
            const receiptNumber = receiptRaw || "Receipt unavailable";
            let detailsHtml = "";

            function addDetail(label, value, suffix) {
                const text = safeText(value, "").trim();
                if (!text) return;
                detailsHtml += "<span><b>" + escapeHtml(label) + ":</b> " + escapeHtml(text) + (suffix || "") + "</span>";
            }

            addDetail("Year", t.year);
            const mileageText = safeText(t.mileage, "").trim();
            if (mileageText) addDetail("Mileage", mileageText, /\\bkm\\b/i.test(mileageText) ? "" : " km");
            addDetail("Condition", t.condition);
            // category/type from older transaction records is optional. Convert it
            // to plain text before rendering instead of passing the raw value.
            addDetail("Type", safeText(t.category || t.type, ""));
            addDetail("Details", t.meta);

            if (Array.isArray(t.specs)) {
                for (let i = 0; i < t.specs.length && i < 3; i += 1) {
                    const specText = safeText(t.specs[i], "").trim();
                    if (specText) detailsHtml += "<span>" + escapeHtml(specText) + "</span>";
                }
            }

            let completedDate = "Date unavailable";
            const completedAt = safeText(t.completedAt, "");
            if (completedAt) {
                const parsedDate = new Date(completedAt);
                if (!Number.isNaN(parsedDate.getTime())) completedDate = parsedDate.toLocaleString("en-PH");
            }

            const receiptHref = receiptRaw
                ? "transactions.html?receipt=" + encodeURIComponent(receiptRaw)
                : "transactions.html";

            let amountText = "₱0";
            try { amountText = safeText(formatPeso(t.amount), "₱0"); } catch (e) { amountText = safeText(t.amount, "₱0"); }

            return '<article class="owned-vehicle-card">' +
                '<div class="owned-vehicle-image-wrap"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(vehicleName) + '" onerror="this.onerror=null;this.src=\'image/mustang.jpg\';"><span class="owned-status ' + (isPurchase ? 'purchased' : 'sold') + '">' + statusText + '</span></div>' +
                '<div class="owned-vehicle-info"><h3>' + escapeHtml(vehicleName) + '</h3>' +
                '<div class="owned-price">' + escapeHtml(amountText) + '</div>' +
                (detailsHtml ? '<div class="owned-detail-list">' + detailsHtml + '</div>' : '<p class="owned-muted">Vehicle details recorded at the time of transaction.</p>') +
                (safeText(t.description, "") ? '<p class="owned-description">' + escapeHtml(safeText(t.description, "")) + '</p>' : '') +
                '<div class="owned-transaction-meta"><span><b>' + counterpartLabel + ':</b> ' + escapeHtml(counterpart) + '</span><span><b>Date:</b> ' + escapeHtml(completedDate) + '</span><span><b>Receipt:</b> ' + escapeHtml(receiptNumber) + '</span></div>' +
                '<a class="receipt-link-btn" href="' + escapeHtml(receiptHref) + '">View Receipt</a></div></article>';
        } catch (error) {
            console.error("AUTOPRIME: skipped a malformed transaction record", error, transaction);
            return '<article class="owned-vehicle-card"><div class="owned-vehicle-info"><h3>Transaction record unavailable</h3><p class="owned-muted">This older transaction could not be displayed. Other transactions are still available.</p></div></article>';
        }
    }

    function renderPurchasedAndSoldVehicles(transactions, email) {
        const purchaseContainer = document.getElementById("purchasedVehicles");
        const soldContainer = document.getElementById("soldVehicles");
        if (!purchaseContainer && !soldContainer) return;
        const purchases = transactions.filter(function (t) { return String(t.buyerEmail || "").toLowerCase() === email; });
        const sold = transactions.filter(function (t) { return String(t.sellerEmail || "").toLowerCase() === email; });
        if (purchaseContainer) {
            purchaseContainer.innerHTML = purchases.length
                ? purchases.map(function (t) { return vehicleHistoryCard(t, "purchase"); }).join("")
                : '<div class="no-listings"><h3>No purchased cars yet</h3><p>Cars you buy will appear here with their price and transaction details.</p></div>';
        }
        if (soldContainer) {
            soldContainer.innerHTML = sold.length
                ? sold.map(function (t) { return vehicleHistoryCard(t, "sale"); }).join("")
                : '<div class="no-listings"><h3>No sold cars yet</h3><p>When you complete a sale, the vehicle will appear here marked SOLD.</p></div>';
        }
    }

    function manualSoldVehicleCard(item) {
        item = item && typeof item === "object" ? item : {};
        const vehicleName = [item.brand, item.model].filter(Boolean).join(" ") || item.name || "Vehicle";
        const image = item.image || "image/mustang.jpg";
        const price = item.price || "Price not specified";
        let soldDate = "Date unavailable";
        if (item.soldAt) {
            const date = new Date(item.soldAt);
            if (!Number.isNaN(date.getTime())) soldDate = date.toLocaleString();
        }
        const details = [item.year, item.category || item.type, item.mileage ? String(item.mileage) + (String(item.mileage).toLowerCase().includes("km") ? "" : " km") : ""]
            .filter(Boolean)
            .map(function (value) { return '<span>' + escapeHtml(value) + '</span>'; })
            .join("");

        return '<article class="owned-vehicle-card">' +
            '<div class="owned-vehicle-image-wrap"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(vehicleName) + '" onerror="this.onerror=null;this.src=\'image/mustang.jpg\';"><span class="owned-status sold">SOLD</span></div>' +
            '<div class="owned-vehicle-info">' +
                '<h3>' + escapeHtml(vehicleName) + '</h3>' +
                '<div class="owned-price">' + escapeHtml(price) + '</div>' +
                '<div class="owned-detail-list">' + details + '</div>' +
                '<p class="owned-description">' + escapeHtml(item.description || "Marked sold by seller.") + '</p>' +
                '<div class="owned-transaction-meta"><span><strong>Status:</strong> SOLD</span><span><strong>Marked sold:</strong> ' + escapeHtml(soldDate) + '</span><span><strong>Sale type:</strong> Seller marked as sold</span></div>' +
            '</div>' +
        '</article>';
    }

    function renderSellerSoldVehicles() {
        const container = document.getElementById("sellerSoldVehicles");
        if (!container) return;
        const user = currentUser();
        if (!user || !user.email) {
            container.innerHTML = '<div class="no-listings"><h3>Log in to view sold vehicles</h3><p>Your completed vehicle sales will only be visible while you are signed in.</p></div>';
            return;
        }
        const email = user.email.toLowerCase();
        const soldTransactions = readJSON(TRANSACTIONS_KEY, []).filter(function (t) {
            return String(t.sellerEmail || "").toLowerCase() === email;
        });
        const manuallySold = readJSON("autoprimeManualSoldListings", []).filter(function (item) {
            return String(item.sellerEmail || item.soldBy || "").toLowerCase() === email;
        });
        const cards = soldTransactions.map(function (t) { return vehicleHistoryCard(t, "sale"); })
            .concat(manuallySold.map(manualSoldVehicleCard));
        container.innerHTML = cards.length
            ? cards.join("")
            : '<div class="no-listings"><h3>No sold cars yet</h3><p>Accept a buyer request or use Mark as Sold on one of your active listings.</p></div>';
    }

    function renderTransactionsPage() {
        const container = document.getElementById("transactionReceipts");
        if (!container) return;
        const privateContent = document.getElementById("transactionsPrivateContent");
        const loginGate = document.getElementById("transactionsLoginGate");
        const user = currentUser();
        if (!user || !user.email) {
            if (privateContent) privateContent.hidden = true;
            if (loginGate) {
                loginGate.hidden = false;
                const b = document.getElementById("receiptLoginButton");
                if (b) b.onclick = function () { openAuth("login"); };
            }
            container.innerHTML = "";
            const purchased = document.getElementById("purchasedVehicles");
            const sold = document.getElementById("soldVehicles");
            if (purchased) purchased.innerHTML = "";
            if (sold) sold.innerHTML = "";
            return;
        }
        if (loginGate) loginGate.hidden = true;
        if (privateContent) privateContent.hidden = false;
        const email = user.email.toLowerCase();
        const transactions = readJSON(TRANSACTIONS_KEY, []).filter(function (t) {
            return String(t.buyerEmail || "").toLowerCase() === email || String(t.sellerEmail || "").toLowerCase() === email;
        });
        renderPurchasedAndSoldVehicles(transactions, email);
        const params = new URLSearchParams(location.search);
        const targetReceipt = params.get("receipt");
        if (!transactions.length) {
            container.innerHTML = '<div class="no-listings"><h3>No completed transactions yet</h3><p>Your receipts will appear here after you buy a vehicle or accept a buyer\'s purchase request.</p></div>';
            return;
        }
        container.innerHTML = transactions.map(function (record) {
            try {
                const t = record && typeof record === "object" ? record : {};
                const buyerEmail = String(t.buyerEmail || "").toLowerCase();
                const role = buyerEmail === email ? "Purchase Receipt" : "Sales Receipt";
                const receiptNumber = String(t.receiptNumber || "Receipt unavailable");
                const highlight = targetReceipt && targetReceipt === t.receiptNumber ? " receipt-highlight" : "";
                let amount = "₱0";
                try { amount = formatPeso(t.amount); } catch (e) { amount = String(t.amount || "₱0"); }
                let completed = "Date unavailable";
                if (t.completedAt) {
                    const date = new Date(t.completedAt);
                    if (!Number.isNaN(date.getTime())) completed = date.toLocaleString("en-PH");
                }
                return '<article class="receipt-card' + highlight + '" data-receipt-number="' + escapeHtml(receiptNumber) + '">' +
                    '<div class="receipt-top"><div><span class="receipt-kicker">AUTOPRIME TRANSACTION</span><h2>' + escapeHtml(role) + '</h2></div><span class="receipt-status completed">COMPLETED</span></div>' +
                    '<div class="receipt-number"><span>Receipt No.</span><strong>' + escapeHtml(receiptNumber) + '</strong></div>' +
                    '<div class="receipt-details">' +
                    '<div><span>Vehicle</span><strong>' + escapeHtml(t.vehicle || "Vehicle") + '</strong></div>' +
                    '<div><span>Amount</span><strong>' + escapeHtml(amount) + '</strong></div>' +
                    '<div><span>Buyer</span><strong>' + escapeHtml(t.buyerName || "Buyer") + '</strong><small>' + escapeHtml(t.buyerEmail || "") + '</small></div>' +
                    '<div><span>Seller</span><strong>' + escapeHtml(t.sellerName || "Seller") + '</strong><small>' + escapeHtml(t.sellerEmail || "") + '</small></div>' +
                    '<div><span>Date & Time</span><strong>' + escapeHtml(completed) + '</strong></div>' +
                    '<div><span>Status</span><strong>Paid / Sale Completed</strong></div>' +
                    '</div>' +
                    '<div class="receipt-actions"><button type="button" class="print-receipt-btn" data-receipt-id="' + escapeHtml(t.id || "") + '">Print Receipt</button></div>' +
                    '<p class="receipt-note">This receipt is generated by the AUTOPRIME demo marketplace and is stored locally in this browser.</p>' +
                    '</article>';
            } catch (error) {
                console.error("AUTOPRIME: skipped a malformed receipt record", error, record);
                return "";
            }
        }).join("");
        if (targetReceipt) setTimeout(function () {
            const target = container.querySelector('.receipt-card[data-receipt-number="' + CSS.escape(targetReceipt) + '"]');
            if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }

    function printReceipt(transactionId) {
        const user = currentUser();
        if (!user) return;
        const transaction = readJSON(TRANSACTIONS_KEY, []).find(function (t) { return String(t.id) === String(transactionId); });
        if (!transaction) return;
        const email = user.email.toLowerCase();
        if (String(transaction.buyerEmail).toLowerCase() !== email && String(transaction.sellerEmail).toLowerCase() !== email) return;
        const popup = window.open("", "_blank", "width=760,height=820");
        if (!popup) { showToast("Allow pop-ups to print the receipt."); return; }
        popup.document.write('<!doctype html><html><head><title>' + escapeHtml(transaction.receiptNumber) + '</title><style>body{font-family:Arial,sans-serif;padding:42px;color:#111820}.brand{font-size:28px;font-weight:900}.brand span{color:#f5a800}.box{border:1px solid #d9dde1;padding:26px;margin-top:24px}.row{display:flex;justify-content:space-between;gap:30px;border-bottom:1px solid #eceff1;padding:12px 0}.row span{color:#68717a}.amount{font-size:24px}.note{font-size:12px;color:#777;margin-top:22px}@media print{button{display:none}}</style></head><body>' +
            '<div class="brand">AUTO<span>PRIME</span></div><h1>Transaction Receipt</h1><div class="box">' +
            '<div class="row"><span>Receipt No.</span><strong>' + escapeHtml(transaction.receiptNumber) + '</strong></div>' +
            '<div class="row"><span>Vehicle</span><strong>' + escapeHtml(transaction.vehicle) + '</strong></div>' +
            '<div class="row amount"><span>Amount</span><strong>' + escapeHtml(formatPeso(transaction.amount)) + '</strong></div>' +
            '<div class="row"><span>Buyer</span><strong>' + escapeHtml(transaction.buyerName) + ' — ' + escapeHtml(transaction.buyerEmail) + '</strong></div>' +
            '<div class="row"><span>Seller</span><strong>' + escapeHtml(transaction.sellerName) + ' — ' + escapeHtml(transaction.sellerEmail) + '</strong></div>' +
            '<div class="row"><span>Date & Time</span><strong>' + escapeHtml(new Date(transaction.completedAt).toLocaleString("en-PH")) + '</strong></div>' +
            '<div class="row"><span>Status</span><strong>COMPLETED</strong></div></div>' +
            '<p class="note">AUTOPRIME demo receipt. This browser-only project does not process real money or constitute an official legal sales document.</p><button onclick="window.print()">Print</button></body></html>');
        popup.document.close();
        popup.focus();
    }

    function updateAccountNav() {
        const nav = document.querySelector("header nav");
        if (!nav) return;
        let transactionsLink = nav.querySelector(".transactions-nav-link");
        const signedInUser = currentUser();
        if (signedInUser && !transactionsLink) {
            transactionsLink = document.createElement("a");
            transactionsLink.href = "transactions.html";
            transactionsLink.className = "transactions-nav-link";
            transactionsLink.textContent = "Transactions";
            const aboutLink = nav.querySelector('a[href="index.html#about"], a[href="#about"]');
            if (aboutLink) nav.insertBefore(transactionsLink, aboutLink);
            else nav.appendChild(transactionsLink);
        } else if (!signedInUser && transactionsLink) {
            transactionsLink.remove();
            transactionsLink = null;
        }
        let control = nav.querySelector(".account-control");
        if (!control) {
            control = document.createElement("button");
            control.type = "button";
            control.className = "account-control";
            nav.appendChild(control);
        }
        const user = currentUser();
        if (user) {
            const firstName = (user.name || "Account").split(/\s+/)[0];
            control.textContent = firstName + " · Logout";
            control.title = "Logged in as " + user.email;
            control.onclick = logout;
        } else {
            control.textContent = "Log In / Sign Up";
            control.title = "Create an account or log in";
            control.onclick = function () { openAuth("login"); };
        }
        updateNotificationNav();
        document.dispatchEvent(new CustomEvent("autoprime:auth-changed"));
    }

    function lockSellPage() {
        const form = document.getElementById("sellForm");
        if (!form || isLoggedIn()) return;
        form.classList.add("auth-locked");
        form.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
        let lock = document.querySelector(".sell-auth-lock");
        if (!lock) {
            lock = document.createElement("div");
            lock.className = "sell-auth-lock";
            lock.innerHTML = `
                <div class="lock-icon">🔒</div>
                <h3>Account required to sell</h3>
                <p>Create an AUTOPRIME account or log in before submitting a vehicle listing.</p>
                <button type="button" class="auth-submit sell-login-button">Log In / Create Account</button>`;
            form.parentNode.insertBefore(lock, form);
            lock.querySelector("button").addEventListener("click", function () { openAuth("login", "sell"); });
        }
    }

    function unlockSellPage() {
        const form = document.getElementById("sellForm");
        if (!form || !isLoggedIn()) return;
        form.classList.remove("auth-locked");
        form.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = false; });
        const lock = document.querySelector(".sell-auth-lock");
        if (lock) lock.remove();
    }

    function showToast(message) {
        let toast = document.querySelector(".autoprime-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "autoprime-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () { toast.classList.remove("show"); }, 3200);
    }

    document.addEventListener("click", function (event) {
        const sellLink = event.target.closest('a[href="sell.html"]');
        if (sellLink && !isLoggedIn()) {
            event.preventDefault();
            requireAuth("sell");
            return;
        }

        const buyButton = event.target.closest(".buy-vehicle-action");
        if (buyButton) {
            const title = buyButton.dataset.vehicleTitle || "Vehicle";
            let specs = [];
            try { specs = JSON.parse(buyButton.dataset.vehicleSpecs || "[]"); } catch (e) {}
            const details = {
                vehicleTitle: title,
                listingId: buyButton.dataset.listingId || "",
                sellerEmail: buyButton.dataset.sellerEmail || "",
                price: buyButton.dataset.vehiclePrice || "",
                vehicleDetails: {
                    image: buyButton.dataset.vehicleImage || "",
                    category: buyButton.dataset.vehicleType || "",
                    meta: buyButton.dataset.vehicleMeta || "",
                    year: buyButton.dataset.vehicleYear || "",
                    mileage: buyButton.dataset.vehicleMileage || "",
                    condition: buyButton.dataset.vehicleCondition || "",
                    description: buyButton.dataset.vehicleDescription || "",
                    specs: specs
                }
            };
            if (!isLoggedIn()) {
                pendingBuy = details;
                requireAuth("buy:" + title);
                return;
            }
            createPurchaseRequest(details.vehicleTitle, details.listingId, details.sellerEmail, details.price, details.vehicleDetails || {});
            return;
        }

        const acceptButton = event.target.closest(".accept-sale-btn");
        if (acceptButton) { acceptPurchaseRequest(acceptButton.dataset.requestId); return; }
        const declineButton = event.target.closest(".decline-sale-btn");
        if (declineButton) { declinePurchaseRequest(declineButton.dataset.requestId); return; }
        const cancelRequestButton = event.target.closest(".request-cancel-btn");
        if (cancelRequestButton) { requestCancellation(cancelRequestButton.dataset.requestId); return; }
        const approveCancelButton = event.target.closest(".approve-cancel-btn");
        if (approveCancelButton) { approveCancellation(approveCancelButton.dataset.requestId); return; }
        const declineCancelButton = event.target.closest(".decline-cancel-btn");
        if (declineCancelButton) { declineCancellation(declineCancelButton.dataset.requestId); return; }
        const viewIdButton = event.target.closest(".view-id-btn");
        if (viewIdButton) { openIdViewer(viewIdButton.dataset.requestId, viewIdButton.dataset.side); return; }
        const printButton = event.target.closest(".print-receipt-btn");
        if (printButton) { printReceipt(printButton.dataset.receiptId); return; }

        const removeButton = event.target.closest(".remove-my-listing");
        if (removeButton) {
            removeListing(removeButton.dataset.listingId);
        }
    });

    document.addEventListener("submit", function (event) {
        if (event.target && event.target.id === "sellForm" && !isLoggedIn()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            requireAuth("sell");
        }
    }, true);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && document.querySelector(".auth-modal.show")) closeAuth();
    });

    /* ---------- Pop-up notifications (used for new chat messages) ---------- */
    function ensurePopupStack() {
        let stack = document.querySelector(".autoprime-popup-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.className = "autoprime-popup-stack";
            stack.setAttribute("aria-live", "polite");
            document.body.appendChild(stack);
        }
        return stack;
    }

    function showPopup(options) {
        options = options || {};
        const stack = ensurePopupStack();
        const popup = document.createElement("div");
        popup.className = "autoprime-popup";
        popup.setAttribute("role", "status");
        popup.innerHTML =
            '<div class="autoprime-popup-icon">' + escapeHtml(options.icon || "🔔") + '</div>' +
            '<div class="autoprime-popup-body">' +
                '<strong>' + escapeHtml(options.title || "Notification") + '</strong>' +
                (options.meta ? '<small>' + escapeHtml(options.meta) + '</small>' : '') +
                (options.text ? '<p>' + escapeHtml(options.text) + '</p>' : '') +
                (options.actionLabel ? '<button type="button" class="autoprime-popup-action">' + escapeHtml(options.actionLabel) + '</button>' : '') +
            '</div>' +
            '<button type="button" class="autoprime-popup-close" aria-label="Dismiss">&times;</button>';

        let timer = null;
        function dismiss() {
            clearTimeout(timer);
            popup.classList.remove("in");
            setTimeout(function () { popup.remove(); }, 250);
        }
        function arm(ms) { clearTimeout(timer); timer = setTimeout(dismiss, ms); }

        popup.querySelector(".autoprime-popup-close").addEventListener("click", dismiss);
        const action = popup.querySelector(".autoprime-popup-action");
        if (action) action.addEventListener("click", function () {
            dismiss();
            if (typeof options.onAction === "function") options.onAction();
        });
        popup.addEventListener("mouseenter", function () { clearTimeout(timer); });
        popup.addEventListener("mouseleave", function () { arm(3500); });

        stack.prepend(popup);
        while (stack.children.length > 3) stack.lastElementChild.remove();
        requestAnimationFrame(function () { popup.classList.add("in"); });
        arm(options.duration || 9000);
        return popup;
    }

    // Keep the bell badge in sync when another tab adds a notification.
    window.addEventListener("storage", function (event) {
        if (event.key === NOTIFICATIONS_KEY) {
            updateNotificationNav();
            if (document.querySelector(".notifications-panel.show")) renderNotificationsPanel();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        if (document.querySelector(".id-viewer")) { closeIdViewer(); return; }
        if (document.querySelector(".id-modal.show")) closeIdModal();
    });

    window.AutoPrimeId = { open: openIdModal };
    window.AutoPrimeAuth = {
        addNotification: addNotification,
        showPopup: showPopup,
        open: openAuth,
        logout: logout,
        currentUser: currentUser,
        isLoggedIn: isLoggedIn,
        requireAuth: requireAuth,
        renderSellerSoldVehicles: renderSellerSoldVehicles,
        renderBuyerPurchaseRequests: renderBuyerPurchaseRequests,
        renderNotificationsPanel: renderNotificationsPanel
    };

    document.addEventListener("DOMContentLoaded", function () {
        purgeStaleIds();
        ensureAuthModal();
        updateAccountNav();
        if (isLoggedIn()) unlockSellPage(); else lockSellPage();
        renderSellerPurchaseRequests();
        renderBuyerPurchaseRequests();
        renderSellerSoldVehicles();
        renderTransactionsPage();
        updateNotificationNav();
    });
})();



/* ================= SAVED SEARCHES, BUYER/SELLER CHAT & CHAT POP-UPS =================
   Front-end demonstration features. Messages and saved searches use this browser's
   localStorage; a production marketplace needs a server and a real-time messaging
   service (WebSocket / push) so people on different devices are notified instantly. */
(function () {
    "use strict";
    const SAVED_KEY = "autoprimeSavedSearches";
    const MESSAGE_KEY = "autoprimeMessages";
    const SHOWN_KEY = "autoprimeShownChatPopups"; // sessionStorage: chat pop-ups already shown in this tab
    const SAVED_LIMIT = 12;
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch (_) { return fallback; } };
    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const currentUser = () => { try { return JSON.parse(localStorage.getItem("autoprimeSession") || "null"); } catch (_) { return null; } };
    const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
    const lc = value => String(value || "").toLowerCase();
    const userKey = () => lc(currentUser()?.email || "guest");
    const preview = (text, max) => { const t = String(text || "").replace(/\s+/g, " ").trim(); return t.length > max ? t.slice(0, max - 1) + "…" : t; };

    /* ---------- Saved searches: saved automatically, per customer ---------- */
    function listSaved() { return read(SAVED_KEY, {})[userKey()] || []; }

    function addSaved(rawQuery) {
        const query = String(rawQuery || "").replace(/\s+/g, " ").trim();
        if (query.length < 2) return;
        const all = read(SAVED_KEY, {});
        let items = all[userKey()] || [];
        const lower = query.toLowerCase();
        // While someone is still typing ("toy" -> "toyota"), replace the half-typed entry instead of stacking it.
        const last = items[0];
        if (last && lower !== last.query.toLowerCase() && lower.startsWith(last.query.toLowerCase()) &&
            Date.now() - new Date(last.savedAt).getTime() < 15000) items.shift();
        items = items.filter(x => x.query.toLowerCase() !== lower);
        items.unshift({ id: Date.now(), query, savedAt: new Date().toISOString() });
        all[userKey()] = items.slice(0, SAVED_LIMIT);
        try { write(SAVED_KEY, all); } catch (_) {}
        renderSavedSearches();
    }

    function removeSaved(id) {
        const all = read(SAVED_KEY, {});
        all[userKey()] = (all[userKey()] || []).filter(x => String(x.id) !== String(id));
        try { write(SAVED_KEY, all); } catch (_) {}
        renderSavedSearches();
    }

    function clearSaved() {
        const all = read(SAVED_KEY, {});
        all[userKey()] = [];
        try { write(SAVED_KEY, all); } catch (_) {}
        renderSavedSearches();
    }

    window.AutoPrimeSavedSearches = { list: listSaved, add: addSaved, remove: removeSaved, clear: clearSaved };

    function renderSavedSearches() {
        const box = document.getElementById("savedSearchesList");
        if (!box) return;
        const items = listSaved();
        if (!items.length) { box.innerHTML = '<p class="saved-search-empty">Your searches are saved here automatically. Search for a vehicle above to get started.</p>'; return; }
        box.innerHTML = items.map(item => `<div class="saved-search-item"><div><strong>${safe(item.query)}</strong><small>Saved ${new Date(item.savedAt).toLocaleDateString()}</small></div><div><button type="button" data-open-saved="${safe(item.id)}">Search</button> <button type="button" data-remove-saved="${safe(item.id)}" aria-label="Remove saved search">×</button></div></div>`).join("");
        box.querySelectorAll("[data-open-saved]").forEach(btn => btn.addEventListener("click", () => {
            const item = items.find(x => String(x.id) === btn.dataset.openSaved); if (!item) return;
            const category = /suv/i.test(item.query) ? "suv" : /pickup|truck/i.test(item.query) ? "pickup" : "sedan";
            location.href = window.AutoPrimeSearch?.resolveUrl(item.query) || (category + ".html?search=" + encodeURIComponent(item.query) + "#vehicles");
        }));
        box.querySelectorAll("[data-remove-saved]").forEach(btn => btn.addEventListener("click", () => removeSaved(btn.dataset.removeSaved)));
    }

    /* ---------- Buyer <-> seller chat ---------- */
    const newId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

    function ensureMessageModal() {
        if (document.querySelector(".autoprime-message-modal")) return;
        const modal = document.createElement("div");
        modal.className = "autoprime-message-modal";
        modal.innerHTML = `<section class="message-modal-card" role="dialog" aria-modal="true" aria-label="Messages"><div class="message-modal-head"><h2>Messages</h2><button type="button" class="message-modal-close" aria-label="Close">&times;</button></div><p class="message-recipient"></p><div class="message-thread"></div><form class="message-compose"><textarea required maxlength="1000" placeholder="Write your message..."></textarea><button type="submit">Send</button></form><p class="message-note">Demo messaging: conversations are stored only in this browser. A production site needs a secure server and real-time messaging service.</p></section>`;
        document.body.appendChild(modal);
        modal.querySelector(".message-modal-close").addEventListener("click", () => modal.classList.remove("show"));
        modal.addEventListener("click", e => { if(e.target===modal) modal.classList.remove("show"); });
        modal.querySelector("form").addEventListener("submit", e => {
            e.preventDefault();
            const user=currentUser(); if(!user){ alert("Please log in before sending a message."); window.AutoPrimeAuth?.open("login"); return; }
            const recipient=modal.dataset.recipient || "";
            const textValue=modal.querySelector("textarea").value.trim(); if(!textValue) return;
            if(!recipient){ alert("This listing does not have a seller email yet."); return; }
            const message={id:newId(), from:user.email, fromName:user.name || "", to:recipient, vehicle:modal.dataset.vehicle || "Vehicle", text:textValue, sentAt:new Date().toISOString(), read:false};
            try {
                const messages=read(MESSAGE_KEY,[]);
                messages.push(message);
                write(MESSAGE_KEY,messages);
            } catch (_) { alert("Your message could not be saved because this browser's storage is full."); return; }
            notifyRecipient(message);
            modal.querySelector("textarea").value=""; renderThread(modal,recipient); renderSellerInbox();
        });
    }

    // Puts the message in the receiver's notification bell (their pop-up appears when they are online).
    function notifyRecipient(message) {
        const auth = window.AutoPrimeAuth;
        if (!auth || typeof auth.addNotification !== "function") return;
        auth.addNotification(
            message.to,
            "New message from " + (message.fromName || message.from) + " about " + message.vehicle + ": " + preview(message.text, 70),
            "message",
            "index.html?chat=" + encodeURIComponent(message.from) + "&vehicle=" + encodeURIComponent(message.vehicle)
        );
    }

    function renderThread(modal, recipient) {
        const user=currentUser(); const email=lc(user?.email);
        const messages=read(MESSAGE_KEY,[]).filter(m =>
            (lc(m.from)===email && lc(m.to)===lc(recipient)) ||
            (lc(m.to)===email && lc(m.from)===lc(recipient))
        );
        const thread=modal.querySelector(".message-thread");
        thread.innerHTML=messages.length ? messages.map(m=>`<div class="message-bubble ${lc(m.from)===email?"mine":""}">${safe(m.text)}<small>${safe(m.fromName || m.from)} · ${new Date(m.sentAt).toLocaleString()}</small></div>`).join("") : '<p class="message-note">No messages yet. Start the conversation.</p>';
        thread.scrollTop=thread.scrollHeight;
    }

    function markThreadRead(peer) {
        const me = lc(currentUser()?.email); if (!me) return false;
        const all = read(MESSAGE_KEY, []); let changed = false;
        all.forEach(m => { if (m.read === false && lc(m.to) === me && lc(m.from) === lc(peer)) { m.read = true; changed = true; } });
        if (changed) { try { write(MESSAGE_KEY, all); } catch (_) {} }
        return changed;
    }

    function openMessaging(recipient, vehicle) {
        if(!recipient){ alert("Seller contact details are not available for this listing."); return; }
        if(!currentUser()){ window.AutoPrimeAuth?.open("login"); alert("Please log in to send a message."); return; }
        if(lc(recipient)===lc(currentUser().email)){ alert("You cannot message your own listing."); return; }
        ensureMessageModal();
        const modal=document.querySelector(".autoprime-message-modal");
        modal.dataset.recipient=recipient; modal.dataset.vehicle=vehicle || "Vehicle";
        modal.querySelector(".message-recipient").textContent="Conversation about " + (vehicle||"this vehicle") + " · " + recipient;
        markThreadRead(recipient);
        renderThread(modal,recipient); modal.classList.add("show");
        renderSellerInbox();
    }
    window.AutoPrimeMessaging = { open: openMessaging };

    function setupMessagingButtons() {
        document.addEventListener("click", e => {
            const messageButton=e.target.closest(".message-seller-action");
            if(messageButton) openMessaging(messageButton.dataset.sellerEmail,messageButton.dataset.vehicleTitle);
        });
        // Also make messaging available from seller dashboard cards where contact data exists.
        document.querySelectorAll(".seller-listing-card").forEach(card => {
            const id=card.dataset.listingId;
            const listing=(read("autoprimeListings",[])||[]).find(x=>String(x.id)===String(id));
            if(!listing || !listing.sellerEmail) return;
            const btn=document.createElement("button"); btn.type="button"; btn.className="message-action-button"; btn.textContent="Open Messages";
            btn.addEventListener("click",()=>openMessaging(listing.sellerEmail,[listing.brand,listing.model].join(" ")));
            card.querySelector(".listing-actions")?.appendChild(btn);
        });
    }

    function setupSellerInbox() {
        const host = document.getElementById("purchaseRequests");
        if (!host || document.getElementById("sellerMessageInbox")) return;
        const section = document.createElement("section");
        section.className = "my-listings-section";
        section.id = "sellerMessageInbox";
        section.innerHTML = '<div class="my-listings-header"><p class="small-title">BUYER & SELLER CHAT</p><h2>Messages Inbox</h2><p>Open conversations with buyers who have contacted you.</p></div><div id="sellerInboxList" class="saved-search-list"></div>';
        host.insertAdjacentElement("afterend", section);
        renderSellerInbox();
    }
    function renderSellerInbox() {
        const box = document.getElementById("sellerInboxList");
        if (!box) return;
        const user = currentUser();
        if (!user) { box.innerHTML = '<p class="saved-search-empty">Log in to view your conversations.</p>'; return; }
        const email = lc(user.email);
        const messages = read(MESSAGE_KEY, []).filter(m => lc(m.to) === email || lc(m.from) === email);
        const peers = [...new Set(messages.map(m => lc(m.from) === email ? lc(m.to) : lc(m.from)))];
        if (!peers.length) { box.innerHTML = '<p class="saved-search-empty">No buyer messages yet. Messages from interested buyers will appear here.</p>'; return; }
        box.innerHTML = peers.map(peer => {
            const thread = messages.filter(m => lc(m.from) === peer || lc(m.to) === peer);
            const latest = thread.slice().sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt))[0];
            const unread = thread.filter(m => m.read === false && lc(m.to) === email).length;
            return `<div class="saved-search-item"><div><strong>${safe(peer)}${unread ? ` <span class="chat-unread-badge">${unread} new</span>` : ""}</strong><small>${safe(latest?.vehicle || "Vehicle conversation")}</small></div><button type="button" data-open-peer="${safe(peer)}">Open Chat</button></div>`;
        }).join("");
        box.querySelectorAll("[data-open-peer]").forEach(btn => btn.addEventListener("click", () => {
            const peer = btn.dataset.openPeer;
            const latest = messages.filter(m => lc(m.from) === peer || lc(m.to) === peer).sort((a,b)=>new Date(b.sentAt)-new Date(a.sentAt))[0];
            openMessaging(peer, latest?.vehicle || "Vehicle");
        }));
    }

    /* ---------- Pop-up when a new chat message arrives ---------- */
    function shownIds() { try { return new Set(JSON.parse(sessionStorage.getItem(SHOWN_KEY) || "[]").map(String)); } catch (_) { return new Set(); } }
    function rememberShown(set) { try { sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...set].slice(-300))); } catch (_) {} }

    function chatIsOpenWith(peer) {
        const modal = document.querySelector(".autoprime-message-modal");
        return !!(modal && modal.classList.contains("show") && lc(modal.dataset.recipient) === lc(peer));
    }

    function showChatPopups(list) {
        const auth = window.AutoPrimeAuth;
        if (!auth || typeof auth.showPopup !== "function" || !list.length) return;
        const groups = new Map();
        list.slice().sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)).forEach(m => {
            const key = lc(m.from) + "|" + m.vehicle;
            const g = groups.get(key) || { from: m.from, name: m.fromName || m.from, vehicle: m.vehicle, count: 0, last: m };
            g.count += 1; g.last = m; groups.set(key, g);
        });
        const all = [...groups.values()];
        all.slice(0, 3).forEach(g => auth.showPopup({
            icon: "💬",
            title: g.count > 1 ? g.count + " new messages from " + g.name : "New message from " + g.name,
            meta: g.vehicle,
            text: preview(g.last.text, 90),
            actionLabel: "Reply",
            onAction: () => openMessaging(g.from, g.vehicle)
        }));
        if (all.length > 3) auth.showPopup({ icon: "💬", title: (all.length - 3) + " more conversations have new messages", text: "Open Notifications to see them." });
    }

    function checkIncoming() {
        const user = currentUser(); if (!user) return;
        const me = lc(user.email);
        const unread = read(MESSAGE_KEY, []).filter(m => m.read === false && lc(m.to) === me);
        if (!unread.length) return;
        const shown = shownIds();
        const fresh = unread.filter(m => !shown.has(String(m.id)));
        if (!fresh.length) return;
        fresh.forEach(m => shown.add(String(m.id)));
        rememberShown(shown);

        // If that conversation is already open on screen, just update it instead of popping up.
        const modal = document.querySelector(".autoprime-message-modal");
        const livePeers = new Set(fresh.filter(m => chatIsOpenWith(m.from)).map(m => lc(m.from)));
        livePeers.forEach(peer => { markThreadRead(peer); renderThread(modal, modal.dataset.recipient); });
        renderSellerInbox();
        showChatPopups(fresh.filter(m => !livePeers.has(lc(m.from))));
    }

    function startIncomingWatcher() {
        setTimeout(checkIncoming, 600);
        setInterval(checkIncoming, 3000);
        window.addEventListener("storage", e => { if (e.key === MESSAGE_KEY) { checkIncoming(); renderSellerInbox(); } });
        document.addEventListener("visibilitychange", () => { if (!document.hidden) checkIncoming(); });
        // After someone logs in (or out) show what is waiting for them.
        document.addEventListener("autoprime:auth-changed", () => { renderSellerInbox(); renderSavedSearches(); setTimeout(checkIncoming, 400); });
    }

    // Notification links look like index.html?chat=<email>&vehicle=<name> and open that conversation.
    function handleChatLink() {
        const params = new URLSearchParams(location.search);
        const peer = params.get("chat");
        if (!peer) return;
        const vehicle = params.get("vehicle") || "Vehicle";
        params.delete("chat"); params.delete("vehicle");
        const query = params.toString();
        try { history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash); } catch (_) {}
        if (!currentUser()) { window.AutoPrimeAuth?.open("login"); return; }
        openMessaging(peer, vehicle);
    }

    document.addEventListener("DOMContentLoaded",()=>{
        renderSavedSearches();
        setupMessagingButtons();
        setupSellerInbox();
        startIncomingWatcher();
        handleChatLink();
        // Re-render saved searches after account nav is initialized.
        setTimeout(renderSavedSearches,250);
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelector(".autoprime-message-modal")?.classList.remove("show");});
})();
