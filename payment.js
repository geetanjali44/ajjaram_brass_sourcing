const params = new URLSearchParams(window.location.search);

const product = {
    name: params.get("name") || "Brass Product",
    price: params.get("price") || "0",
    old: params.get("old") || "",
    img: params.get("img") || ""
};

const productPrice = cleanPrice(product.price);
const oldPrice = cleanPrice(product.old);

let selectedPayment = "upi";
const loginMobile = localStorage.getItem("ajjaramUserMobile") || "guest";
const addressKey = "ajjaramDeliveryAddress_" + loginMobile;

let savedAddress = JSON.parse(localStorage.getItem(addressKey)) || null;

/* LOAD PRODUCT */
const productImg = document.getElementById("productImg");

if(product.img){
    productImg.src = product.img;
}else{
    productImg.src = "images/slide.webp"; // fallback image
}

document.getElementById("productName").innerText = product.name;
document.getElementById("productPrice").innerText = formatPrice(productPrice);

if(oldPrice > 0){
    document.getElementById("productOld").innerText = formatPrice(oldPrice);
}else{
    document.getElementById("productOld").style.display = "none";
}

/* DELIVERY ADDRESS */
function renderAddressBox(){
    const savedAddressBox = document.getElementById("savedAddressBox");
    const addressForm = document.getElementById("addressForm");

    if(!savedAddressBox || !addressForm) return;

    if(savedAddress){
        savedAddressBox.innerHTML = `
            <h4>${savedAddress.name}</h4>
            <p>${savedAddress.mobile}</p>
            <p>${savedAddress.house}, ${savedAddress.city} - ${savedAddress.pincode}</p>
        `;

        addressForm.classList.remove("active");
    }else{
        savedAddressBox.innerHTML = `
            <div class="no-address">
                No delivery address saved. Add your address once.
            </div>
        `;

        addressForm.classList.add("active");
    }
}

function openAddressForm(){
    document.getElementById("addressFormTitle").innerText =
        savedAddress ? "Edit Delivery Address" : "Add Delivery Address";

    document.getElementById("addrName").value = savedAddress ? savedAddress.name : "";
    document.getElementById("addrMobile").value = savedAddress ? savedAddress.mobile : "";
    document.getElementById("addrHouse").value = savedAddress ? savedAddress.house : "";
    document.getElementById("addrCity").value = savedAddress ? savedAddress.city : "";
    document.getElementById("addrPincode").value = savedAddress ? savedAddress.pincode : "";

    document.getElementById("addressForm").classList.add("active");
}

function saveAddress(){
    const name = document.getElementById("addrName").value.trim();
    const mobile = document.getElementById("addrMobile").value.trim();
    const house = document.getElementById("addrHouse").value.trim();
    const city = document.getElementById("addrCity").value.trim();
    const pincode = document.getElementById("addrPincode").value.trim();

    if(name === ""){
        showError("Enter full name");
        return;
    }

    if(mobile.length !== 10 || isNaN(mobile)){
        showError("Enter valid 10 digit mobile number");
        return;
    }

    if(house === ""){
        showError("Enter complete address");
        return;
    }

    if(city === ""){
        showError("Enter city");
        return;
    }

    if(pincode.length !== 6 || isNaN(pincode)){
        showError("Enter valid 6 digit pincode");
        return;
    }

    savedAddress = {
        name: name,
        mobile: mobile,
        house: house,
        city: city,
        pincode: pincode
    };

    localStorage.setItem(addressKey, JSON.stringify(savedAddress));

    document.getElementById("addressForm").classList.remove("active");
    renderAddressBox();
    showSuccess("Address saved successfully");
}

function deleteAddress(){
    if(!savedAddress){
        showError("No address to delete");
        return;
    }

    if(!confirm("Delete this delivery address?")) return;

    savedAddress = null;
    localStorage.removeItem(addressKey);

    renderAddressBox();
    showSuccess("Address deleted");
}

/* PAYMENT METHOD CLICK */
document.querySelectorAll(".payment-option").forEach(option => {
    option.addEventListener("click", function(){
        const input = this.querySelector("input");
        input.checked = true;

        selectedPayment = input.value;

        updatePaymentUI();
        updatePriceSummary();
    });
});

function updatePaymentUI(){
    document.querySelectorAll(".payment-option").forEach(option => {
        option.classList.remove("active");

        const input = option.querySelector("input");

        if(input.value === selectedPayment){
            option.classList.add("active");
        }
    });

    document.getElementById("upiBox").classList.remove("active");
    document.getElementById("cardBox").classList.remove("active");
    document.getElementById("codBox").classList.remove("active");

    if(selectedPayment === "upi"){
        document.getElementById("upiBox").classList.add("active");
        document.getElementById("paymentNote").innerText = "UPI has free delivery";
    }

    if(selectedPayment === "card"){
        document.getElementById("cardBox").classList.add("active");
        document.getElementById("paymentNote").innerText = "Card payment has free delivery";
    }

    if(selectedPayment === "cod"){
        document.getElementById("codBox").classList.add("active");
        document.getElementById("paymentNote").innerText = "COD adds ₹50 shipping";
    }
}

