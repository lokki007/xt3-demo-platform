const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-contact-form]");
const note = document.querySelector("[data-form-note]");
const reveals = document.querySelectorAll(".reveal");
const mobileCta = document.querySelector(".mobile-cta");

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
  if (mobileCta) {
    mobileCta.classList.toggle("is-visible", window.scrollY > 320);
  }
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add("is-visible"));
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const interest = String(data.get("interest") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent(`Studio inquiry from ${name || "website"}`);
    const body = encodeURIComponent(
      [
        "New inquiry for Alexys Nevitt Voice Studio LLC",
        "",
        `Name: ${name}`,
        `Phone or email: ${contact}`,
        `Interest: ${interest}`,
        "",
        "Message:",
        message || "No message added.",
        "",
        "Sent from the website contact form."
      ].join("\n")
    );

    window.location.href = `mailto:alexysrace@gmail.com?subject=${subject}&body=${body}`;

    if (note) {
      note.textContent = "Your email app should open now. Send the email there to finish.";
    }
  });
}
