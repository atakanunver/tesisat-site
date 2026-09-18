function buildWhatsappUrl(phoneE164, utmSource, messages) {
  const key = (utmSource || "").toLowerCase();
  const text = messages[key] || messages.default;
  return "https://wa.me/" + phoneE164 + "?text=" + encodeURIComponent(text);
}

function buildAppointmentMessage(fields) {
  const lines = [
    "Merhaba, internet sitesinden randevu talebim var.",
    "Ad Soyad: " + fields.name,
    "Telefon: " + fields.phone,
    "İl: " + fields.il,
    "İlçe: " + fields.ilce,
    "Hizmet: " + fields.service,
  ];
  if (fields.note) lines.push("Not: " + fields.note);
  return lines.join("\n");
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

  var form = document.getElementById("randevu-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var message = buildAppointmentMessage({
        name: data.get("name") || "",
        phone: data.get("phone") || "",
        il: data.get("il") || "",
        ilce: data.get("ilce") || "",
        service: data.get("service") || "",
        note: data.get("note") || "",
      });
      window.open(
        "https://wa.me/" + config.phone + "?text=" + encodeURIComponent(message),
        "_blank"
      );
    });
  }
})();

if (typeof module !== "undefined") {
  module.exports = {
    buildWhatsappUrl: buildWhatsappUrl,
    buildAppointmentMessage: buildAppointmentMessage,
  };
}
