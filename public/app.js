/* ZEOX dashboard shell — verify overlay + custom dropdowns.
 * The obfuscator engine is Coming Soon; heavy client logic was removed. */

document.addEventListener("DOMContentLoaded", () => {
  /* ============ Verify overlay (visual only) ============ */
  const verifyOverlay = document.getElementById("verify-overlay");
  const verifyBtn     = document.getElementById("verify-btn");
  const verifySpinner = document.getElementById("verify-spinner");
  const verifySub     = document.getElementById("verify-sub");
  const verifyRayId   = document.getElementById("verify-rayid");

  if (verifyRayId) {
    verifyRayId.innerText = Array.from({ length: 16 }, () =>
      "0123456789ABCDEF"[Math.floor(Math.random() * 16)]
    ).join("");
  }

  let verified = false;
  verifyBtn?.addEventListener("click", () => {
    if (verified || verifyBtn.disabled) return;
    verifyBtn.disabled = true;
    verifySpinner?.classList.remove("hidden");
    if (verifySub) verifySub.innerText = "Checking your browser...";

    setTimeout(() => {
      verified = true;
      verifySpinner?.classList.add("hidden");
      verifyBtn.classList.add("is-verified");
      verifyBtn.setAttribute("aria-pressed", "true");
      if (verifySub) verifySub.innerText = "Success! You are verified.";
      setTimeout(() => verifyOverlay?.classList.add("verify-hidden"), 500);
    }, 1200);
  });

  /* ============ Custom dropdowns (kept for reuse) ============ */
  function initDropdown(root) {
    const targetId    = root.dataset.target;
    const hidden      = targetId ? document.getElementById(targetId) : null;
    const trigger     = root.querySelector(".zdrop-trigger");
    const triggerText = root.querySelector(".zdrop-trigger-text");
    const menu        = root.querySelector(".zdrop-menu");
    const options     = Array.from(root.querySelectorAll(".zdrop-option"));
    if (!trigger || !menu) return;

    const close = () => {
      root.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    };
    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      menu.style.left  = `${rect.left}px`;
      menu.style.width = `${rect.width}px`;
      menu.style.top   = `${rect.bottom + 6}px`;
    };
    const open = () => {
      document.querySelectorAll(".zdrop.is-open").forEach(d => { if (d !== root) d.classList.remove("is-open"); });
      positionMenu();
      root.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    };

    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      root.classList.contains("is-open") ? close() : open();
    });

    options.forEach(opt => {
      opt.addEventListener("click", () => {
        options.forEach(o => o.classList.remove("is-active"));
        opt.classList.add("is-active");
        if (triggerText) triggerText.innerText = opt.querySelector(".zdrop-option-main")?.innerText || "";
        if (hidden) {
          hidden.value = opt.dataset.value;
          hidden.dispatchEvent(new Event("change"));
        }
        close();
      });
    });

    document.addEventListener("click", (e) => { if (!root.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.addEventListener("scroll", () => { if (root.classList.contains("is-open")) close(); }, true);
    window.addEventListener("resize", () => { if (root.classList.contains("is-open")) close(); });
  }
  document.querySelectorAll(".zdrop").forEach(initDropdown);
});
