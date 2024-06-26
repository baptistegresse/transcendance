import { eventHandlers } from "./eventHandlers.js";
import { setupNavbar } from "./navbar.js";
import { clearCanvas } from "/pong_app/static/pong_app/js/draw.js";
import { getGame } from "/pong_app/static/pong_app/js/pong.js";
import { tournamentWebSocketConnection } from "/tournaments/static/tournaments/js/tournaments.js";

export function adjustPageContainerHeight() {
  const navbarHeight = document.querySelector(".navbar").offsetHeight;
  document.getElementById(
    "pageContainer"
  ).style.height = `calc(100vh - ${navbarHeight}px)`;
}

export function loadView(viewUrl) {
  console.log("Loading view:", viewUrl);
  const language = getLanguage();
  viewUrl = `${viewUrl}?language=${language}`;
  console.log(viewUrl);
  clearPage();
  return fetch(viewUrl)
    .then((response) => response.text())
    .then((data) => (document.getElementById("pageContainer").innerHTML = data))
    .then(() => console.log(document.getElementById("menuToggle")))
    .then(() =>
      document.getElementById("tournament")
        ? console.log("tournament")
        : console.log("not tournament")
    )
    .catch((error) => console.error("Error:", error));
}

export async function loadGame(sessionId) {
  if (!sessionId) return;

  try {
    await hideUI();
    await loadView(`/pong/${sessionId}`);
    await loadScript("pong_app/static/pong_app/p5/p5.js");
    await getGame(sessionId);
  } catch (error) {
    console.error("Error:", error);
  }
}

function hideUI() {
  document.getElementById("navbarContainer").classList.add("d-none");
  document.getElementById("sidebarContainer").classList.add("d-none");
}

export function showUI() {
  document.getElementById("navbarContainer").classList.remove("d-none");
  document.getElementById("sidebarContainer").classList.remove("d-none");
}

export function loadScripts(scriptUrls) {
  removeExistingScripts(scriptUrls);
  return scriptUrls.reduce(
    (promise, scriptUrl) => promise.then(() => loadScript(scriptUrl)),
    Promise.resolve()
  );
}

function removeExistingScripts(scriptUrls) {
  scriptUrls.forEach((url) => {
    let existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      existingScript.remove();
    }
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "module";
    script.className = "dynamic-script";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function clearPage() {
  if (typeof clearCanvas === "function") clearCanvas();
  document.getElementById("pageContainer").innerHTML = "";
}

export function updateNavbar() {
  fetch(`/navbar?language=${getLanguage()}`)
    .then((response) => response.text())
    .then((navbarHtml) => {
      document.getElementById("navbarContainer").innerHTML = navbarHtml;
    })
    .then(() => {
      loadScript("/static/main/js/navbar.js").catch((error) =>
        console.error("Error:", error)
      );
      setupNavbar();
    })
    .catch((error) => console.error("Error:", error));
}

export function updateSidebar() {
  fetch(`/sidebar?language=${getLanguage()}`)
    .then((response) => response.text())
    .then(
      (sidebarHtml) =>
        (document.getElementById("sidebarContainer").innerHTML = sidebarHtml)
    )
    .catch((error) => console.error("Error:", error));
}

export function updatePage() {
  fetch(`/?language=${getLanguage()}`)
    .then((response) => response.text())
    .then((pageHtml) => (document.body.innerHTML = pageHtml))
    .then(() =>
      loadScripts([
        "/static/main/js/eventHandlers.js",
        "/static/main/js/navbar.js",
        "/static/tournaments/js/tournaments.js",
        "/static/main/bootstrap/js/bootstrap.bundle.min.js",
      ])
    )
    .then(() => {
      adjustPageContainerHeight();
      setupNavbar();
      eventHandlers();
      loadGame(getSessionId()).catch((error) => console.error("Error:", error));
      tournamentWebSocketConnection(getTournamentId());
    })
    .catch((error) => console.error("Error:", error));
}

function getSessionId() {
  const sessionIdMeta = document.querySelector('meta[name="user-session-id"]');

  let sessionId;
  sessionIdMeta ? (sessionId = sessionIdMeta.getAttribute("content")) : null;

  return sessionId;
}

export function getTournamentId() {
  const tournamentIdMeta = document.querySelector(
    'meta[name="user-tournament-id"]'
  );

  let tournamentId;
  tournamentIdMeta
    ? (tournamentId = tournamentIdMeta.getAttribute("content"))
    : null;

  return tournamentId;
}

export function getCsrfToken() {
  return (
    document.cookie
      .split(";")
      .find((cookie) => cookie.trim().startsWith("csrftoken="))
      ?.split("=")[1] ?? null
  );
}

export function getLanguage() {
  return localStorage.getItem("lang");
}
