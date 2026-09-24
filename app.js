const CONFIG = {
  endpoint: "./data/status.json",
  refreshEveryMs: 60_000,
  timeZone: "America/Argentina/Cordoba",
};

const STATUS = {
  operational: { label: "Operativo", rank: 0 },
  maintenance: { label: "Mantenimiento", rank: 1 },
  degraded: { label: "Incidencia parcial", rank: 2 },
  outage: { label: "Fuera de servicio", rank: 3 },
  unknown: { label: "Sin información", rank: 4 },
};

const ICONS = {
  internet: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z"/></svg>',
  tv: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 2 4 4 4-4M8 22h8"/></svg>',
  telefonia: '<svg viewBox="0 0 24 24"><path d="M8 4 5 5.5c-1.2.7-1.6 2.1-1 3.3 2.2 4.8 6.1 8.7 10.9 10.9 1.2.6 2.6.2 3.3-1l1.6-2.7-4.5-3-1.6 2.2a14.8 14.8 0 0 1-5-5L11 8.5 8 4Z"/></svg>',
  agua: '<svg viewBox="0 0 24 24"><path d="M12 2S5.5 10 5.5 15.2a6.5 6.5 0 0 0 13 0C18.5 10 12 2 12 2Z"/><path d="M9 16.5c.5 1.2 1.4 1.8 2.7 2"/></svg>',
  monitoreo: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v5c0 5 3.2 8.3 8 10 4.8-1.7 8-5 8-10V6l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
};

const elements = {
  overallCard: document.querySelector("#overall-card"),
  overallTitle: document.querySelector("#overall-title"),
  overallMessage: document.querySelector("#overall-message"),
  overallIcon: document.querySelector(".overall-icon"),
  updatedAt: document.querySelector("#updated-at"),
  servicesGrid: document.querySelector("#services-grid"),
  activeIncidents: document.querySelector("#active-incidents"),
  historyList: document.querySelector("#history-list"),
  refreshButton: document.querySelector("#refresh-button"),
};

function cleanStatus(value) {
  return Object.hasOwn(STATUS, value) ? value : "unknown";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value, includeTime = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horario no informado";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: CONFIG.timeZone,
    day: "2-digit",
    month: "short",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(date);
}

function findOverallStatus(services) {
  return services.reduce((current, service) => {
    const candidate = cleanStatus(service.status);
    return STATUS[candidate].rank > STATUS[current].rank ? candidate : current;
  }, "operational");
}

function overallCopy(status) {
  const content = {
    operational: ["Todos los servicios funcionan con normalidad", "No registramos incidentes generales en este momento."],
    maintenance: ["Hay tareas de mantenimiento en curso", "Consultá el detalle para conocer los servicios alcanzados."],
    degraded: ["Registramos una incidencia parcial", "Algunos usuarios pueden experimentar inconvenientes."],
    outage: ["Hay servicios afectados", "Nuestro equipo se encuentra trabajando para normalizarlos."],
    unknown: ["No pudimos verificar todos los servicios", "Intentaremos actualizar la información nuevamente en breve."],
  };
  return content[status] || content.unknown;
}

function renderOverall(data) {
  const status = findOverallStatus(data.services || []);
  const [title, message] = overallCopy(status);
  elements.overallCard.dataset.status = status;
  elements.overallTitle.textContent = title;
  elements.overallMessage.textContent = message;
  elements.updatedAt.textContent = `Actualizado ${formatDate(data.updated_at)}`;

  const iconByStatus = {
    operational: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
    maintenance: '<svg viewBox="0 0 24 24"><path d="M12 7v5l3 2M4.9 4.9a10 10 0 1 0 2.2-1.7"/><path d="M3 3v5h5"/></svg>',
    degraded: '<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5v.1"/></svg>',
    outage: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>',
    unknown: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.8 1.8c-1 .7-1.6 1-1.6 2.2M12 17h.01"/></svg>',
  };
  elements.overallIcon.innerHTML = iconByStatus[status];

  const colors = {
    operational: ["var(--ok-soft)", "var(--ok)"],
    maintenance: ["var(--maintenance-soft)", "var(--maintenance)"],
    degraded: ["var(--warn-soft)", "var(--warn)"],
    outage: ["var(--danger-soft)", "var(--danger)"],
    unknown: ["var(--unknown-soft)", "var(--unknown)"],
  };
  elements.overallIcon.style.background = colors[status][0];
  elements.overallIcon.style.color = colors[status][1];
}

