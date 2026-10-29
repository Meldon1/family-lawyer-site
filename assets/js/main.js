/* =========================================================
   Право семьи — interactions
   No dependencies. All contacts come from assets/js/config.js.
   ========================================================= */

(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  var telegramUrl = cfg.telegramUrl || "https://t.me/up_pravo";
  var phoneRaw = cfg.phoneRaw || "+79267734285";

  /* ---------------- Contacts and config ---------------- */

  $$("[data-site]").forEach(function (el) {
    var key = el.getAttribute("data-site");
    if (cfg[key]) el.textContent = cfg[key];
  });

  $$('[data-link="telegram"]').forEach(function (link) {
    link.href = telegramUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  $$('[data-link="phone"]').forEach(function (link) {
    link.href = "tel:" + phoneRaw.replace(/[^\d+]/g, "");
  });

  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------- Header state ---------------- */

  var header = $("#header");
  var mobileCta = $(".mobile-cta");

  var onScroll = function () {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (mobileCta) {
      var ctaVisible = window.scrollY > 420;
      mobileCta.classList.toggle("is-visible", ctaVisible);
      mobileCta.setAttribute("aria-hidden", String(!ctaVisible));
      mobileCta.toggleAttribute("inert", !ctaVisible);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Reveal on scroll ---------------- */

  var revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------- Active navigation ---------------- */

  var navLinks = $$(".nav a");
  var navSections = [];

  navLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    var section = id && id.charAt(0) === "#" ? $(id) : null;
    if (section) navSections.push({ link: link, section: section });
  });

  function updateActiveNav() {
    if (!navSections.length) return;
    var probe = window.scrollY + window.innerHeight * 0.38;
    var active = null;
    navSections.forEach(function (item) {
      if (item.section.offsetTop <= probe) active = item.link;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link === active);
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  window.addEventListener("resize", updateActiveNav);
  updateActiveNav();

  /* ---------------- Mobile menu ---------------- */

  var menu = $("#mobile-menu");
  var menuToggle = $(".menu-toggle");
  var menuIsOpen = false;

  function focusables(scope) {
    return $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      scope
    ).filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }

  function trapFocus(event, container, extraFirst) {
    if (event.key !== "Tab") return;
    var items = focusables(container);
    if (extraFirst) items.unshift(extraFirst);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setMenu(open) {
    if (!menu || !menuToggle) return;
    menuIsOpen = open;
    menu.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    menu.setAttribute("aria-hidden", String(!open));
    if (open) {
      menu.removeAttribute("inert");
      document.documentElement.classList.add("menu-open");
      header.classList.add("menu-open");
      ["main", ".footer", ".skip-link"].forEach(function (selector) {
        var el = $(selector);
        if (el) el.setAttribute("inert", "");
      });
      if (mobileCta) mobileCta.setAttribute("inert", "");
      var firstLink = menu.querySelector("a");
      if (firstLink) {
        window.setTimeout(function () {
          firstLink.focus({ preventScroll: true });
        }, 80);
      }
    } else {
      menu.setAttribute("inert", "");
      document.documentElement.classList.remove("menu-open");
      header.classList.remove("menu-open");
      ["main", ".footer", ".skip-link"].forEach(function (selector) {
        var el = $(selector);
        if (el) el.removeAttribute("inert");
      });
      if (mobileCta) {
        mobileCta.toggleAttribute("inert", !mobileCta.classList.contains("is-visible"));
      }
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(!menuIsOpen);
    });
  }

  if (menu) {
    $$("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!menuIsOpen) return;
    if (event.key === "Escape") {
      setMenu(false);
      if (menuToggle) menuToggle.focus();
    }
    if (menu) trapFocus(event, menu, menuToggle);
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (window.innerWidth >= 1024 && menuIsOpen) setMenu(false);
    }, 120);
  });

  /* ---------------- Lead modal ---------------- */

  var modal = $("#lead-modal");
  var modalPanel = modal ? $(".modal__panel", modal) : null;
  var formWrap = $("#lead-form-wrap");
  var successWrap = $("#lead-success");
  var form = $("#lead-form");
  var lastFocused = null;
  var modalIsOpen = false;
  var lastMessage = "";
  var modalBackground = ["#header", "main", ".footer", ".skip-link"]
    .map(function (selector) {
      return $(selector);
    })
    .filter(Boolean);

  function setBackgroundInert(inert) {
    modalBackground.forEach(function (el) {
      if (inert) {
        el.setAttribute("inert", "");
      } else {
        el.removeAttribute("inert");
      }
    });
  }

  function modalFocusables() {
    return modal ? focusables(modalPanel) : [];
  }

  function setModal(open) {
    if (!modal) return;
    modalIsOpen = open;

    if (open) {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("is-locked");
      setBackgroundInert(true);
      var closeButton = $(".modal__close", modal);
      if (closeButton) {
        window.setTimeout(function () {
          closeButton.focus({ preventScroll: true });
        }, 60);
      }
    } else {
      modal.hidden = true;
      document.body.classList.remove("is-locked");
      setBackgroundInert(false);
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    }
  }

  function resetModal() {
    if (!form) return;
    form.reset();
    form.classList.remove("was-validated");
    $$(".field", form).forEach(function (field) {
      field.classList.remove("is-invalid");
    });
    $$(".field__error", modal).forEach(function (error) {
      error.textContent = "";
    });
    $$('[aria-invalid="true"]', modal).forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });
    if (formWrap) formWrap.hidden = false;
    if (successWrap) successWrap.hidden = true;
    if (modal) modal.setAttribute("aria-labelledby", "lead-title");
    var topic = $("#lead-topic");
    if (topic) topic.value = "";
    var status = $("#copy-status");
    if (status) status.textContent = "";
    var previewWrap = $("#message-preview-wrap");
    if (previewWrap) previewWrap.open = false;
  }

  function openLead(topic) {
    if (!modal) return;
    resetModal();
    if (topic) {
      var select = $("#lead-topic");
      if (select) select.value = topic;
    }
    setModal(true);
  }

  function closeLead() {
    setModal(false);
  }

  $$("[data-open-lead]").forEach(function (button) {
    var topic = button.getAttribute("data-topic");
    if (topic && !button.getAttribute("aria-label")) {
      button.setAttribute(
        "aria-label",
        button.textContent.trim().replace(/\s+/g, " ") + ": " + topic
      );
    }
    button.addEventListener("click", function () {
      openLead(topic || "");
    });
  });

  if (modal) {
    $$("[data-close-modal]", modal).forEach(function (el) {
      el.addEventListener("click", closeLead);
    });

    document.addEventListener("keydown", function (event) {
      if (!modalIsOpen) return;
      if (event.key === "Escape") {
        closeLead();
      }
      if (event.key === "Tab") {
        trapFocus(event, modalPanel);
      }
    });
  }

  /* ---------------- Clipboard helpers ---------------- */

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return fallbackCopy(text);
        }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function setCopyStatus(copied) {
    var status = $("#copy-status");
    if (!status) return;
    status.textContent = copied
      ? "Текст скопирован в буфер обмена."
      : "Автоматически скопировать не удалось — откройте текст заявки ниже и скопируйте вручную.";
    if (!copied) {
      var previewWrap = $("#message-preview-wrap");
      if (previewWrap) previewWrap.open = true;
    }
  }

  if ($("#copy-again")) {
    $("#copy-again").addEventListener("click", function () {
      copyText(lastMessage).then(setCopyStatus);
    });
  }

  /* ---------------- Lead form ---------------- */

  function setFieldError(input, message) {
    if (!input) return;
    var field = input.closest(".field");
    var describedBy = input.getAttribute("aria-describedby");
    var error = document.getElementById(describedBy || input.id + "-error");
    if (field) field.classList.toggle("is-invalid", Boolean(message));
    if (error) error.textContent = message || "";
    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function validateForm() {
    var valid = true;
    var firstInvalid = null;

    var name = $("#lead-name");
    var contact = $("#lead-contact");
    var consent = $("#lead-consent");
    var consentError = $("#consent-error");

    if (!name || name.value.trim().length < 2) {
      setFieldError(name, "Укажите имя — хотя бы два символа.");
      valid = false;
      firstInvalid = firstInvalid || name;
    } else {
      setFieldError(name, "");
    }

    if (!contact || contact.value.trim().length < 5) {
      setFieldError(contact, "Оставьте телефон или ник в Telegram.");
      valid = false;
      firstInvalid = firstInvalid || contact;
    } else {
      setFieldError(contact, "");
    }

    if (consentError) {
      consentError.textContent = consent && consent.checked
        ? ""
        : "Без согласия на обработку данных заявку отправить нельзя.";
    }
    if (consent && !consent.checked) {
      consent.setAttribute("aria-invalid", "true");
      valid = false;
      firstInvalid = firstInvalid || consent;
    } else if (consent) {
      consent.removeAttribute("aria-invalid");
    }

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: false });
    }
    return valid;
  }

  if (form) {
    ["lead-name", "lead-contact"].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("input", function () {
        setFieldError(input, "");
      });
    });

    var consentInput = $("#lead-consent");
    if (consentInput) {
      consentInput.addEventListener("change", function () {
        var error = $("#consent-error");
        if (error) error.textContent = "";
        consentInput.removeAttribute("aria-invalid");
      });
    }

      

  /* ---------------- FAQ: one open at a time ---------------- */

  var faqItems = $$(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item && other.open) other.open = false;
      });
    });
  });
})();
