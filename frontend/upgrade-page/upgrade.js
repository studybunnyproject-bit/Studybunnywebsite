function payWithFlutterwave(amount, plan) {
  FlutterwaveCheckout({
    public_key: "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxx-X", // Replace with your test public key
    tx_ref: "tx_" + Date.now(),
    amount: amount,
    currency: "USD",
    payment_options: "card, mobilemoney, ussd",
    redirect_url: "", // no redirect, using callback
    customer: {
      email: "user@example.com", // can be dynamic
      phone_number: "08012345678",
      name: "Demo User",
    },
    callback: function (data) {
      console.log(data);
      if (data.status === "successful" || data.status === "completed") {
        localStorage.setItem("userPlan", plan);
        alert("Payment successful! You are now on the " + plan + " plan.");
        const lastPage = localStorage.getItem("lastPage") || "mainpage.html";
        window.location.href = lastPage;
      } else {
        alert("Payment was not successful.");
      }
    },
    customizations: {
      title: "Study App Upgrade",
      description: "Upgrade to " + plan + " plan",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Carrot_icon.svg/1024px-Carrot_icon.svg.png"
    },
  });
}