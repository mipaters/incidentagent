const views = ["overview", "investigation", "architecture", "report", "outcome"];
const viewNames = {
  overview: "Overview",
  investigation: "Investigation",
  architecture: "Architecture",
  report: "Board report",
  outcome: "Outcome"
};

const scenarios = {
  network: {
    id: "INV-4471",
    title: "Sensitive Fiber Network Design Document Shared Outside Organization",
    summary: "A confidential engineering document was downloaded and forwarded to an external vendor domain.",
    events: [
      ["10:14 AM", "Document created", "A new fiber network design was created in the restricted Engineering SharePoint library."],
      ["10:26 AM", "Document edited", "The document was updated with infrastructure plans and vendor specifications."],
      ["11:32 AM", "Meeting discussed", "A Teams meeting referenced the upcoming vendor review and network design."],
      ["2:17 PM", "Document downloaded", "An employee downloaded the classified design document to a managed device."],
      ["2:31 PM", "Shared externally", "The document was shared with a contact at vendor-partner.com."],
      ["2:35 PM", "Attachment opened", "The external recipient opened the shared document once."],
      ["2:36 PM", "Flagged by AI", "Purview and Defender signals identified a high-risk external share."],
      ["2:37 PM", "Investigation started", "InvestigationAI orchestrated 7 agents across 1,247 evidence sources."]
    ],
    score: "92",
    exposure: "1 external recipient",
    classification: "Highly confidential"
  },
  customer: {
    id: "INV-4468",
    title: "Customer Service Export Accessed Outside Approved Workflow",
    summary: "An unusually large customer support export was accessed from an unmanaged browser session.",
    events: [
      ["9:08 AM", "Export requested", "A customer service export was requested from the support analytics workspace."],
      ["9:12 AM", "Query expanded", "The query scope expanded beyond the employee's recent case assignments."],
      ["9:24 AM", "Export generated", "A file containing customer contact and service records was generated."],
      ["9:39 AM", "Session changed", "Identity telemetry recorded access from a new browser session."],
      ["9:42 AM", "File downloaded", "The export was downloaded from an unmanaged browser."],
      ["9:44 AM", "DLP alert raised", "Purview detected customer data in an unapproved download."],
      ["9:46 AM", "Access contained", "The download session was blocked and the export link expired."],
      ["9:48 AM", "Investigation started", "InvestigationAI correlated identity, endpoint and data access evidence."]
    ],
    score: "86",
    exposure: "1 unmanaged session",
    classification: "Confidential customer data"
  },
  insider: {
    id: "INV-4459",
    title: "Privileged Account Activity Outside Normal Access Patterns",
    summary: "A privileged account accessed sensitive engineering repositories outside its normal work pattern.",
    events: [
      ["7:42 PM", "Sign-in detected", "A privileged account authenticated outside its typical working hours."],
      ["7:45 PM", "New device observed", "Identity logs recorded a device not previously associated with the account."],
      ["7:51 PM", "Repository accessed", "The account opened a restricted engineering repository."],
      ["8:03 PM", "Bulk files viewed", "Endpoint telemetry recorded sequential access to sensitive files."],
      ["8:11 PM", "Privilege change", "A role elevation request was submitted outside the normal approval window."],
      ["8:13 PM", "Risk elevated", "Defender for Identity correlated the activity with unusual sign-in behavior."],
      ["8:16 PM", "Account contained", "The session was revoked pending security review."],
      ["8:19 PM", "Investigation started", "InvestigationAI began a cross-system privileged access review."]
    ],
    score: "78",
    exposure: "1 privileged account",
    classification: "Restricted engineering data"
  },
  ai: {
    id: "INV-4442",
    title: "Sensitive Business Context Detected in AI Prompt Activity",
    summary: "An employee prompt may include restricted project details in an AI-assisted workflow.",
    events: [
      ["1:04 PM", "Copilot session opened", "An employee started a work session in Microsoft 365 Copilot."],
      ["1:07 PM", "Prompt submitted", "A prompt included text drawn from a restricted project workspace."],
      ["1:07 PM", "Sensitivity detected", "Purview classified a portion of the prompt as internal project information."],
      ["1:08 PM", "Policy evaluated", "Data protection policies checked the prompt against approved AI use."],
      ["1:09 PM", "Response reviewed", "The generated response was checked for sensitive information."],
      ["1:11 PM", "Audit event recorded", "Copilot audit data preserved the prompt and policy decision."],
      ["1:14 PM", "Risk assessed", "No external sharing or downstream data exposure was detected."],
      ["1:16 PM", "Investigation started", "InvestigationAI opened a focused AI usage and policy review."]
    ],
    score: "41",
    exposure: "1 Copilot session",
    classification: "Internal project data"
  }
};

