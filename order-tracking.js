const orderSteps = [
    "Order Placed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered"
];

let orders = JSON.parse(localStorage.getItem("ajjaramOrders")) || [];
let ratings = JSON.parse(localStorage.getItem("ajjaramRatings")) || {};
let reviews = JSON.parse(localStorage.getItem("ajjaramReviews")) || {};

const params = new URLSearchParams(window.location.search);
const urlOrderId = params.get("orderId");

let currentFilter = "all";

const ordersList = document.getElementById("ordersList");
const orderSearch = document.getElementById("orderSearch");

function getStatusText(order){
    return orderSteps[order.statusIndex] || "Order Placed";
}

function getDisplayDate(order){
    if(order.statusIndex >= 4){
        return "Delivered on " + (order.deliveryDate || "");
    }

    if(getStatusText(order) === "Cancelled"){
        return "Cancelled";
    }

    return getStatusText(order) + " • " + (order.placedDate || "");
}

function renderStars(orderId, small = true){
    const rating = ratings[orderId] || 0;
    let html = "";

    for(let i = 1; i <= 5; i++){
        html += `<i class="fa-solid fa-star ${i <= rating ? "active" : ""}" onclick="rateProduct(event,'${orderId}',${i})"></i>`;
    }

    return html;
}

function renderOrders(){
    ordersList.innerHTML = "";

    let searchValue = orderSearch.value.toLowerCase();

    let filteredOrders = [...orders].reverse().filter(order => {
        const name = String(order.productName || "").toLowerCase();
        const payment = String(order.paymentMethod || "").toLowerCase();
        const status = getStatusText(order).toLowerCase();

        const searchMatch =
            name.includes(searchValue) ||
            payment.includes(searchValue) ||
            String(order.id || "").toLowerCase().includes(searchValue);

        let filterMatch = true;

        if(currentFilter === "upi"){
            filterMatch = payment.includes("upi");
        }

        if(currentFilter === "cod"){
            filterMatch = payment.includes("cash") || payment.includes("cod");
        }

        if(currentFilter === "delivered"){
            filterMatch = status.includes("delivered");
        }

        return searchMatch && filterMatch;
    });

    if(filteredOrders.length === 0){
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fa-solid fa-box-open"></i>
                <h3>No orders found</h3>
                <p>Your placed products will show here.</p>
                <a href="index.html">Shop Now</a>
            </div>
        `;
        return;
    }

    filteredOrders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-row";

        div.innerHTML = `
            <img src="${order.image || 'images/slide.webp'}" alt="Product">

            <div class="order-row-info">
                <div class="order-row-top">
                    <div>
                        <h3>${getDisplayDate(order)}</h3>
                        <p>${order.productName || "Product"}</p>
                    </div>

                    <div class="order-arrow">
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>

                <div class="rating-row">
                    ${renderStars(order.id)}
                </div>

                <p class="review-text">Write a Review</p>
            </div>
        `;

        div.addEventListener("click", () => {
            openOrderDetails(order.id);
        });

        ordersList.appendChild(div);
    });
}

function openOrderDetails(orderId){
    const order = orders.find(item => item.id === orderId);

    if(!order) return;

    document.getElementById("ordersPage").style.display = "none";
    document.getElementById("detailsPage").style.display = "block";

    const rating = ratings[orderId] || 0;

    document.getElementById("orderDetailsContent").innerHTML = `
        <div class="details-product">
            <img src="${order.image || 'images/slide.webp'}" alt="Product">

            <div>
                <h2>${order.productName || "Product"}</h2>
                <p>Qty: ${order.qty || 1} • Payment: ${order.paymentMethod || "COD"}</p>
                <p>${order.price || ""}</p>
            </div>
        </div>

        <div class="order-number">
            Order #${order.id}
            <i class="fa-regular fa-copy copy-icon" onclick="copyOrderId('${order.id}')"></i>
        </div>

        <div class="status-card">
            <div class="status-main">
                <h2>${getDisplayDate(order)}</h2>

                <div class="big-check">
                    <i class="fa-solid fa-check"></i>
                </div>
            </div>

            <p class="return-text">
                <i class="fa-solid fa-circle-info"></i>
                Return policy ended after delivery
            </p>

            <hr>

            <button class="see-updates-btn" onclick="toggleUpdates()">
                See all updates
            </button>
        </div>

        <div class="tracking-timeline" id="trackingTimeline">
            <div class="timeline">
                ${renderTimeline(order)}
            </div>
        </div>

        <h2 class="promise-title">Ajjaram's promise</h2>

        <div class="promise-card">
            <i class="fa-solid fa-shield-heart"></i>
            <h3>Secure brass product delivery</h3>
        </div>

        <h2 class="rate-title">Rate your experience</h2>

        <div class="rate-card">
            <h3>
                <i class="fa-regular fa-square-check"></i>
                Write a product review
            </h3>

            <div class="rate-box">
                <span class="rate-label">${rating === 0 ? "Rate" : "Rated"}</span>

                <div class="stars">
                    ${renderStars(order.id, false)}
                </div>

                <button class="write-review-btn" onclick="writeReview(event,'${order.id}')">
                    <i class="fa-solid fa-pen"></i>
                    Write review
                </button>
            </div>
        </div>

        <div class="order-banner details-bottom-banner">
            <div>
                <h2>Premium Brass Care</h2>
                <p>Thank you for shopping</p>
                <button>Ajjaram Brass</button>
            </div>

            <i class="fa-solid fa-truck-fast"></i>
        </div>
    `;

    window.scrollTo(0,0);
}

function renderTimeline(order){
    let html = "";

    orderSteps.forEach((step, index) => {
        const done = index <= order.statusIndex ? "done" : "";

        html += `
            <div class="track-step ${done}">
                <div class="track-dot">
                    <i class="fa-solid fa-check"></i>
                </div>

                <h4>${step}</h4>
                <p>${index <= order.statusIndex ? "Completed" : "Pending"}</p>
            </div>
        `;
    });

    return html;
}

function toggleUpdates(){
    document.getElementById("trackingTimeline").classList.toggle("active");
}

function goBackToOrders(){
    document.getElementById("detailsPage").style.display = "none";
    document.getElementById("ordersPage").style.display = "block";
    renderOrders();
    window.scrollTo(0,0);
}

function closeTracking(){
    goBackToOrders();
}

function rateProduct(event, orderId, rating){
    event.stopPropagation();

    ratings[orderId] = rating;
    localStorage.setItem("ajjaramRatings", JSON.stringify(ratings));

    const detailsVisible = document.getElementById("detailsPage").style.display === "block";

    if(detailsVisible){
        openOrderDetails(orderId);
    }else{
        renderOrders();
    }
}

function writeReview(event, orderId){
    event.stopPropagation();

    const oldReview = reviews[orderId] || "";
    const text = prompt("Write your product review:", oldReview);

    if(text === null) return;

    reviews[orderId] = text;
    localStorage.setItem("ajjaramReviews", JSON.stringify(reviews));

    alert("Review saved successfully");
}

function copyOrderId(orderId){
    navigator.clipboard.writeText(orderId);
    alert("Order ID copied");
}

/* FILTER BUTTONS */
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function(){
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");

        currentFilter = this.getAttribute("data-filter");
        renderOrders();
    });
});

/* SEARCH */
orderSearch.addEventListener("input", renderOrders);

/* INIT */
renderOrders();

if(urlOrderId){
    setTimeout(() => {
        openOrderDetails(urlOrderId);
    }, 300);
}