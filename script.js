const scopeStatus = document.getElementById("scope-status");
const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const suggestions = document.getElementById("suggestions");
const chatPopup = document.getElementById("chat-popup");
const chatLauncher = document.getElementById("chat-launcher");
const chatClose = document.getElementById("chat-close");
const chatOverlay = document.getElementById("chat-overlay");
const chatTriggers = Array.from(document.querySelectorAll("[data-open-chat]"));
const quizTriggers = Array.from(document.querySelectorAll("[data-open-quiz]"));
const quizPopup = document.getElementById("quiz-popup");
const quizOverlay = document.getElementById("quiz-overlay");
const quizClose = document.getElementById("quiz-close");
const quizPanel = document.querySelector(".quiz-panel");
const quizStage = document.getElementById("quiz-stage");
const quizStepLabel = document.getElementById("quiz-step-label");
const quizProgressFill = document.getElementById("quiz-progress-fill");
const quizSummary = document.getElementById("quiz-summary");
const quizResultTitle = document.getElementById("quiz-result-title");
const quizResultCopy = document.getElementById("quiz-result-copy");
const quizResultList = document.getElementById("quiz-result-list");
const quizBack = document.getElementById("quiz-back");
const quizWhatsapp = document.getElementById("quiz-whatsapp");

const KNOWLEDGE_KEY = "casa-brisa-knowledge-v1";
const HISTORY_KEY = "casa-brisa-chat-history-v4";
const KNOWLEDGE_VERSION = "2026-03-18";
const QUIZ_WHATSAPP_FALLBACK = "573001234567";
let knowledgeCache = null;
const GREETING_SUGGESTIONS = [
  "Voy 3 días con mi pareja y quiero algo especial",
  "Voy con niños 4 días y quiero algo cómodo",
  "Es mi primera vez en Cartagena",
  "Quiero ayuda con reservas y traslados",
];

const DEFAULT_SUGGESTIONS = [
  "Viajamos en pareja 3 días y queremos algo especial",
  "Voy con niños 4 días y quiero algo cómodo",
  "Es mi primera vez y quiero saber dónde quedarme",
  "Necesito aeropuerto, reservas y una ruta tranquila",
];

const SERVICE_QUIZ_STEPS = [
  {
    id: "profile",
    question: "Como vienes a Cartagena?",
    description: "Asi afinamos el tono del servicio desde el primer paso.",
    options: [
      {
        value: "couple",
        title: "Pareja o aniversario",
        description: "Quieres algo especial, comodo o con detalles mejor cuidados.",
      },
      {
        value: "first_time",
        title: "Primera vez",
        description: "Necesitas filtro, zona y una lectura clara de la ciudad.",
      },
      {
        value: "family",
        title: "Familia con niños",
        description: "La logistica y el ritmo importan tanto como el plan.",
      },
      {
        value: "short_trip",
        title: "Agenda corta",
        description: "Vienes con poco tiempo y no quieres improvisar decisiones.",
      },
    ],
  },
  {
    id: "duration",
    question: "Cuantos dias vas a estar?",
    description: "La duracion cambia mucho el nivel de apoyo que vale la pena.",
    options: [
      {
        value: "2_3",
        title: "2 o 3 dias",
        description: "Hay poco margen, asi que conviene priorizar bien.",
      },
      {
        value: "4_5",
        title: "4 o 5 dias",
        description: "Ya hay espacio para mezclar ciudad, reservas y descanso.",
      },
      {
        value: "6_plus",
        title: "6 dias o mas",
        description: "Vale la pena ordenar ritmos, zonas y experiencias sin saturarte.",
      },
    ],
  },
  {
    id: "support",
    question: "Que tanto quieres delegar?",
    description: "Este paso define el servicio que mas sentido tiene para ti.",
    options: [
      {
        value: "basic",
        title: "Solo quiero una ruta clara",
        description: "Necesito orden antes del viaje, pero yo ejecuto despues.",
      },
      {
        value: "reservations",
        title: "Quiero ruta, reservas y traslados",
        description: "Prefiero salir con lo importante mas resuelto.",
      },
      {
        value: "live_support",
        title: "Quiero apoyo por WhatsApp durante el viaje",
        description: "Si algo cambia, quiero a alguien que me ayude a moverlo.",
      },
      {
        value: "delegate",
        title: "Quiero delegar casi todo",
        description: "Busco tranquilidad, coordinacion fina y menos carga operativa.",
      },
    ],
  },
];

const serviceQuizState = {
  stepIndex: 0,
  answers: {},
};

const domainKeywords = [
  "cartagena",
  "plan",
  "planes",
  "itinerario",
  "itinerarios",
  "restaurante",
  "restaurantes",
  "pareja",
  "parejas",
  "familia",
  "familias",
  "niños",
  "niñas",
  "corporativo",
  "corporativos",
  "vip",
  "reserva",
  "reservas",
  "transporte",
  "traslado",
  "traslados",
  "whatsapp",
  "viaje",
  "viajes",
  "aniversario",
  "islas",
  "rosario",
  "getsemani",
  "rooftop",
  "tours",
  "spa",
  "precio",
  "precios",
  "aeropuerto",
  "hospedaje",
  "hotel",
  "zona",
  "bocagrande",
  "centro",
  "historico",
  "familiar",
  "lluvia",
  "primera",
  "primeriza",
  "primerizo",
  "romantico",
  "tranquilo",
  "trabajo",
];

