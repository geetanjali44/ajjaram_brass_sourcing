/* Full website search for Ajjaram Brass Sourcing
   Shows image + name + category only. Price is NOT shown in the dropdown.
   Products show only after typing.
*/

(function(){

    const PRODUCT_PAGE = "product.html";

    function injectSearchStyle(){
        if(document.getElementById("globalSearchStyle")) return;

        const style = document.createElement("style");
        style.id = "globalSearchStyle";

        style.textContent = `
            .global-search-box{
                display:none;
                position:fixed !important;
                top:78px !important;
                right:18px !important;
                width:340px !important;
                max-width:calc(100vw - 30px) !important;
                background:#ffffff !important;
                padding:12px !important;
                border-radius:14px !important;
                box-shadow:0 8px 25px rgba(0,0,0,.25) !important;
                z-index:99999 !important;
                box-sizing:border-box !important;
            }

            .global-search-box input{
                width:100% !important;
                height:40px !important;
                padding:0 12px !important;
                border:1px solid #ddd !important;
                border-radius:10px !important;
                outline:none !important;
                box-sizing:border-box !important;
                font-size:14px !important;
                margin-bottom:10px !important;
            }

            .global-search-results,
            .search-results{
                position:static !important;
                width:100% !important;
                max-height:420px !important;
                overflow-y:auto !important;
                background:#fff !important;
                border-radius:10px !important;
                box-shadow:none !important;
                display:none !important;
                z-index:99999 !important;
            }

            .global-search-results.show-results,
            .search-results.show-results{
                display:block !important;
            }

            .global-search-item{
                display:flex !important;
                align-items:center !important;
                gap:10px !important;
                padding:9px 6px !important;
                border-bottom:1px solid #eeeeee !important;
                cursor:pointer !important;
                background:#fff !important;
            }

            .global-search-item:hover{
                background:#fff8d7 !important;
            }

            .global-search-item img{
                width:48px !important;
                height:48px !important;
                min-width:48px !important;
                object-fit:cover !important;
                border-radius:8px !important;
                background:#f3f3f3 !important;
            }

            .global-search-info h4{
                margin:0 !important;
                font-size:13px !important;
                line-height:1.25 !important;
                color:#222 !important;
                font-weight:700 !important;
            }

            .global-search-info span{
                display:block !important;
                margin-top:3px !important;
                font-size:11px !important;
                color:#8b5e3c !important;
                font-weight:600 !important;
            }

            .global-search-empty{
                padding:12px !important;
                text-align:center !important;
                color:#777 !important;
                font-size:13px !important;
            }

            @media(max-width:600px){
                .global-search-box{
                    left:10px !important;
                    right:10px !important;
                    top:72px !important;
                    width:auto !important;
                    max-width:none !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function escapeHtml(value){
        return String(value || "")
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");
    }

    function getOverlay(){
        let overlay = document.getElementById("overlay");

        if(!overlay){
            overlay = document.createElement("div");
            overlay.id = "overlay";
            document.body.appendChild(overlay);
        }

        return overlay;
    }

    function prepareSearchBox(){
        injectSearchStyle();

        document.querySelectorAll('[id="searchResults"]').forEach((el, index) => {
            if(index > 0){
                el.id = "oldSearchResults" + index;
            }
        });

        let box = document.getElementById("searchBox") || document.getElementById("searchDropdown");

        if(!box){
            box = document.createElement("div");
            document.body.appendChild(box);
        }

        box.id = "searchBox";
        box.classList.add("global-search-box");

        box.innerHTML = `
            <input 
                type="text" 
                id="searchInput" 
                placeholder="Search all products..."
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
            >
            <div id="searchResults" class="search-results global-search-results"></div>
        `;

        const input = box.querySelector("#searchInput");

        input.addEventListener("input", () => {
            renderSearchResults(input.value);
        });

        input.addEventListener("keydown", (e) => {
            if(e.key === "Escape"){
                closeSearch();
            }
        });

        return box;
    }

    function productUrl(product){
        const params = new URLSearchParams();

        params.set("name", product.name || "");
        params.set("price", product.price || "");
        params.set("old", product.old || "");
        params.set("img", product.img || "");
        params.set("category", product.categoryKey || product.category || "");

        return PRODUCT_PAGE + "?" + params.toString();
    }

    function renderSearchResults(query){
        const box = document.getElementById("searchBox") || prepareSearchBox();
        const resultBox = box.querySelector("#searchResults");

        const value = String(query || "").toLowerCase().trim();
        const products = Array.isArray(window.ALL_PRODUCTS) ? window.ALL_PRODUCTS : [];

        if(value === ""){
            resultBox.innerHTML = "";
            resultBox.classList.remove("show-results");
            return;
        }

        const filtered = products.filter(p =>
            String(p.name || "").toLowerCase().includes(value) ||
            String(p.category || "").toLowerCase().includes(value) ||
            String(p.categoryKey || "").toLowerCase().includes(value)
        );

        resultBox.classList.add("show-results");

        if(!filtered.length){
            resultBox.innerHTML = `<div class="global-search-empty">No products found</div>`;
            return;
        }

        resultBox.innerHTML = filtered.map((p, index) => `
            <div class="global-search-item" data-index="${index}">
                <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}">
                <div class="global-search-info">
                    <h4>${escapeHtml(p.name)}</h4>
                    <span>${escapeHtml(p.category || "Product")}</span>
                </div>
            </div>
        `).join("");

        resultBox.querySelectorAll(".global-search-item").forEach((item, index) => {
            item.addEventListener("click", () => {
                const selected = filtered[index];
                closeSearch(false);
                window.location.href = productUrl(selected);
            });
        });
    }

    function openSearch(){
        const box = prepareSearchBox();
        const overlay = getOverlay();

        box.style.display = "block";
        overlay.classList.add("active");

        const input = box.querySelector("#searchInput");
        input.value = "";

        const resultBox = box.querySelector("#searchResults");

        if(resultBox){
            resultBox.innerHTML = "";
            resultBox.classList.remove("show-results");
        }

        setTimeout(() => {
            input.focus();
        }, 30);
    }

    function closeSearch(removeOverlay = true){
        const box = document.getElementById("searchBox");

        if(box){
            box.style.display = "none";
        }

        if(removeOverlay){
            const overlay = document.getElementById("overlay");

            if(overlay){
                overlay.classList.remove("active");
            }
        }
    }

    window.toggleSearch = function(){
        const box = document.getElementById("searchBox") || prepareSearchBox();

        if(box.style.display === "block"){
            closeSearch();
        }else{
            openSearch();
        }
    };

    window.doSearch = function(){
        const input = document.getElementById("searchInput");
        renderSearchResults(input ? input.value : "");
    };

    window.goProduct = function(name, price, img, category, oldPrice){
        const products = Array.isArray(window.ALL_PRODUCTS) ? window.ALL_PRODUCTS : [];

        const match = products.find(p =>
            String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
        );

        const finalProduct = {
            name: name || (match && match.name) || "",
            price: price || (match && match.price) || "",
            old: oldPrice || (match && match.old) || "",
            img: img || (match && match.img) || "",
            categoryKey: category || (match && match.categoryKey) || "",
            category: (match && match.category) || category || ""
        };

        window.location.href = productUrl(finalProduct);
    };

    function bindSearchIcons(){
        document.querySelectorAll(".fa-search").forEach(icon => {
            const clickable = icon.closest("a, .icon") || icon;

            if(clickable.dataset.globalSearchBound === "yes") return;

            clickable.dataset.globalSearchBound = "yes";

            clickable.addEventListener("click", function(e){
                e.preventDefault();
                e.stopImmediatePropagation();
                openSearch();
            }, true);
        });
    }

    function patchProductPage(){
        if(!/product\.html/i.test(location.pathname)) return;

        const params = new URLSearchParams(location.search);

        const name = params.get("name") || "";
        const img = params.get("img") || "";
        const price = params.get("price") || "";
        const old = params.get("old") || "";
        const category = params.get("category") || "";

        const dataMatch = (window.ALL_PRODUCTS || []).find(p =>
            String(p.name || "").toLowerCase() === String(name || "").toLowerCase()
        );

        const finalImg = img || (dataMatch && dataMatch.img) || "";
        const finalPrice = price || (dataMatch && dataMatch.price) || "";
        const finalOld = old || (dataMatch && dataMatch.old) || "";

        const imgEl = document.getElementById("img");
        const nameEl = document.getElementById("name");
        const priceEl = document.getElementById("price");
        const descEl = document.getElementById("desc");

        if(imgEl && finalImg){
            imgEl.src = finalImg;
        }

        if(nameEl && name){
            nameEl.innerText = name;
        }

        if(priceEl){
            priceEl.innerHTML = finalPrice
                ? `₹${finalPrice}${finalOld ? ` <span class="old-price">₹${finalOld}</span>` : ""}`
                : "";
        }

        if(descEl && name){
            descEl.innerText =
                name + " is a premium quality brass product for " + (category || "your home") + ".";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        prepareSearchBox();
        bindSearchIcons();
        patchProductPage();

        const overlay = document.getElementById("overlay");

        if(overlay){
            overlay.addEventListener("click", () => closeSearch(), true);
        }
    });

})();