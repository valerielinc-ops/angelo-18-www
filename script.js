const EVENT = {
  startsAt: new Date("2026-11-22T20:30:00+01:00"),
  endsAt: new Date("2026-11-23T01:30:00+01:00"),
  title: "Angelo 18 — Midnight Elegance",
  location: "LUHMA Beef & Sushi Bar, Via Stabia 6, 84012 Angri SA",
};

const intro = document.querySelector("#intro");
const enterButton = document.querySelector("#enter-party");
const soundtrack = document.querySelector("#soundtrack");
const musicToggle = document.querySelector("#music-toggle");
const musicLabel = musicToggle.querySelector(".music-toggle__label");
const header = document.querySelector("#site-header");
const heroImage = document.querySelector(".hero__image");
const toast = document.querySelector("#toast");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const SOUNDTRACK_HOOK_OFFSET = 0;

const sections = [...document.querySelectorAll("main > section")];

let isMusicPlaying = false;
let soundtrackStartApplied = false;
let toastTimer;
let activeSectionIndex = 0;
let sectionAnimationFrame;
let sectionAnimationActive = false;
let wheelDelta = 0;
let wheelGestureUsed = false;
let wheelIdleTimer;
let touchStartX = 0;
let touchStartY = 0;
let touchLastX = 0;
let touchLastY = 0;

document.body.classList.add("is-locked");
musicToggle.hidden = true;

function seekSoundtrackHook() {
  if (
    !soundtrackStartApplied &&
    Number.isFinite(soundtrack.duration) &&
    soundtrack.duration > SOUNDTRACK_HOOK_OFFSET
  ) {
    soundtrack.currentTime = SOUNDTRACK_HOOK_OFFSET;
    soundtrackStartApplied = true;
  }
}

async function startMusic() {
  try {
    soundtrack.volume = 0.9;
    seekSoundtrackHook();
    await soundtrack.play();
  } catch {
    isMusicPlaying = false;
    updateMusicButton();
    showToast("Tocca Sound on per avviare la musica");
  }
}

soundtrack.addEventListener("loadedmetadata", seekSoundtrackHook);
soundtrack.addEventListener("ended", () => {
  soundtrack.currentTime = SOUNDTRACK_HOOK_OFFSET;
  soundtrack.play().catch(() => {});
});

function stopMusic() {
  soundtrack.pause();
}

function updateMusicButton() {
  musicToggle.classList.toggle("is-paused", !isMusicPlaying);
  musicToggle.setAttribute("aria-pressed", String(isMusicPlaying));
  musicToggle.setAttribute("aria-label", isMusicPlaying ? "Metti in pausa la musica" : "Avvia la musica");
  musicLabel.textContent = isMusicPlaying ? "Sound on" : "Sound off";
}

enterButton.addEventListener("click", () => {
  startMusic();
  intro.classList.add("is-hidden");
  document.body.classList.remove("is-locked");
  musicToggle.hidden = false;
  window.setTimeout(() => intro.remove(), 900);
});

musicToggle.addEventListener("click", () => {
  if (isMusicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
});

function closestSectionIndex() {
  const headerOffset = header.offsetHeight;
  const currentPosition = window.scrollY + headerOffset;

  return sections.reduce((closestIndex, section, index) => {
    const closestDistance = Math.abs(sections[closestIndex].offsetTop - currentPosition);
    const sectionDistance = Math.abs(section.offsetTop - currentPosition);
    return sectionDistance < closestDistance ? index : closestIndex;
  }, 0);
}

function sectionTargetY(index) {
  if (index === 0) return 0;

  const section = sections[index];
  const headerOffset = header.offsetHeight;
  const availableHeight = window.innerHeight - headerOffset;
  const baseTarget = Math.max(0, section.offsetTop - headerOffset);

  // iOS Safari can expose a shorter visual viewport while its bottom browser
  // bar is open. Keep the section action above that changing lower edge.
  if (window.innerWidth < 700) {
    const action = section.querySelector(".primary-button, .copy-button");
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const bottomSafeSpace = Math.max(36, Math.min(56, viewportHeight * 0.07));

    if (action) {
      const actionBottom = window.scrollY + action.getBoundingClientRect().bottom;
      const actionTarget = actionBottom - (viewportHeight - bottomSafeSpace);
      return Math.max(baseTarget, actionTarget);
    }

    return baseTarget;
  }

  // On desktop, short sections are centered in the available viewport so their
  // primary action remains visible. Taller sections still start below the
  // fixed header and can breathe naturally into the next scroll gesture.
  if (window.innerWidth >= 700 && section.offsetHeight < availableHeight) {
    return Math.max(0, section.offsetTop - headerOffset - (availableHeight - section.offsetHeight) / 2);
  }

  return baseTarget;
}

function goToSection(index) {
  const nextIndex = Math.max(0, Math.min(index, sections.length - 1));
  const startY = window.scrollY;
  const targetY = sectionTargetY(nextIndex);
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) {
    activeSectionIndex = nextIndex;
    return;
  }

  window.cancelAnimationFrame(sectionAnimationFrame);
  activeSectionIndex = nextIndex;

  if (reducedMotion.matches) {
    window.scrollTo(0, targetY);
    return;
  }

  sectionAnimationActive = true;
  const startedAt = performance.now();
  const duration = Math.min(900, Math.max(620, Math.abs(distance) * 0.42));

  function animate(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2;

    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      sectionAnimationFrame = window.requestAnimationFrame(animate);
    } else {
      sectionAnimationActive = false;
    }
  }

  sectionAnimationFrame = window.requestAnimationFrame(animate);
}