const offTopicPatterns = [
  /\b(que dia es hoy|que fecha es hoy|fecha de hoy|hora es)\b/,
  /\b(construir una casa|hacer una casa|levantar una casa)\b/,
  /\b(receta|cocinar|algebra|derivada|programar|javascript|python|html|css)\b/,
  /\b(futbol|presidente|capital de|historia universal|medicina|embarazo)\b/,
];

const replies = {
  greeting:
    "Hola, soy Brisa. Si me dices cuántos días vienes, con quién viajas y qué tipo de plan te gusta, te ayudo a aterrizar mejor tu viaje en Cartagena.",
  offTopic:
    "Puedo ayudarte con tu viaje en Cartagena: planes, zonas, reservas, traslados, ideas por perfil y acompañamiento durante la estadía.",
};

scopeStatus.textContent = "Tu asistente para organizar Cartagena";

replies.welcome =
  "Hola, soy Brisa. Te ayudo a ordenar tu viaje en Cartagena sin perder tiempo en opciones sueltas.";
replies.greeting =
  "Hola. Si quieres que vayamos al punto, dime cuantos dias vienes, con quien viajas y que tipo de plan quieres hacer.";
replies.greetingFollowUp =
  "Aqui estoy. Para no responderte en vacio, necesito una pista concreta del viaje: cuantos dias vienes, con quien viajas o que necesitas resolver primero.";
replies.greetingWithContext =
  "Ya te sigo. Con lo que vienes contando, lo mejor ahora es cerrar el siguiente paso del viaje en vez de arrancar de cero.";
GREETING_SUGGESTIONS[0] = "Voy 3 dias con mi pareja y quiero algo especial";
GREETING_SUGGESTIONS[1] = "Voy con niños 4 dias y quiero algo comodo";
GREETING_SUGGESTIONS[2] = "Es mi primera vez en Cartagena";
GREETING_SUGGESTIONS[3] = "Quiero ayuda con reservas y traslados";

restoreConversation();
renderSuggestions(resolveOpeningSuggestions());
initializeServiceQuiz();

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();

  if (!message) {
    return;
  }

  submitPrompt(message);
});

suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  submitPrompt(button.dataset.message || button.textContent.trim());
});

chatTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (trigger.tagName === "A") {
      event.preventDefault();
    }

    openChat();

    if (trigger.dataset.prefill) {
      window.setTimeout(() => submitPrompt(trigger.dataset.prefill), 70);
    }
  });
});

quizTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (trigger.tagName === "A") {
      event.preventDefault();
    }

    openQuizModal();
  });
});

chatLauncher.addEventListener("click", openChat);
chatClose.addEventListener("click", closeChat);
chatOverlay.addEventListener("click", closeChat);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (chatPopup.classList.contains("is-open")) {
    closeChat();
    return;
  }

  if (quizPopup?.classList.contains("is-open")) {
    closeQuizModal();
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 },
);

document.querySelectorAll("[data-reveal]").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
  observer.observe(element);
});

function initializeServiceQuiz() {
  if (
    !quizPopup ||
    !quizOverlay ||
    !quizClose ||
    !quizPanel ||
    !quizStage ||
    !quizStepLabel ||
    !quizProgressFill ||
    !quizSummary ||
    !quizResultTitle ||
    !quizResultCopy ||
    !quizResultList ||
    !quizBack ||
    !quizWhatsapp
  ) {
    return;
  }

  quizStage.addEventListener("click", handleQuizOptionSelect);
  quizBack.addEventListener("click", handleQuizBack);
  quizOverlay.addEventListener("click", closeQuizModal);
  quizClose.addEventListener("click", closeQuizModal);
  renderServiceQuiz();

  window.setTimeout(() => {
    openQuizModal();
  }, 420);
}

