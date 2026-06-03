const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-quote-form]");
const note = document.querySelector("[data-form-note]");
const avatarImages = document.querySelectorAll("[data-avatar-img]");

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const address = String(data.get("address") || "").trim();
    const service = String(data.get("service") || "").trim();
    const notes = String(data.get("notes") || "").trim();

    const subject = encodeURIComponent(`Quote request from ${name || "website"}`);
    const body = encodeURIComponent(
      [
        "New quote request for Pure Pressure Power Washing",
        "",
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Service address: ${address}`,
        `Service needed: ${service}`,
        "",
        "Notes:",
        notes || "No notes added.",
        "",
        "Photos can be attached before sending this email."
      ].join("\n")
    );

    window.location.href = `mailto:purepressure148@gmail.com?subject=${subject}&body=${body}`;
    if (note) {
      note.textContent = "Your email app should open now. Attach photos there before sending.";
    }
  });
}

avatarImages.forEach((image) => {
  image.addEventListener("error", () => {
    image.classList.add("is-hidden");
  });
});