function moveOneSection(direction) {
  const baseIndex = sectionAnimationActive ? activeSectionIndex : closestSectionIndex();
  goToSection(baseIndex + direction);
}

window.addEventListener("wheel", (event) => {
  if (reducedMotion.matches || document.body.classList.contains("is-locked")) return;
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

  event.preventDefault();
  window.clearTimeout(wheelIdleTimer);
  wheelIdleTimer = window.setTimeout(() => {
    wheelDelta = 0;
    wheelGestureUsed = false;
  }, 280);

  if (wheelGestureUsed || sectionAnimationActive) return;

  wheelDelta += event.deltaY;
  if (Math.abs(wheelDelta) < 18) return;

  wheelGestureUsed = true;
  moveOneSection(wheelDelta > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1 || document.body.classList.contains("is-locked")) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  touchLastX = touchStartX;
  touchLastY = touchStartY;
}, { passive: true });

window.addEventListener("touchmove", (event) => {
  if (reducedMotion.matches || event.touches.length !== 1 || document.body.classList.contains("is-locked")) return;
  touchLastX = event.touches[0].clientX;
  touchLastY = event.touches[0].clientY;

  const distanceX = touchLastX - touchStartX;
  const distanceY = touchLastY - touchStartY;
  if (Math.abs(distanceY) > 8 && Math.abs(distanceY) > Math.abs(distanceX)) {
    event.preventDefault();
  }
}, { passive: false });

window.addEventListener("touchend", () => {
  if (reducedMotion.matches || document.body.classList.contains("is-locked")) return;
  const distanceX = touchLastX - touchStartX;
  const distanceY = touchLastY - touchStartY;

  if (Math.abs(distanceY) >= 48 && Math.abs(distanceY) > Math.abs(distanceX)) {
    moveOneSection(distanceY < 0 ? 1 : -1);
  }
}, { passive: true });

window.addEventListener("keydown", (event) => {
  if (document.body.classList.contains("is-locked")) return;
  if (["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    moveOneSection(1);
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    moveOneSection(-1);
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    const targetIndex = sections.indexOf(target);
    if (targetIndex === -1) return;

    event.preventDefault();
    goToSection(targetIndex);
  });
});

soundtrack.addEventListener("play", () => {
  isMusicPlaying = true;
  updateMusicButton();
});

soundtrack.addEventListener("pause", () => {
  isMusicPlaying = false;
  updateMusicButton();
});

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function updateCountdown() {
  const remaining = Math.max(0, EVENT.startsAt.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };

  document.querySelector("#days").textContent = String(values.days);
  document.querySelector("#hours").textContent = pad(values.hours);
  document.querySelector("#minutes").textContent = pad(values.minutes);
  document.querySelector("#seconds").textContent = pad(values.seconds);

  if (remaining === 0) {
    document.querySelector("#countdown-after").hidden = false;
  }
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -5%" },
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

function onScroll() {
  const scrollY = window.scrollY;
  header.classList.toggle("is-scrolled", scrollY > 24);

  if (scrollY < window.innerHeight * 1.15 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroImage.style.transform = `scale(1.08) translate3d(0, ${scrollY * 0.1}px, 0)`;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

function formatCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

document.querySelector("#calendar-button").addEventListener("click", () => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Angelo 18//Midnight Elegance//IT",
    "BEGIN:VEVENT",
    `UID:angelo-18-${EVENT.startsAt.getTime()}@invite`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(EVENT.startsAt)}`,
    `DTEND:${formatCalendarDate(EVENT.endsAt)}`,
    `SUMMARY:${EVENT.title}`,
    `LOCATION:${EVENT.location}`,
    "DESCRIPTION:Dress code: Elegant Dark Suit.",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const file = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "angelo-18-midnight-elegance.ics";
  link.click();
  URL.revokeObjectURL(link.href);
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.querySelector("#share-button").addEventListener("click", () => {
  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set("v", "14");
  shareUrl.hash = "";
  const message = [
    "Angelo compie 18 anni ✦",
    "22 novembre 2026 · ore 20:30",
    "LUHMA Beef & Sushi Bar · Angri",
    shareUrl.toString(),
  ].join("\n");
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
});

const shuttleForm = document.querySelector("#shuttle-form");
const shuttleSubmit = shuttleForm.querySelector("button[type=submit]");
const shuttleStatus = document.querySelector("#shuttle-status");
const shuttlePhone = document.querySelector("#shuttle-phone");

shuttlePhone.addEventListener("input", () => {
  shuttlePhone.value = shuttlePhone.value.replace(/\D/g, "").slice(0, 10);
});

shuttleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  shuttleSubmit.disabled = true;
  shuttleStatus.textContent = "Invio della richiesta…";
  shuttleStatus.classList.remove("is-error", "is-success");

  try {
    const payload = new FormData(shuttleForm);
    payload.set("telefono", `+39 ${shuttlePhone.value}`);

    const response = await fetch(shuttleForm.action, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success === false) throw new Error("submit-failed");

    shuttleForm.reset();
    shuttleStatus.textContent = "Richiesta ricevuta. Ti contatteremo per confermare la navetta.";
    shuttleStatus.classList.add("is-success");
  } catch {
    shuttleStatus.textContent = "Non è stato possibile inviare la richiesta. Riprova tra poco.";
    shuttleStatus.classList.add("is-error");
  } finally {
    shuttleSubmit.disabled = false;
  }
});

document.querySelectorAll(".magnetic").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const bounds = button.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) * 0.12;
    const y = (event.clientY - bounds.top - bounds.height / 2) * 0.12;
    button.style.transform = `translate(${x}px, ${y}px)`;
  });

  button.addEventListener("pointerleave", () => {
    button.style.transform = "";
  });
});