function renderServiceQuiz() {
  const step = SERVICE_QUIZ_STEPS[serviceQuizState.stepIndex];

  if (!step) {
    return;
  }

  const currentAnswer = serviceQuizState.answers[step.id];
  const progress = ((serviceQuizState.stepIndex + 1) / SERVICE_QUIZ_STEPS.length) * 100;

  quizSummary.hidden = true;
  quizWhatsapp.hidden = true;
  quizBack.hidden = serviceQuizState.stepIndex === 0;
  quizBack.textContent = "Atras";
  quizStepLabel.textContent = `Paso ${serviceQuizState.stepIndex + 1} de ${SERVICE_QUIZ_STEPS.length}`;
  quizProgressFill.style.width = `${progress}%`;

  quizStage.innerHTML = `
    <div class="quiz-question">
      <h3>${step.question}</h3>
      <p>${step.description}</p>
    </div>
    <div class="quiz-options">
      ${step.options
        .map(
          (option) => `
            <button
              type="button"
              class="quiz-option ${currentAnswer === option.value ? "is-selected" : ""}"
              data-quiz-step="${step.id}"
              data-quiz-value="${option.value}"
            >
              <strong>${option.title}</strong>
              <span>${option.description}</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function handleQuizOptionSelect(event) {
  const option = event.target.closest(".quiz-option");

  if (!option) {
    return;
  }

  const { quizStep, quizValue } = option.dataset;
  serviceQuizState.answers[quizStep] = quizValue;

  if (serviceQuizState.stepIndex === SERVICE_QUIZ_STEPS.length - 1) {
    showQuizSummary();
    return;
  }

  serviceQuizState.stepIndex += 1;
  renderServiceQuiz();
}

function handleQuizBack() {
  if (quizWhatsapp.hidden) {
    if (serviceQuizState.stepIndex === 0) {
      return;
    }

    serviceQuizState.stepIndex -= 1;
    renderServiceQuiz();
    return;
  }

  quizWhatsapp.hidden = true;
  serviceQuizState.stepIndex = SERVICE_QUIZ_STEPS.length - 1;
  renderServiceQuiz();
}

function showQuizSummary() {
  const result = buildQuizRecommendation(serviceQuizState.answers);
  const whatsappNumber = sanitizeWhatsappNumber(
    quizPanel.dataset.whatsappNumber || QUIZ_WHATSAPP_FALLBACK,
  );

  quizStage.innerHTML = "";
  quizSummary.hidden = false;
  quizBack.hidden = false;
  quizBack.textContent = "Cambiar respuestas";
  quizStepLabel.textContent = "Listo para enviar";
  quizProgressFill.style.width = "100%";
  quizResultTitle.textContent = result.title;
  quizResultCopy.textContent = result.copy;
  quizResultList.innerHTML = result.highlights.map((item) => `<li>${item}</li>`).join("");
  quizWhatsapp.href = buildQuizWhatsappUrl(whatsappNumber, result, serviceQuizState.answers);
  quizWhatsapp.hidden = false;
}

function buildQuizRecommendation(answers) {
  const profileLabel = getQuizOptionLabel("profile", answers.profile);
  const durationLabel = getQuizOptionLabel("duration", answers.duration);
  const supportLabel = getQuizOptionLabel("support", answers.support);
  const wantsVip = answers.support === "delegate";
  const wantsExperience =
    wantsVip ||
    answers.support === "reservations" ||
    answers.support === "live_support" ||
    answers.profile === "family" ||
    answers.profile === "first_time";

  if (wantsVip) {
    return {
      title: "Plan VIP · Mayordomia Turistica",
      copy:
        "Tiene mas sentido para viajes delicados, fechas especiales o personas que quieren delegar la operacion casi completa.",
      highlights: [
        `Perfil detectado: ${profileLabel}.`,
        `Duracion estimada: ${durationLabel}.`,
        `Necesidad principal: ${supportLabel}.`,
        "La recomendacion apunta a coordinacion integral, proveedores y seguimiento mas fino.",
      ],
    };
  }

  if (wantsExperience) {
    return {
      title: "Plan Experiencia · Asistencia Virtual",
      copy:
        "Es el mejor equilibrio cuando quieres ruta clara, reservas, traslados o apoyo por WhatsApp mientras el viaje ya esta pasando.",
      highlights: [
        `Perfil detectado: ${profileLabel}.`,
        `Duracion estimada: ${durationLabel}.`,
        `Necesidad principal: ${supportLabel}.`,
        "La recomendacion apunta a acompanamiento real sin subir todavia al nivel VIP.",
      ],
    };
  }

  return {
    title: "Plan Basico · Itinerario Inteligente",
    copy:
      "Te conviene si lo que buscas es llegar con decisiones claras antes de viajar, pero sin acompanamiento activo durante la estadia.",
    highlights: [
      `Perfil detectado: ${profileLabel}.`,
      `Duracion estimada: ${durationLabel}.`,
      `Necesidad principal: ${supportLabel}.`,
      "La recomendacion apunta a claridad previa, filtros utiles y menos improvisacion.",
    ],
  };
}

function getQuizOptionLabel(stepId, value) {
  const step = SERVICE_QUIZ_STEPS.find((item) => item.id === stepId);
  const option = step?.options.find((item) => item.value === value);
  return option ? option.title : "Sin definir";
}

function sanitizeWhatsappNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .trim();
}

function buildQuizWhatsappUrl(number, result, answers) {
  const safeNumber = number || QUIZ_WHATSAPP_FALLBACK;
  const message = [
    "Hola Casa Brisa, acabo de completar el cuestionario de la web y quiero continuar.",
    "",
    `- Tipo de viaje: ${getQuizOptionLabel("profile", answers.profile)}`,
    `- Duracion: ${getQuizOptionLabel("duration", answers.duration)}`,
    `- Nivel de ayuda: ${getQuizOptionLabel("support", answers.support)}`,
    `- Servicio sugerido: ${result.title}`,
    "",
    "Quiero que me orienten con el siguiente paso.",
  ].join("\n");

  return `https://wa.me/${safeNumber}?text=${encodeURIComponent(message)}`;
}