function renderServices(services = []) {
  if (!services.length) {
    elements.servicesGrid.innerHTML = '<div class="error-state"><span class="empty-icon">!</span><div><strong>No hay servicios para mostrar</strong><p>Revisaremos la información en la próxima actualización.</p></div></div>';
    return;
  }

  elements.servicesGrid.innerHTML = services.map((service) => {
    const status = cleanStatus(service.status);
    const icon = ICONS[service.id] || ICONS.monitoreo;
    return `
      <article class="service-card" data-status="${status}">
        <div class="service-icon" aria-hidden="true">${icon}</div>
        <div>
          <h3>${escapeHtml(service.name)}</h3>
          <div class="status-label"><span class="status-dot"></span>${STATUS[status].label}</div>
        </div>
        <p class="service-detail">${escapeHtml(service.message || "Sin novedades informadas.")}</p>
      </article>`;
  }).join("");
}

function renderIncidents(incidents = []) {
  const active = incidents.filter((incident) => incident.active !== false);
  if (!active.length) {
    elements.activeIncidents.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">✓</span>
        <div><strong>No hay incidentes activos</strong><p>Los servicios generales se encuentran sin novedades.</p></div>
      </div>`;
    return;
  }

  elements.activeIncidents.innerHTML = `<div class="incident-list">${active.map((incident) => `
    <article class="incident-card">
      <div class="incident-accent"></div>
      <div class="incident-body">
        <div class="incident-topline">
          <span class="incident-badge">${escapeHtml(incident.severity_label || "En seguimiento")}</span>
          <span class="eyebrow">${escapeHtml(incident.service)}</span>
        </div>
        <h3>${escapeHtml(incident.title)}</h3>
        <p>${escapeHtml(incident.message)}</p>
      </div>
      <div class="incident-meta">Desde ${formatDate(incident.started_at)}</div>
    </article>`).join("")}</div>`;
}

function renderHistory(history = []) {
  if (!history.length) {
    elements.historyList.innerHTML = '<li class="history-item"><span class="history-copy"><strong>Sin eventos recientes</strong><span>No hay novedades registradas.</span></span></li>';
    return;
  }

  elements.historyList.innerHTML = history.map((item) => {
    const status = cleanStatus(item.status);
    return `
      <li class="history-item">
        <time class="history-date">${formatDate(item.date)}</time>
        <span class="history-copy"><strong>${escapeHtml(item.service)}</strong><span>${escapeHtml(item.message)}</span></span>
        <span class="history-status" data-status="${status}">${escapeHtml(item.label || STATUS[status].label)}</span>
      </li>`;
  }).join("");
}

function renderError() {
  elements.overallCard.dataset.status = "unknown";
  elements.overallTitle.textContent = "No pudimos actualizar el panel";
  elements.overallMessage.textContent = "La última información disponible no pudo ser verificada.";
  elements.updatedAt.textContent = "Reintentaremos automáticamente";
  elements.servicesGrid.innerHTML = '<div class="error-state"><span class="empty-icon">!</span><div><strong>Error de conexión</strong><p>Probá nuevamente dentro de unos instantes.</p></div></div>';
  elements.activeIncidents.innerHTML = "";
  elements.historyList.innerHTML = "";
}

async function loadStatus() {
  elements.refreshButton.disabled = true;
  elements.refreshButton.classList.add("is-loading");

  try {
    const separator = CONFIG.endpoint.includes("?") ? "&" : "?";
    const response = await fetch(`${CONFIG.endpoint}${separator}t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.services)) throw new Error("Formato de respuesta inválido");
    renderOverall(data);
    renderServices(data.services);
    renderIncidents(data.incidents);
    renderHistory(data.history);
  } catch (error) {
    console.error("No se pudo cargar el estado de servicios:", error);
    renderError();
  } finally {
    elements.refreshButton.disabled = false;
    elements.refreshButton.classList.remove("is-loading");
  }
}

elements.refreshButton.addEventListener("click", loadStatus);
loadStatus();
window.setInterval(loadStatus, CONFIG.refreshEveryMs);