/* PRICE SUMMARY */
function updatePriceSummary(){
    let shipping = 0;

    if(selectedPayment === "cod"){
        shipping = 50;
    }

    const total = productPrice + shipping;

    document.getElementById("summaryPrice").innerText = formatPrice(productPrice);

    if(shipping === 0){
        document.getElementById("shippingCharge").innerText = "FREE";
        document.getElementById("shippingCharge").style.color = "#007600";
    }else{
        document.getElementById("shippingCharge").innerText = formatPrice(shipping);
        document.getElementById("shippingCharge").style.color = "#b12704";
    }

    document.getElementById("totalAmount").innerText = formatPrice(total);
    document.getElementById("mobileTotal").innerText = formatPrice(total);

    if(oldPrice > productPrice){
        const saving = oldPrice - productPrice;
        document.getElementById("saveText").innerText =
            "You save " + formatPrice(saving) + " on this order";
    }else{
        document.getElementById("saveText").innerText = "";
    }
}

/* CONFIRM ORDER */
function confirmOrder(){
    if(!savedAddress){
        showError("Add delivery address");
        openAddressForm();
        return;
    }

    if(selectedPayment === "upi"){
        const upiId = document.getElementById("upiId").value.trim();

        if(upiId === ""){
            showError("Enter UPI ID");
            return;
        }

        processUpiPayment(savedAddress);
        return;
    }

    if(selectedPayment === "card"){
        const cardNumber = document.getElementById("cardNumber").value.trim();
        const expiry = document.getElementById("expiry").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        if(cardNumber.length !== 16 || isNaN(cardNumber)){
            showError("Enter valid 16 digit card number");
            return;
        }

        if(expiry === ""){
            showError("Enter card expiry");
            return;
        }

        if(cvv.length !== 3 || isNaN(cvv)){
            showError("Enter valid CVV");
            return;
        }

        processCardPayment(savedAddress);
        return;
    }

    if(selectedPayment === "cod"){
        createOrder(savedAddress);
    }
}

function processUpiPayment(addressData){
    showSuccess("Processing UPI payment...");

    setTimeout(() => {
        showSuccess("UPI payment successful. Placing order...");

        setTimeout(() => {
            createOrder(addressData);
        }, 800);

    }, 1800);
}

function processCardPayment(addressData){
    showSuccess("Processing card payment...");

    setTimeout(() => {
        showSuccess("Card payment successful. Placing order...");

        setTimeout(() => {
            createOrder(addressData);
        }, 800);

    }, 1800);
}

function createOrder(addressData){
    const orderId = "ABS" + Date.now().toString().slice(-6);

    const today = new Date();
    const delivery = new Date();
    delivery.setDate(today.getDate() + 4);

    const shipping = selectedPayment === "cod" ? 50 : 0;
    const total = productPrice + shipping;

    const order = {
        id: orderId,
        statusIndex: 0,
        placedDate: formatDate(today),
        deliveryDate: formatDate(delivery),

        productName: product.name,
        price: formatPrice(total),
        itemPrice: formatPrice(productPrice),
        old: product.old,
        qty: 1,
        image: product.img || "images/slide.webp",

        paymentMethod: getPaymentName(),
        shippingCharge: shipping,
        totalAmount: total,

        customerName: addressData.name,
        mobile: addressData.mobile,
        address:
            addressData.name + ", " +
            addressData.mobile + ", " +
            addressData.house + ", " +
            addressData.city + ", Pincode: " +
            addressData.pincode
    };

    let orders = JSON.parse(localStorage.getItem("ajjaramOrders")) || [];
    orders.push(order);

    localStorage.setItem("ajjaramOrders", JSON.stringify(orders));
    localStorage.setItem("lastOrderId", orderId);

    window.location.href = "order-placed.html?orderId=" + orderId;
}

/* HELPERS */
function cleanPrice(value){
    return Number(String(value).replace(/[^\d.]/g, "")) || 0;
}

function formatPrice(amount){
    return "₹" + Number(amount).toLocaleString("en-IN");
}

function formatDate(date){
    return date.toLocaleDateString("en-IN", {
        day:"2-digit",
        month:"long",
        year:"numeric"
    });
}

function getPaymentName(){
    if(selectedPayment === "upi") return "UPI";
    if(selectedPayment === "card") return "Debit / Credit Card";
    if(selectedPayment === "cod") return "Cash on Delivery";
    return "UPI";
}

function showError(message){
    const errorMsg = document.getElementById("errorMsg");

    if(errorMsg){
        errorMsg.style.color = "#b91c1c";
        errorMsg.innerText = message;
    }else{
        alert(message);
    }
}

function showSuccess(message){
    const errorMsg = document.getElementById("errorMsg");

    if(errorMsg){
        errorMsg.style.color = "#007600";
        errorMsg.innerText = message;
    }else{
        alert(message);
    }
}

/* ONLY NUMBERS */
document.getElementById("addrMobile").addEventListener("input", function(){
    this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("addrPincode").addEventListener("input", function(){
    this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("cardNumber").addEventListener("input", function(){
    this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("cvv").addEventListener("input", function(){
    this.value = this.value.replace(/[^0-9]/g, "");
});

/* INIT */
renderAddressBox();
updatePaymentUI();
updatePriceSummary();