function answerQuestion(input) {
  const normalized = normalize(input);
  const tokens = tokenize(normalized);
  const profile = extractTripProfile(normalized);
  const conversation = getConversationContext(true);

  if (!tokens.length) {
    return buildGreetingReply(conversation, normalized, profile);
  }

  if (isGreeting(normalized)) {
    return buildGreetingReply(conversation, normalized, profile);
  }

  if (isOffTopic(normalized)) {
    return createReply(replies.offTopic, normalized, profile);
  }

  const routedReply = intentReply(normalized, profile);

  if (routedReply) {
    return createReply(routedReply, normalized, profile);
  }

  const knowledgeEntries = loadKnowledgeStore();
  const matches = knowledgeEntries
    .map((entry) => ({
      ...entry,
      score: scoreKnowledge(entry, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const hasDomainSignal = tokens.some((token) => domainKeywords.includes(token));

  if (!matches.length && !hasDomainSignal) {
    return createReply(replies.offTopic, normalized, profile);
  }

  if (!matches.length) {
    return createReply(
      "Puedo orientarte mejor si me dices con quién viajas, cuántos días vas y si quieres solo itinerario o también apoyo con reservas, traslados y WhatsApp durante el viaje.",
      normalized,
      profile,
    );
  }

  return createReply(composeKnowledgeReply(matches, profile), normalized, profile);
}

function openQuizModal() {
  if (!quizPopup) {
    return;
  }

  quizPopup.classList.add("is-open");
  quizPopup.setAttribute("aria-hidden", "false");
  document.body.classList.add("quiz-open");

  window.setTimeout(() => {
    quizStage.querySelector(".quiz-option")?.focus();
  }, 140);
}

function closeQuizModal() {
  if (!quizPopup) {
    return;
  }

  quizPopup.classList.remove("is-open");
  quizPopup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("quiz-open");
}

function openChat() {
  if (quizPopup?.classList.contains("is-open")) {
    closeQuizModal();
  }

  chatPopup.classList.add("is-open");
  chatPopup.setAttribute("aria-hidden", "false");
  chatLauncher.setAttribute("aria-expanded", "true");
  document.body.classList.add("chat-open");
  window.setTimeout(() => chatInput.focus(), 120);
}

function closeChat() {
  chatPopup.classList.remove("is-open");
  chatPopup.setAttribute("aria-hidden", "true");
  chatLauncher.setAttribute("aria-expanded", "false");
  document.body.classList.remove("chat-open");
  chatLauncher.focus();
}
  if (quizPopup?.classList.contains("is-open")) {
    closeQuizModal();
  }


function closeChat() {
  chatPopup.classList.remove("is-open");
  chatPopup.setAttribute("aria-hidden", "true");
  chatLauncher.setAttribute("aria-expanded", "false");
  document.body.classList.remove("chat-open");
  chatLauncher.focus();
}

function intentReply(normalized, profile) {
  if (hasAny(normalized, ["que plan", "me conviene", "recomiendas", "me sirve"])) {
    return recommendPlan(profile, normalized);
  }

  if (hasAny(normalized, ["precio", "precios", "cuanto", "cuesta", "valor"])) {
    if (hasAny(normalized, ["vip", "mayordomia"])) {
      return "El Plan VIP cuesta entre $200.000 y $400.000+ e incluye coordinación completa, contacto con proveedores, seguimiento diario y ayuda con detalles especiales como aniversarios o sorpresas.";
    }

    if (hasAny(normalized, ["experiencia", "virtual", "whatsapp"])) {
      return "El Plan Experiencia va entre $80.000 y $150.000. Ahí ya entra la asistencia por WhatsApp durante el viaje, los ajustes en tiempo real y la gestión de reservas.";
    }

    if (hasAny(normalized, ["basico", "itinerario"])) {
      return "El Plan Básico va entre $40.000 y $70.000. Es la opción más ligera para salir con la ruta clara, recomendaciones filtradas y tips útiles antes de viajar.";
    }

    return "Los rangos arrancan así: Básico $40.000 - $70.000, Experiencia $80.000 - $150.000 y VIP $200.000 - $400.000+.";
  }

  if (hasAny(normalized, ["incluye", "que trae"])) {
    if (hasAny(normalized, ["vip", "mayordomia"])) {
      return "El VIP incluye todo lo anterior más coordinación completa, contacto directo con proveedores, seguimiento diario y apoyo para detalles especiales.";
    }

    if (hasAny(normalized, ["experiencia", "virtual"])) {
      return "El Plan Experiencia incluye el itinerario base, apoyo por WhatsApp durante el viaje, ajustes si cambia el plan y gestión de reservas.";
    }

    if (hasAny(normalized, ["basico", "itinerario"])) {
      return "El Básico incluye itinerario personalizado, recomendaciones de restaurantes, lugares y actividades, además de orientación sobre seguridad, transporte y horarios.";
    }
  }

  if (profile.family) {
    return recommendFamilyFlow(profile);
  }

  if (profile.couple || profile.anniversary) {
    return recommendCoupleFlow(profile);
  }

  if (profile.corporate) {
    return "Si el viaje es por trabajo, conviene dejar todo muy limpio: zona práctica, traslados definidos y una agenda con pocos movimientos. En ese caso el Básico sirve si solo quieres orden; el Experiencia funciona mejor si además quieres que te ayuden a mover reservas o cambios.";
  }

  if (hasAny(normalized, ["donde me quedo", "donde quedarme", "quedarme", "hospedaje", "hotel", "zona"])) {
    return "Depende mucho del tono del viaje. Centro Histórico funciona bien si quieres caminar y sentir lo clásico. Getsemaní se siente más vivo y cercano al ambiente local. Bocagrande suele ser más práctico si priorizas comodidad, edificios modernos y salidas rápidas. Si quieres, dime si prefieres caminar, ambiente o comodidad y te cierro mejor la zona.";
  }

  if (hasAny(normalized, ["aeropuerto", "traslado", "traslados", "transfer"])) {
    return "Sí, también tiene mucho sentido ayudarte con traslados. La llegada desde el aeropuerto es una de las partes donde más se nota la diferencia entre llegar improvisando y llegar ya resuelto, sobre todo si vienes con equipaje, niños o una agenda corta. Si quieres, dime si necesitas solo aeropuerto o toda la movilidad del viaje.";
  }

  if (hasAny(normalized, ["reserva", "reservas", "restaurante", "restaurantes", "spa"])) {
    return "Sí, te podemos orientar con reservas y eso se vuelve especialmente útil cuando vienes pocos días o quieres asegurar restaurantes, rooftop, spa o experiencias con buena hora y buena logística. Si quieres, dime si lo tuyo va más por cena, rooftop, spa o plan de islas.";
  }

  if (hasAny(normalized, ["primera vez", "primeriza", "primerizo"])) {
    return "Si es tu primera vez en Cartagena, yo intentaría no sobrecargar la agenda. Centro Histórico, Getsemaní y una buena salida a Islas del Rosario suelen cubrir muy bien una primera visita si el ritmo está bien pensado. Si quieres, te ayudo a decidir según si vienes más por ciudad, descanso o algo romántico.";
  }

  if (hasAny(normalized, ["islas", "rosario"])) {
    return "Islas del Rosario suele ser de los planes más pedidos. Vale mucho más cuando sales con la logística clara, el transporte resuelto y el resto del día armado para no terminar corriendo.";
  }

  if (hasAny(normalized, ["lluvia", "llueve", "clima"])) {
    return "Si cambia el clima, la idea es no perder el día. Con acompañamiento se puede reorganizar la ruta, mover reservas y ajustar el tono del plan sin desarmarte todo el viaje.";
  }

  if (hasAny(normalized, ["que necesitas", "que datos", "que te digo", "que informacion"])) {
    return "Lo más útil es saber cuántos días vienes, con quién viajas, presupuesto aproximado, si es primera vez o no, qué tipo de ambiente te gusta y si hay algo que sí o sí quieres hacer. Con eso ya se puede orientar bastante bien.";
  }

  return "";
}

function recommendPlan(profile, normalized) {
  const lead = buildProfileLead(profile);

  if (profile.anniversary || hasAny(normalized, ["sorpresa", "especial", "premium", "lujo"])) {
    return `${lead}yo me iría por el Plan VIP. Te da margen para coordinar mejor, cuidar detalles especiales y no cargar a la persona que viaja contigo con la parte operativa. Si quieres, te ayudo a aterrizar si lo suyo va más por cena, rooftop, islas o algo más tranquilo.`;
  }

  if (
    profile.family ||
    profile.firstTime ||
    profile.needsReservations ||
    profile.needsTransfers ||
    hasAny(normalized, ["whatsapp", "acompanamiento", "acompañamiento"])
  ) {
    return `${lead}el Plan Experiencia suele encajar mejor. Ya no sales solo con la ruta clara, sino con apoyo para mover reservas, ajustar cosas durante el viaje y resolver cambios sin improvisar. Si quieres, lo bajamos según días, traslados y tipo de plan.`;
  }

  if (profile.corporate || hasAny(normalized, ["ordenado", "sin acompanamiento", "sin acompañamiento", "solo itinerario"])) {
    return `${lead}el Plan Básico puede ser suficiente. Es la mejor opción cuando lo que quieres es claridad antes de viajar, pero sin acompañamiento activo durante la estadía.`;
  }

  return `${lead}si quieres una respuesta más precisa, dime si vienes en pareja, con niños, por trabajo o si es tu primera vez. Con eso te digo cuál plan te calza mejor entre Básico, Experiencia y VIP.`;
}

function recommendFamilyFlow(profile) {
  const lead = buildProfileLead(profile);
  return `${lead}yo cuidaría tres cosas: no meter demasiados traslados en un mismo día, dejar espacio para descansar y reservar con tiempo lo que realmente vale la pena. Si quieres solo salir con la ruta ordenada, el Básico alcanza; si quieres apoyo real mientras viajas, el Experiencia suele ser el más equilibrado para familias. Si quieres, dime si los niños son pequeños o si ya aguantan un plan más movido.`;
}

function recommendCoupleFlow(profile) {
  const lead = buildProfileLead(profile);
  if (profile.anniversary) {
    return `${lead}yo priorizaría un viaje más fino que cargado: una cena especial, un rooftop bien elegido, una experiencia privada y tiempos cómodos. Si además quieres detalles o sorpresas, el VIP es el que mejor responde. Si quieres, dime cuántos días vienen y si buscan algo más calmado o más wow.`;
  }

  return `${lead}para pareja suele funcionar mejor un viaje con ritmo agradable: una o dos reservas bien elegidas, algo de rooftop, una experiencia especial y espacio para caminar sin correr. El Experiencia o el VIP suelen tener más sentido que improvisar sobre la marcha. Si quieres, te lo bajo según días y tipo de ambiente.`;
}

function submitPrompt(message) {
  addMessage("user", message);
  chatInput.value = "";

  const reply = answerQuestion(message);
  window.setTimeout(() => {
    addMessage("assistant", reply.text);
    renderSuggestions(reply.followUps);
  }, 160);
}

function createReply(text, normalized, profile, followUps) {
  return {
    text,
    followUps: followUps || buildFollowUps(normalized, profile),
  };
}

function buildGreetingReply(conversation, normalized, profile) {
  if (conversation.hasTripSignal) {
    return createReply(
      replies.greetingWithContext,
      normalized,
      profile,
      buildContextFollowUps(conversation.knownProfile),
    );
  }

  if (conversation.previousUserCount > 1) {
    return createReply(
      "Sigo aqui. Si quieres que esto avance, escribeme algo como: viajo 3 dias en pareja, es mi primera vez o necesito reservas y traslados.",
      normalized,
      profile,
      GREETING_SUGGESTIONS,
    );
  }

  if (conversation.previousUserCount > 0) {
    return createReply(replies.greetingFollowUp, normalized, profile, GREETING_SUGGESTIONS);
  }

  return createReply(replies.greeting, normalized, profile, GREETING_SUGGESTIONS);
}

function buildFollowUps(normalized, profile) {
  if (profile.anniversary || hasAny(normalized, ["aniversario", "especial", "sorpresa"])) {
    return [
      "Venimos 3 días y queremos cena especial",
      "Queremos algo más tranquilo que lujoso",
      "También necesitamos traslados",
      "Nos gustaría incluir Rosario",
    ];
  }

  if (profile.family) {
    return [
      "Viajamos con niños pequeños",
      "Queremos un ritmo suave y seguro",
      "También necesito traslados",
      "Solo quiero un itinerario claro",
    ];
  }

  if (profile.firstTime || hasAny(normalized, ["quedarme", "zona", "hotel", "hospedaje"])) {
    return [
      "Quiero caminar y comer rico",
      "Prefiero algo con más ambiente",
      "Busco comodidad y menos movimiento",
      "Solo estaré 3 días",
    ];
  }

  if (hasAny(normalized, ["aeropuerto", "traslado", "reserva", "reservas"])) {
    return [
      "Solo aeropuerto ida y vuelta",
      "También quiero restaurantes",
      "Quiero dejar todo reservado",
      "Es un viaje corto de 3 días",
    ];
  }

  if (profile.couple || hasAny(normalized, ["pareja", "rooftop", "romantico", "romantica"])) {
    return [
      "Queremos rooftop y buena cena",
      "Preferimos algo tranquilo",
      "También quiero traslados",
      "Es para aniversario",
    ];
  }

  return DEFAULT_SUGGESTIONS;
}

function buildContextFollowUps(profile) {
  if (profile.family) {
    return [
      "Quiero una zona comoda para familia",
      "Necesito traslados con niños",
      "Quiero un ritmo tranquilo",
      "Ayudame con reservas",
    ];
  }

  if (profile.couple || profile.anniversary) {
    return [
      "Quiero una cena especial",
      "Ayudame a elegir plan",
      "Quiero rooftop y traslados",
      "Quiero algo tranquilo",
    ];
  }

  if (profile.firstTime) {
    return [
      "Ayudame a elegir zona",
      "Quiero una ruta de 3 dias",
      "Quiero incluir Rosario",
      "Necesito aeropuerto y reservas",
    ];
  }

  if (profile.needsReservations || profile.needsTransfers) {
    return [
      "Solo aeropuerto ida y vuelta",
      "Tambien quiero restaurantes",
      "Quiero dejar todo reservado",
      "Es un viaje corto de 3 dias",
    ];
  }

  return GREETING_SUGGESTIONS;
}

function renderSuggestions(list) {
  const safeList = Array.isArray(list) ? list.filter(Boolean).slice(0, 4) : [];
  suggestions.innerHTML = "";

  if (!safeList.length) {
    suggestions.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();

  safeList.forEach((text) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-chip";
    button.dataset.message = text;
    button.textContent = text;
    fragment.appendChild(button);
  });

  suggestions.appendChild(fragment);
  suggestions.hidden = false;
}

function composeKnowledgeReply(matches, profile) {
  const lead = buildProfileLead(profile);
  const primary = matches[0];
  const details = matches.flatMap((entry) => entry.details).slice(0, 3);

  if (!details.length) {
    return `${lead}${primary.summary}`;
  }

  return `${lead}${primary.summary}\n\nTe lo bajaría así:\n- ${details.join("\n- ")}`;
}

function buildProfileLead(profile) {
  const parts = [];

  if (profile.duration) {
    parts.push(`${profile.duration} días`);
  }

  if (profile.family) {
    parts.push("viajando en familia");
  } else if (profile.couple || profile.anniversary) {
    parts.push("viajando en pareja");
  } else if (profile.corporate) {
    parts.push("en viaje de trabajo");
  }

  if (profile.firstTime) {
    parts.push("siendo tu primera vez");
  }

  if (!parts.length) {
    return "";
  }

  return `Para ${parts.join(", ")}, `;
}

function extractTripProfile(normalized) {
  const durationMatch = normalized.match(/(\d+)\s*(dia|dias|noche|noches)/);

  return {
    duration: durationMatch ? Number(durationMatch[1]) : null,
    family: hasAny(normalized, ["familia", "familias", "niños", "niñas", "niños", "niñas"]),
    couple: hasAny(normalized, ["pareja", "parejas", "romantico", "romantica"]),
    anniversary: hasAny(normalized, ["aniversario", "cumpleanos", "cumpleaños", "sorpresa"]),
    corporate: hasAny(normalized, ["corporativo", "corporativos", "trabajo", "negocio", "ejecutivo"]),
    firstTime: hasAny(normalized, ["primera vez", "primerizo", "primeriza"]),
    needsReservations: hasAny(normalized, ["reserva", "reservas", "restaurante", "restaurantes", "spa", "rooftop"]),
    needsTransfers: hasAny(normalized, ["aeropuerto", "traslado", "traslados", "transfer", "driver"]),
  };
}

function scoreKnowledge(entry, tokens) {
  const topicTokens = tokenize(entry.topics.join(" "));
  const summaryTokens = tokenize(entry.summary);
  const detailTokens = tokenize(entry.details.join(" "));

  return tokens.reduce((score, token) => {
    if (topicTokens.includes(token)) {
      return score + 5;
    }

    if (summaryTokens.includes(token)) {
      return score + 2;
    }

    if (detailTokens.includes(token)) {
      return score + 1;
    }

    return score;
  }, 0);
}

function loadKnowledgeStore() {
  if (knowledgeCache) {
    return knowledgeCache;
  }

  const payload = readStorage(KNOWLEDGE_KEY);

  if (payload && payload.version === KNOWLEDGE_VERSION && Array.isArray(payload.items)) {
    knowledgeCache = payload.items;
    return knowledgeCache;
  }

  const items = buildKnowledgeSeed();
  writeStorage(KNOWLEDGE_KEY, { version: KNOWLEDGE_VERSION, items });
  knowledgeCache = items;
  return knowledgeCache;
}

function buildKnowledgeSeed() {
  return [
    {
      id: "plans-overview",
      topics: ["planes", "plan", "precios", "incluye", "whatsapp", "reservas", "traslados"],
      summary:
        "Brisa trabaja con tres niveles: uno para salir con el viaje claro, otro para acompañarte mientras viajas y otro para coordinar casi todo con más detalle.",
      details: [
        "El Básico es para ordenar la ruta y salir con buenas recomendaciones.",
        "El Experiencia entra mejor cuando quieres WhatsApp, reservas y ajustes en tiempo real.",
        "El VIP sirve más para aniversarios, viajes delicados o personas que quieren delegar mucho.",
      ],
    },
    {
      id: "zones-stay",
      topics: ["zona", "hospedaje", "hotel", "quedarme", "centro", "historico", "getsemani", "bocagrande"],
      summary:
        "La zona donde te quedas cambia muchísimo la experiencia del viaje, incluso si haces casi los mismos planes.",
      details: [
        "Centro Histórico funciona bien para caminar, salir a comer y vivir la parte más clásica de Cartagena.",
        "Getsemaní suele gustarle a quienes quieren más ambiente, movimiento y cercanía al lado más local.",
        "Bocagrande se siente práctico cuando priorizas comodidad, edificios modernos y salidas fáciles.",
      ],
    },
    {
      id: "first-time",
      topics: ["primera vez", "primerizo", "primeriza", "cartagena", "rosario"],
      summary:
        "Si es tu primera vez, normalmente conviene menos cantidad y mejor filtro: una base clara en la ciudad y uno o dos planes que sí valgan la pena.",
      details: [
        "Centro Histórico y Getsemaní suelen cubrir muy bien una primera lectura de la ciudad.",
        "Islas del Rosario puede entrar perfecto si no la metes a la fuerza en un viaje muy apretado.",
        "La primera visita se disfruta más cuando la logística viene resuelta desde antes.",
      ],
    },
    {
      id: "families",
      topics: ["familia", "familias", "niños", "niñas", "seguridad", "ritmo", "tranquilo"],
      summary:
        "En familia el viaje suele funcionar mejor con menos cambios de zona, horarios realistas y trayectos bien pensados.",
      details: [
        "Conviene evitar días demasiado cargados o con demasiados traslados.",
        "Reservar bien restaurantes y movimientos ayuda mucho cuando viajan niños.",
        "Para familias, la tranquilidad de la logística pesa casi tanto como el plan mismo.",
      ],
    },
    {
      id: "couples",
      topics: ["pareja", "parejas", "aniversario", "romantico", "rooftop", "cena"],
      summary:
        "En viajes de pareja suele valer más la calidad del ritmo que llenar la agenda por llenarla.",
      details: [
        "Una cena bien elegida y un rooftop correcto pesan más que meter demasiadas cosas el mismo día.",
        "Si es aniversario, los detalles y la coordinación previa elevan mucho la experiencia.",
        "Para pareja suele rendir mejor combinar intimidad, buena mesa y pocos movimientos.",
      ],
    },
    {
      id: "corporate",
      topics: ["corporativo", "trabajo", "ejecutivo", "negocio", "traslados"],
      summary:
        "En viaje corporativo lo que más se valora es una agenda limpia, traslados precisos y cero fricción.",
      details: [
        "Cuando el margen de tiempo es corto, la puntualidad pesa más que la exploración larga.",
        "Resolver zona, transporte y una o dos reservas clave ya cambia por completo la experiencia.",
      ],
    },
    {
      id: "airport-transfers",
      topics: ["aeropuerto", "traslado", "traslados", "transfer", "driver", "pick up"],
      summary:
        "La llegada al aeropuerto y los movimientos entre zonas son de los puntos donde más se nota una buena coordinación.",
      details: [
        "Si aterrizas cansado o vienes con niños, no vale la pena improvisar esa primera decisión.",
        "Los servicios premium de Cartagena suelen reforzar bastante la parte de transporte privado y llegadas resueltas.",
        "Tener ida y vuelta claras evita perder energía en momentos donde solo quieres llegar o salir sin líos.",
      ],
    },
    {
      id: "rosario-daytrip",
      topics: ["islas", "rosario", "barco", "daytrip", "playa"],
      summary:
        "Islas del Rosario funciona mejor como experiencia cuando la sacas bien armada desde antes, no como hueco improvisado.",
      details: [
        "Conviene revisar horarios, punto de salida y cómo queda el resto del día.",
        "Si el viaje es corto, Rosario necesita entrar en una ruta que no te rompa el ritmo.",
      ],
    },
    {
      id: "weather-flexibility",
      topics: ["lluvia", "clima", "cambio", "whatsapp", "ajustes"],
      summary:
        "La ventaja del acompañamiento no es solo recomendar cosas, sino poder mover el viaje cuando cambian las condiciones.",
      details: [
        "Si llueve, se puede cambiar el tono del día sin sentir que se perdió el plan.",
        "Mover reservas a tiempo vale mucho más que simplemente tener una lista de opciones.",
      ],
    },
    {
      id: "market-concierge-patterns",
      topics: ["concierge", "premium", "local", "soporte", "experto", "bilingue", "peace of mind"],
      summary:
        "Al revisar servicios similares en Cartagena se repiten siempre las mismas señales de valor: conocimiento local real, soporte cercano y coordinación entre hotel, transporte y experiencias.",
      details: [
        "Cartagena Group pone el peso en expertos locales que organizan alojamiento, transporte y experiencias para dar tranquilidad al viajero.",
        "Hi Cartagena insiste en servicio personalizado y conocimiento de Cartageneros locales, no planificación genérica.",
        "Eso confirma que tu producto gana cuando habla menos de información suelta y más de resolver el viaje completo.",
      ],
    },
    {
      id: "market-service-categories",
      topics: ["restaurantes", "beach clubs", "boats", "spa", "transportation", "nightlife", "categorias"],
      summary:
        "Otra señal útil del mercado local es que los catálogos fuertes agrupan la ciudad por momentos y necesidades reales del turista.",
      details: [
        "Everything Cartagena organiza la oferta en dining, transportation, beach clubs, boat rentals y wellness.",
        "Hi Cartagena mezcla tours, restaurantes, boat rentals, nightlife y concierge services en un mismo ecosistema.",
        "Para Brisa eso sirve mucho: responder por categorías reales, no con listas sueltas sin jerarquía.",
      ],
    },
    {
      id: "market-intake-signals",
      topics: ["fechas", "presupuesto", "personas", "estilo", "itinerario", "custom itinerary"],
      summary:
        "Los servicios mejor aterrizados suelen pedir pocos datos, pero los correctos, antes de recomendar nada.",
      details: [
        "Hi Cartagena pide número de personas, servicios buscados y otros detalles para cotizar mejor.",
        "Las experiencias con más conversión aterrizan fechas, tipo de grupo, presupuesto y tono del viaje desde el inicio.",
        "Por eso Brisa responde mejor cuando le cuentas días, perfil del viaje y qué tanto apoyo quieres.",
      ],
    },
    {
      id: "market-premium-execution",
      topics: ["priority", "reserved tables", "bilingual", "vip", "chef", "mixologist"],
      summary:
        "En la parte premium de Cartagena se repiten mucho las ideas de no-stress, prioridad y ejecución fina.",
      details: [
        "Hi Cartagena muestra señales de valor como guías bilingües, prioridad de entrada y mesas reservadas en salidas especiales.",
        "Ese tipo de detalle sube mucho la percepción del servicio en pareja, grupos y fechas importantes.",
        "Para Brisa, el valor no está en prometer lujo vacío sino en que el plan se sienta resuelto y sin fricción.",
      ],
    },
  ];
}

function restoreConversation() {
  const history = readStorage(HISTORY_KEY);

  if (Array.isArray(history) && history.length) {
    history.forEach((message) => renderMessage(message.role, message.content));
    return;
  }

  addMessage("assistant", replies.welcome);
  return;

  addMessage(
    "assistant",
    "Hola, soy Brisa. Cuéntame si vienes en pareja, con niños, por trabajo o si es tu primera vez en Cartagena, y te voy orientando.",
  );
}

function addMessage(role, content) {
  renderMessage(role, content);
  persistMessage(role, content);
}

function renderMessage(role, content) {
  const wrapper = document.createElement("article");
  wrapper.className = `message message-${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  wrapper.appendChild(bubble);
  chatLog.appendChild(wrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function persistMessage(role, content) {
  const history = readStorage(HISTORY_KEY);
  const safeHistory = Array.isArray(history) ? history : [];
  safeHistory.push({ role, content });
  writeStorage(HISTORY_KEY, safeHistory.slice(-14));
}

function readStorage(key) {
  if (!storageAvailable()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  if (!storageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures.
  }
}

function resolveOpeningSuggestions() {
  const conversation = getConversationContext();

  if (conversation.hasTripSignal) {
    return buildContextFollowUps(conversation.knownProfile);
  }

  return GREETING_SUGGESTIONS;
}

function getConversationContext(excludeLatestUser = false) {
  const history = getConversationHistory();
  const userMessages = history.filter((message) => message.role === "user");
  const previousUserMessages = excludeLatestUser ? userMessages.slice(0, -1) : userMessages;
  const previousUserText = previousUserMessages.map((message) => message.content).join(" ");
  const knownProfile = extractTripProfile(normalize(previousUserText));

  return {
    previousUserCount: previousUserMessages.length,
    knownProfile,
    hasTripSignal: hasTripSignal(previousUserText, knownProfile),
  };
}

function getConversationHistory() {
  const history = readStorage(HISTORY_KEY);
  return Array.isArray(history) ? history : [];
}

function hasTripSignal(text, profile) {
  if (!text.trim()) {
    return false;
  }

  if (
    profile.duration ||
    profile.family ||
    profile.couple ||
    profile.anniversary ||
    profile.corporate ||
    profile.firstTime ||
    profile.needsReservations ||
    profile.needsTransfers
  ) {
    return true;
  }

  return tokenize(text).some((token) => domainKeywords.includes(token));
}

function storageAvailable() {
  try {
    const testKey = "__brisa_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGreeting(value) {
  return /^(hola|buenas|hey|ey|holi|que puedes hacer|ayuda|buenos dias|buenas tardes|buenas noches)\b/.test(
    value,
  );
}

function isOffTopic(value) {
  return offTopicPatterns.some((pattern) => pattern.test(value));
}

function hasAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}