const answers = {
  "What happened?": "A confidential fiber network design was downloaded and shared with one external vendor contact. The recipient opened it once. The share was detected within six minutes and access has been revoked.",
  "Who accessed the document?": "The audit trail identifies one authorized employee as the person who downloaded and shared the document, and one external vendor contact who opened it. Their actions and timestamps are preserved in the evidence package.",
  "What was exposed?": "One highly confidential engineering design containing fiber network infrastructure plans and vendor specifications. No personal data was identified. Exposure was limited to one external recipient.",
  "Are regulators affected?": "No personal data was identified, so privacy notification obligations are not currently triggered. A critical-infrastructure review and the vendor NDA clause 7.2 should be assessed with Legal and Compliance.",
  "What should we do now?": "Keep the external share revoked, preserve the evidence package, notify Corporate Security and Legal, review the vendor NDA, and deploy the recommended engineering-IP DLP control."
};

const walkthroughSteps = ["purpose", "capabilities", "agents", "scenarios", "architecture"];
const walkthroughDialog = document.getElementById("walkthrough-dialog");
let walkthroughIndex = 0;
const eventDescription = document.getElementById("event-description");
const eventTime = document.getElementById("event-time");
const eventTitle = document.getElementById("event-title");
const timelineButtons = [...document.querySelectorAll(".timeline-event")];
const toast = document.getElementById("toast");
let selectedScenario = "network";
let playbackTimer;
let toastTimer;

function stopPlayback() {
  if (playbackTimer) window.clearInterval(playbackTimer);
  playbackTimer = undefined;
  const timelineButton = document.getElementById("play-timeline");
  timelineButton.innerHTML = '<span class="timeline-play-symbol">▷</span> Play timeline';
  const investigateButton = document.getElementById("run-investigation");
  investigateButton.disabled = false;
  investigateButton.innerHTML = '<span class="button-play">▷</span> Replay investigation';
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}

