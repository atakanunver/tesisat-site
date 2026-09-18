function buildWhatsappUrl(phoneE164, utmSource, messages) {
  const key = (utmSource || "").toLowerCase();
  const text = messages[key] || messages.default;
  return "https://wa.me/" + phoneE164 + "?text=" + encodeURIComponent(text);
}

(function attachToDom() {
  if (typeof document === "undefined") return;

  var params = new URLSearchParams(window.location.search);
  var utmSource = params.get("utm_source");
  if (utmSource) {
    window.localStorage.setItem("gt_utm_source", utmSource);
  } else {
    utmSource = window.localStorage.getItem("gt_utm_source");
  }

  var config = window.__GT_WHATSAPP__;
  if (!config) return;

  var url = buildWhatsappUrl(config.phone, utmSource, config.messages);
  document.querySelectorAll("[data-whatsapp-cta]").forEach(function (el) {
    el.setAttribute("href", url);
  });
})();

if (typeof module !== "undefined") {
  module.exports = { buildWhatsappUrl: buildWhatsappUrl };
}
