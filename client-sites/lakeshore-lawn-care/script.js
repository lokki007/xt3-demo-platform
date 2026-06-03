const header = document.querySelector("[data-header]");
const form = document.querySelector("[data-quote-form]");
const note = document.querySelector("[data-form-note]");

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
    const town = String(data.get("town") || "").trim();
    const service = String(data.get("service") || "").trim();
    const notes = String(data.get("notes") || "").trim();

    const body = encodeURIComponent(
      [
        "Hi Matthew, I would like a LakeShore Lawn Care quote.",
        "",
        `Name: ${name}`,
        `Town: ${town}`,
        `Service: ${service}`,
        "",
        "Yard notes:",
        notes || "I will send photos next."
      ].join("\n")
    );

    const message = decodeURIComponent(body);
    if (note) {
      note.textContent = `Text 616-307-4305 with: ${message}`;
    }

    const canUseSms = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (canUseSms) {
      window.location.href = `sms:+16163074305?body=${body}`;
    }
  });
}