function setView(view) {
  if (!views.includes(view)) return;
  for (const name of views) {
    document.getElementById(`view-${name}`).hidden = name !== view;
  }
  document.querySelectorAll(".nav-item").forEach((item) => {
    const active = item.dataset.view === view;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  document.getElementById("crumb-current").textContent = viewNames[view];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectWalkthroughStep(step) {
  const index = walkthroughSteps.indexOf(step);
  if (index < 0) return;
  walkthroughIndex = index;
  document.querySelectorAll(".walkthrough-tile").forEach((tile) => {
    const selected = tile.dataset.walkthroughStep === step;
    tile.classList.toggle("selected", selected);
    tile.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  document.querySelectorAll(".walkthrough-detail").forEach((panel) => {
    panel.hidden = panel.dataset.walkthroughPanel !== step;
  });
  document.getElementById("walkthrough-progress-label").textContent =
    `CHAPTER ${index + 1} OF ${walkthroughSteps.length}`;
  document.getElementById("walkthrough-previous").disabled = index === 0;
  const next = document.getElementById("walkthrough-next");
  next.innerHTML = index === walkthroughSteps.length - 1
    ? "Finish walkthrough <span>✓</span>"
    : "Next chapter <span>→</span>";
}

function selectEvent(index) {
  const event = scenarios[selectedScenario].events[index];
  if (!event) return;
  timelineButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === index);
    button.classList.toggle("done", buttonIndex <= index);
    button.setAttribute("aria-pressed", buttonIndex === index ? "true" : "false");
  });
  eventTime.textContent = `${event[0]} · EVENT ${index + 1} OF ${scenarios[selectedScenario].events.length}`;
  eventTitle.textContent = event[1];
  eventDescription.textContent = event[2];
}

function selectScenario(name) {
  const scenario = scenarios[name];
  if (!scenario) return;
  selectedScenario = name;
  document.querySelectorAll(".scenario-chip").forEach((button) => {
    const selected = button.dataset.scenario === name;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  document.getElementById("incident-title").textContent = scenario.title;
  document.getElementById("incident-summary").textContent = scenario.summary;
  document.querySelector(".incident-meta .mono").textContent = scenario.id;
  document.querySelector(".risk-score b").textContent = scenario.score;
  document.querySelector(".risk-meter span").style.width = `${scenario.score}%`;
  document.querySelectorAll(".impact-detail div")[0].querySelector("strong").innerHTML =
    `<i class="classification-dot"></i> ${scenario.classification}`;
  document.querySelectorAll(".impact-detail div")[1].querySelector("strong").textContent = scenario.exposure;
  timelineButtons.forEach((button, index) => {
    const event = scenario.events[index];
    const title = button.querySelector("strong");
    title.textContent = event[1];
    button.querySelector("time").textContent = event[0];
  });
  selectEvent(scenario.events.length - 1);
  notify(`${scenario.id} loaded · evidence view updated`);
}

function appendChatMessage(text, isUser) {
  const messages = document.getElementById("chat-messages");
  const article = document.createElement("div");
  article.className = `chat-message ${isUser ? "user-message" : "agent-message"}`;
  if (!isUser) {
    const icon = document.createElement("span");
    icon.className = "chat-avatar";
    icon.textContent = "✳";
    article.append(icon);
  }
  const content = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = isUser ? "YOU" : "INVESTIGATION COPILOT";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  content.append(label, paragraph);
  article.append(content);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}

function askCopilot(question) {
  if (!question.trim()) return;
  appendChatMessage(question.trim(), true);
  const response = answers[question.trim()] ??
    `I found relevant evidence for ${scenarios[selectedScenario].id}. The investigation linked the event to ${scenarios[selectedScenario].exposure.toLowerCase()}. Review the timeline and compliance dashboard for source-backed details.`;
  window.setTimeout(() => appendChatMessage(response, false), 250);
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);

  const walkthroughTile = event.target.closest("[data-walkthrough-step]");
  if (walkthroughTile) selectWalkthroughStep(walkthroughTile.dataset.walkthroughStep);

  const walkthroughScenario = event.target.closest("[data-walkthrough-scenario]");
  if (walkthroughScenario) {
    selectScenario(walkthroughScenario.dataset.walkthroughScenario);
    setView("investigation");
    walkthroughDialog.close();
  }

  if (event.target.closest("[data-close-walkthrough]")) walkthroughDialog.close();

  const scenarioButton = event.target.closest("[data-scenario]");
  if (scenarioButton) selectScenario(scenarioButton.dataset.scenario);

  const timelineButton = event.target.closest("[data-event]");
  if (timelineButton) selectEvent(Number(timelineButton.dataset.event));

  const questionButton = event.target.closest("[data-question]");
  if (questionButton) askCopilot(questionButton.dataset.question);

  if (event.target.closest("[data-print]")) window.print();
});

document.getElementById("open-walkthrough").addEventListener("click", () => {
  selectWalkthroughStep("purpose");
  walkthroughDialog.showModal();
});

document.getElementById("close-walkthrough").addEventListener("click", () => walkthroughDialog.close());

document.getElementById("walkthrough-previous").addEventListener("click", () => {
  selectWalkthroughStep(walkthroughSteps[walkthroughIndex - 1]);
});

document.getElementById("walkthrough-next").addEventListener("click", () => {
  if (walkthroughIndex === walkthroughSteps.length - 1) {
    walkthroughDialog.close();
    return;
  }
  selectWalkthroughStep(walkthroughSteps[walkthroughIndex + 1]);
});

walkthroughDialog.addEventListener("click", (event) => {
  if (event.target === walkthroughDialog) walkthroughDialog.close();
});

document.getElementById("chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("chat-input");
  const question = input.value;
  if (!question.trim()) return;
  input.value = "";
  askCopilot(question);
});

document.getElementById("play-timeline").addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (playbackTimer) {
    stopPlayback();
    return;
  }
  stopPlayback();
  let index = 0;
  selectEvent(index);
  button.innerHTML = '<span class="timeline-play-symbol">Ⅱ</span> Pause timeline';
  playbackTimer = window.setInterval(() => {
    index += 1;
    if (index >= scenarios[selectedScenario].events.length) {
      stopPlayback();
      return;
    }
    selectEvent(index);
  }, 1100);
});

document.getElementById("run-investigation").addEventListener("click", (event) => {
  const button = event.currentTarget;
  stopPlayback();
  button.disabled = true;
  button.innerHTML = '<span class="button-play">◌</span> Agents reviewing evidence…';
  const firstEvent = 0;
  selectEvent(firstEvent);
  let index = firstEvent;
  playbackTimer = window.setInterval(() => {
    index += 1;
    if (index >= scenarios[selectedScenario].events.length) {
      stopPlayback();
      notify(`${scenarios[selectedScenario].id} · all investigation agents complete`);
      return;
    }
    selectEvent(index);
  }, 480);
});

document.querySelectorAll(".scenario-chip").forEach((button) => {
  button.setAttribute("aria-pressed", button.classList.contains("selected") ? "true" : "false");
});
timelineButtons.forEach((button, index) => button.setAttribute("aria-pressed", index === 7 ? "true" : "false"));
document.querySelectorAll(".nav-item").forEach((button) => {
  if (button.classList.contains("active")) button.setAttribute("aria-current", "page");
});
