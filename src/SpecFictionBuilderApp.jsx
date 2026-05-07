import React, { useEffect, useMemo, useRef, useState } from "react";

const MAX_WORDS = 700;

const FIRST_100_MODEL =
  "The stars vanished one by one. Jenna stood watch. Her gaze lingered skyward, tracing the slow fade of each celestial point. Cold seeped through her sweater, and she drew it tight across her chest. She turned then, retreating into the dim warmth of her caravan. Inside, she rummaged. The wooden box on the counter held little — a few teabags among scattered odds. She chose one. The kettle she filled and set to boil. Candlelight soon flickered, casting lonely shadows across the cramped space. She sank into her chair, the worn pages of an obscure novel between her fingers. The words were quiet — silent company against the growing darkness outside.";

const SETTING_MODEL =
  "The world lay barren, draped in a cloak of ash and silence. A skeletal cityscape, once bustling, now whispered stories of decay under a sunless sky. Wind sifted through broken streets, carrying the scent of rust and forgotten rains. In the distance, a lone tower, half-collapsed, stood defiant against the creeping fog that swallowed edges and blurred lines. The air was cold, biting, filled with the taste of metal and despair. Not a soul stirred, but somewhere, hidden and watchful, eyes gleamed briefly in the shadow, reflecting a world forever changed.";

const FLASHBACK_MODEL =
  "He remembered a time before the grey skies, when laughter filled the air and children played under the warmth of a golden sun. The park was alive then, with the sound of music and the clatter of picnic baskets. He could still smell the sweet scent of summer grass and fresh lemonade. A dog barked in the distance, chasing the fluttering butterflies. But that world slipped away like sand through fingers, leaving only echoes in his mind, each memory fading like an old photograph, its colours washed away by time and sorrow.";

const WEAK_WORDS = {
  went: "crept, retreated, hurried, stumbled, fled",
  go: "creep, hurry, cross, enter, escape",
  got: "seized, collected, received, became, understood",
  get: "seize, collect, receive, become, understand",
  came: "arrived, entered, emerged, returned, approached",
  come: "arrive, enter, emerge, return, approach",
  saw: "noticed, glimpsed, spotted, watched, studied",
  see: "notice, glimpse, spot, watch, study",
  looked: "stared, glanced, peered, scanned, glared",
  look: "stare, glance, peer, scan, glare",
  heard: "caught, detected, listened to, recognised",
  hear: "catch, detect, listen to, recognise",
  knew: "understood, recognised, suspected, remembered",
  know: "understand, recognise, suspect, remember",
  thought: "wondered, suspected, remembered, realised",
  think: "wonder, suspect, consider, realise",
  decided: "chose, resolved, committed, refused",
  decide: "choose, resolve, commit, refuse",
  realised: "understood, recognised, discovered, noticed",
  realized: "understood, recognised, discovered, noticed",
  felt: "sensed, endured, noticed, carried",
  feel: "sense, endure, notice, carry",
  said: "whispered, muttered, warned, snapped, asked",
  say: "whisper, mutter, warn, snap, ask",
  made: "created, shaped, forced, caused, triggered",
  make: "create, shape, force, cause, trigger",
  put: "placed, set, lowered, tucked, pressed",
  did: "completed, attempted, performed, caused",
  do: "complete, attempt, perform, cause",
  took: "grabbed, lifted, carried, stole, accepted",
  take: "grab, lift, carry, steal, accept",
  wanted: "needed, longed, hoped, planned",
  want: "need, long, hope, plan",
  started: "began only if needed; often cut it and use the main verb",
  began: "often cut it and use the main verb",
  very: "cut or replace with a precise word",
  really: "cut or replace with a precise word",
  just: "usually cut",
  then: "use sparingly; often cut",
  suddenly: "use sparingly; show the sudden action instead"
};

const IGNORE_REPEATS = new Set([
  "about", "above", "after", "again", "against", "along", "also", "away", "because", "before", "below", "between", "could", "down", "each", "even", "every", "from", "have", "into", "just", "like", "more", "most", "only", "other", "over", "same", "some", "than", "that", "their", "them", "then", "there", "these", "they", "this", "through", "under", "very", "were", "what", "when", "where", "which", "while", "with", "would", "your"
]);

const WEAK_START_WORDS = new Set([
  "the",
  "it",
  "a",
  "an",
  "he",
  "she",
  "his",
  "her",
  "this",
  "these",
  "those",
  "they",
  "then",
  "there",
  "suddenly"
]);

const PLANNING_STEP_IDS = new Set(["idea", "plan", "first100", "setting", "flashback"]);

const PLANNING_EMAIL_DISMISSED_KEY = "specficPlanningEmailDismissed";

const STORY_SECTIONS = [
  {
    id: "opening",
    title: "Opening / First 100 Words",
    target: "80–110 words",
    help: "Hook the reader. Introduce the protagonist and the strange problem.",
    placeholder: "Start with one sharp speculative image. Example: The stars vanished one by one. Then show your protagonist doing something small and believable."
  },
  {
    id: "setting",
    title: "Setting / Changed World",
    target: "90–130 words",
    help: "Show what has changed through atmosphere, sensory detail and threat.",
    placeholder: "Describe the changed world. What can be seen, heard, smelled, felt or tasted? Add one small sign that something is wrong."
  },
  {
    id: "problem",
    title: "Problem Gets Worse",
    target: "120–160 words",
    help: "Make the speculative change harder to ignore. Force the character to react.",
    placeholder: "What happens that makes the problem immediate? What does the protagonist notice, lose, discover or fear?"
  },
  {
    id: "flashback",
    title: "Flashback / What Was Lost",
    target: "80–120 words",
    help: "Contrast the changed present with the world before.",
    placeholder: "Use a short memory. Show warmth, normality or safety from before the change, then return to the present."
  },
  {
    id: "climax",
    title: "Climax / Hard Choice",
    target: "140–180 words",
    help: "Force the protagonist to make one clear choice under pressure.",
    placeholder: "What choice must your protagonist make? What do they risk? What action changes the ending?"
  },
  {
    id: "ending",
    title: "Ending / Final Image",
    target: "60–100 words",
    help: "Finish with an image, consequence or unsettling question.",
    placeholder: "Do not explain everything. Leave the reader with one strong final image."
  }
];

const STEPS = [
  {
    id: "idea",
    title: "1. Ideation",
    short: "Find the strange change.",
    tute:
      "Speculative fiction begins when one rule of the real world changes. Keep the idea simple: one protagonist, one changed world, one problem that gets worse. The stranger the world becomes, the more human the character should feel.",
    modelTitle: "Premise model",
    model:
      "The stars are disappearing one by one. Jenna lives alone in a caravan and watches the sky each night. When the last stars begin to vanish, her quiet routine becomes a warning: something outside the caravan is changing, and she may be the only one still paying attention.",
    breakdown: [
      "Normal world: Jenna lives quietly in a caravan.",
      "Speculative change: the stars vanish one by one.",
      "Personal pressure: the change reaches her private life, not just the sky.",
      "Story question: what happens when the darkness comes closer?"
    ],
    prompts: [
      "What ordinary place will your story begin in?",
      "What strange rule has changed?",
      "Why does this matter to your protagonist today?",
      "What mystery or danger will pull the reader forward?"
    ]
  },
  {
    id: "plan",
    title: "2. 700-Word Plan",
    short: "Build the story spine.",
    tute:
      "A 700-word story needs a tight plan. Do not write a whole movie. Write one short sequence where the character faces a strange change and makes one important choice.",
    modelTitle: "Suggested word budget",
    model:
      "Opening: 80–110 words. Setting/world: 90–130 words. Problem worsens: 120–160 words. Flashback/contrast: 80–120 words. Climax choice: 140–180 words. Final image: 60–100 words.",
    breakdown: [
      "Opening: hook the reader with pressure or mystery.",
      "Setting: show the changed world through details.",
      "Problem: make the strange change harder to ignore.",
      "Flashback: show what has been lost or changed.",
      "Climax: force the protagonist to act.",
      "Ending: finish with a strong image, not a giant explanation."
    ],
    prompts: [
      "What is the first image?",
      "What problem gets worse?",
      "What memory or flashback will contrast the present?",
      "What hard choice will the protagonist make?",
      "What final image will stay with the reader?"
    ]
  },
  {
    id: "first100",
    title: "3. First 100 Words",
    short: "Open with atmosphere and control.",
    tute:
      "The first 100 words should create mood, introduce the protagonist, and hint at the speculative problem. Notice how the model uses short sentences, precise actions, sensory detail, and a final quiet image.",
    modelTitle: "First 100 words exemplar",
    model: FIRST_100_MODEL,
    breakdown: [
      "Short hook: ‘The stars vanished one by one.’",
      "Character focus: Jenna stands watch before she moves inside.",
      "Controlled actions: stood, lingered, drew, turned, retreated, rummaged, chose, filled, set.",
      "Atmosphere: cold, dim warmth, candlelight, lonely shadows.",
      "Final image: the novel becomes silent company against the darkness."
    ],
    prompts: [
      "Begin with one sharp speculative image.",
      "Show the protagonist doing something small and believable.",
      "Use 2–3 sensory details.",
      "Let the final sentence deepen the mood."
    ]
  },
  {
    id: "setting",
    title: "4. Setting",
    short: "Show the changed world.",
    tute:
      "The setting should do more than describe a place. It should reveal the speculative change. Use decay, atmosphere, sensory detail, and one small sign that something is watching, waiting, or wrong.",
    modelTitle: "Setting exemplar",
    model: SETTING_MODEL,
    breakdown: [
      "Big image: barren world, ash, silence.",
      "Changed civilisation: skeletal cityscape, decay, sunless sky.",
      "Sensory detail: rust, forgotten rains, cold, metal taste.",
      "Movement: wind sifts, fog swallows, edges blur.",
      "Threat: hidden eyes gleam in shadow."
    ],
    prompts: [
      "What has happened to the world?",
      "What physical details reveal the change?",
      "What can be seen, heard, smelled, felt, or tasted?",
      "What small detail hints at danger?"
    ]
  },
  {
    id: "flashback",
    title: "5. Flashback",
    short: "Show what was lost.",
    tute:
      "A flashback should be short and purposeful. It should contrast the changed present with the world before. Do not drift into a second story. Use the memory to make the present feel sadder, stranger, or more dangerous.",
    modelTitle: "Flashback exemplar",
    model: FLASHBACK_MODEL,
    breakdown: [
      "Clear time shift: ‘He remembered a time before…’",
      "Warm contrast: laughter, children, golden sun.",
      "Sensory detail: summer grass, lemonade, barking dog.",
      "Return to loss: the world slips away like sand.",
      "Emotional purpose: the memory makes the present feel emptier."
    ],
    prompts: [
      "What object, sound, smell, or image triggers the memory?",
      "What was the world like before the change?",
      "What specific warm detail can you include?",
      "How does the memory make the present worse?"
    ]
  },
  {
    id: "prostems",
    title: "6. Pro Sentences",
    short: "Use sentence moves deliberately.",
    tute:
      "Choose a few sentence patterns and adapt them to your story. The goal is not to show off. The goal is to control rhythm, detail, tension, and movement.",
    modelTitle: "Contextual ProStems",
    model:
      "These are complete patterns built around the vanished-stars / changed-world exemplar. Students can imitate the shape, then change the content for their own story.",
    breakdown: [
      "Quadruple Verbs: Retreating into the dim caravan, Jenna opened the wooden box, chose the final teabag, filled the kettle and waited for the dark to settle.",
      "Triple Descriptors: The ruined city whispered with its skeletal towers, ash-choked streets, and windows blackened by a sunless sky.",
      "Em Dash Descriptor: Every small sound — the hiss of the kettle, the scrape of paper — seemed louder beneath the starless sky.",
      "Many / Most: Many people had stopped watching the sky, though most still feared the dark creeping across their windows.",
      "Phrase Injector: Without warning, the last star flickered above the caravan, which left the night flat and endless.",
      "Double Hand Technique: With the old novel in one hand, and a trembling candle in the other, Jenna stepped toward the caravan door.",
      "Fancy Colour: Beyond the cracked glass, the iron grey fog swallowed the road beside the caravan.",
      "Adverb Metaphor: Slowly, the darkness spread like ink soaking through thin paper.",
      "Personification / Sound: The caravan groaned like something tired of standing, its thin walls shivering in the wind.",
      "Choosing Verbs: The candlelight flickered across the walls, casting lonely shadows over the cramped space."
    ],
    prompts: [
      "Choose 4–6 sentence patterns to use in your story.",
      "Change the nouns so they belong to your protagonist and setting.",
      "Keep the sentence useful. Do not add a fancy sentence if it slows the story.",
      "Use at least one sentence for movement, one for setting, and one for tension."
    ]
  },
  {
    id: "upgrade",
    title: "7. Upgrade Words",
    short: "Replace weak writing.",
    tute:
      "When the draft is finished, upgrade weak verbs in context. Do not just swap words randomly. Choose verbs that match the mood, movement, and pressure of the scene.",
    modelTitle: "Contextual upgrades",
    model:
      "Weak: Jenna went into the caravan and looked at the box. Better: Jenna retreated into the caravan and rummaged through the wooden box. Stronger verbs make the action clearer and the mood heavier.",
    breakdown: [
      "went → retreated, crossed, crept, hurried, stumbled, drifted, fled",
      "looked → stared, glanced, studied, traced, watched, peered, scanned",
      "got → seized, collected, received, became, understood, retrieved",
      "saw → noticed, glimpsed, spotted, recognised, observed, caught sight of",
      "heard → caught, detected, listened to, recognised",
      "knew → understood, recognised, suspected, remembered",
      "decided → chose, resolved, committed, refused",
      "realised → understood, recognised, discovered, noticed",
      "said → whispered, muttered, warned, snapped, breathed, asked",
      "felt → sensed, carried, endured, noticed, recognised",
      "made → shaped, caused, forced, built, created, triggered",
      "put → placed, set, lowered, tucked, pressed",
      "nice/good/bad → precise description: warm, brittle, hollow, spoiled, dangerous, ordinary, unfamiliar",
      "Cut or question: really, very, just, then, suddenly, started to, began to, there was, it was"
    ],
    prompts: [
      "Find five weak verbs in your draft.",
      "Replace them with verbs that match the atmosphere.",
      "Cut three filler words or phrases.",
      "Check that every upgraded word still sounds natural."
    ]
  },
  {
    id: "devices",
    title: "8. Devices",
    short: "Add control, not clutter.",
    tute:
      "Use literary devices to sharpen meaning. Do not overload the story. A few controlled devices are better than a pile of obvious ones.",
    modelTitle: "Useful devices for this task",
    model:
      "The strongest devices for a short speculative piece are symbolism, contrast, personification, motif, metaphor, foreshadowing, and sensory imagery.",
    breakdown: [
      "Symbol: the disappearing stars represent fading hope or knowledge.",
      "Contrast: warm caravan / cold darkness outside.",
      "Motif: stars, candlelight, darkness, silence.",
      "Personification: the fog swallowed edges and blurred lines.",
      "Foreshadowing: hidden eyes gleam briefly in the shadow.",
      "Sensory imagery: cold, rust, metal taste, candlelight, ash."
    ],
    prompts: [
      "What object or image repeats in your story?",
      "What does it symbolise?",
      "Where can you add foreshadowing?",
      "Where can contrast make the world feel changed?"
    ]
  },
  {
    id: "checklist",
    title: "9. Final Check",
    short: "Polish before submission.",
    tute:
      "Use the final check after drafting. Focus on story quality first, then expression, then accuracy. A polished story should feel complete even though it is short.",
    modelTitle: "Final test",
    model:
      "A strong speculative fiction story creates a believable world, changes one important rule, follows one protagonist, builds tension, and ends with a final image that leaves the reader thinking.",
    breakdown: [
      "Character and setting: clear protagonist, vivid changed world.",
      "Ideas: one strong speculative concept, not a random disaster.",
      "Devices: symbolism, contrast, imagery, motif or foreshadowing.",
      "Plot: problem worsens and leads to a choice.",
      "Cohesion: events connect clearly.",
      "Vocabulary: precise verbs and specific nouns.",
      "Accuracy: grammar, spelling, punctuation, paragraphing.",
      "Word count: under 700 words."
    ],
    prompts: [
      "Have I opened with pressure or mystery?",
      "Does my setting show the speculative change?",
      "Does my flashback contrast past and present?",
      "Have I used 4–6 strong sentence techniques?",
      "Have I upgraded weak verbs?",
      "Is my ending a strong image rather than a rushed explanation?"
    ]
  }
];

const AUTOSAVE_KEY = "specficDraftAutosave";
const AUTOSAVE_VERSION = 1;
const ACTIVITY_LOG_MAX = 4000;

function formatActivityDateTime(ts) {
  const d = new Date(ts);
  const datePart = d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const timePart = d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit"
  });
  return `${datePart}, ${timePart}`;
}

let loadPersistedWorkCache;
let loadPersistedWorkCacheSet = false;

function loadPersistedWork() {
  if (loadPersistedWorkCacheSet) return loadPersistedWorkCache;
  loadPersistedWorkCacheSet = true;
  if (typeof localStorage === "undefined") {
    loadPersistedWorkCache = null;
    return null;
  }
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) {
      loadPersistedWorkCache = null;
      return null;
    }
    const data = JSON.parse(raw);
    if (!data || data.v !== AUTOSAVE_VERSION || typeof data.sectionDrafts !== "object" || !data.sectionDrafts) {
      loadPersistedWorkCache = null;
      return null;
    }
    const sectionDrafts = STORY_SECTIONS.reduce((acc, section) => {
      const v = data.sectionDrafts[section.id];
      acc[section.id] = typeof v === "string" ? v : "";
      return acc;
    }, {});
    const promptResponses =
      data.promptResponses && typeof data.promptResponses === "object" && !Array.isArray(data.promptResponses)
        ? data.promptResponses
        : {};
    let activeStep = STEPS[0].id;
    if (typeof data.activeStep === "string" && STEPS.some((s) => s.id === data.activeStep)) {
      activeStep = data.activeStep;
    }
    let fontSize = 18;
    if (typeof data.fontSize === "number" && Number.isFinite(data.fontSize)) {
      fontSize = Math.min(24, Math.max(15, Math.round(data.fontSize)));
    }
    const savedAt = typeof data.savedAt === "number" && Number.isFinite(data.savedAt) ? data.savedAt : null;
    let integrity = null;
    if (data.integrity && typeof data.integrity === "object") {
      integrity = {
        entries: Array.isArray(data.integrity.entries) ? data.integrity.entries : []
      };
    }
    loadPersistedWorkCache = { sectionDrafts, promptResponses, activeStep, fontSize, savedAt, integrity };
    return loadPersistedWorkCache;
  } catch {
    loadPersistedWorkCache = null;
    return null;
  }
}

function buildFullExportText(sectionDraftsObj, promptResponsesObj) {
  const nl = String.fromCharCode(10);
  const planningStepsLocal = STEPS.filter((step) => PLANNING_STEP_IDS.has(step.id));
  const divider = `${nl}${nl}---${nl}${nl}`;
  const planning = planningStepsLocal
    .map((step) => {
      const answers = step.prompts
        .map((prompt, index) => {
          const answer = promptResponsesObj[`${step.id}-${index}`] || "";
          return `${prompt}${nl}${answer}`;
        })
        .join(`${nl}${nl}`);
      return `${step.title}${nl}${"=".repeat(step.title.length)}${nl}${answers}`;
    })
    .join(divider);
  const story = STORY_SECTIONS.map((section) => {
    const t = sectionDraftsObj[section.id] || "";
    return `--- ${section.title} ---${nl}${t}`;
  }).join(`${nl}${nl}`);
  return `=== PLANNING ===${nl}${planning}${nl}${nl}=== STORY DRAFT ===${nl}${story}`;
}

async function buildWorkDocxBlob(sectionDraftsObj, promptResponsesObj) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const children = [];
  const planningStepsLocal = STEPS.filter((step) => PLANNING_STEP_IDS.has(step.id));

  children.push(new Paragraph({ text: "SpecFic Builder — export", heading: HeadingLevel.TITLE }));
  children.push(new Paragraph(`Exported ${new Date().toLocaleString()}`));

  children.push(new Paragraph({ text: "Planning", heading: HeadingLevel.HEADING_1 }));
  for (const step of planningStepsLocal) {
    children.push(new Paragraph({ text: step.title, heading: HeadingLevel.HEADING_2 }));
    for (let i = 0; i < step.prompts.length; i++) {
      const prompt = step.prompts[i];
      const answer = promptResponsesObj[`${step.id}-${i}`] || "";
      children.push(new Paragraph({ children: [new TextRun({ text: prompt, bold: true })] }));
      const answerLines = answer.split(/\r?\n/);
      if (answerLines.length === 0 || (answerLines.length === 1 && answerLines[0] === "")) {
        children.push(new Paragraph({ text: " " }));
      } else {
        for (const line of answerLines) {
          children.push(new Paragraph(line.length ? line : " "));
        }
      }
    }
  }

  children.push(new Paragraph({ text: "Story draft", heading: HeadingLevel.HEADING_1 }));
  for (const section of STORY_SECTIONS) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }));
    const body = sectionDraftsObj[section.id] || "";
    const lines = body.split(/\r?\n/);
    if (lines.length === 1 && lines[0] === "") {
      children.push(new Paragraph({ text: " " }));
    } else {
      for (const line of lines) {
        children.push(new Paragraph(line.length ? line : " "));
      }
    }
  }

  const doc = new Document({
    title: "SpecFic draft",
    sections: [{ children }]
  });
  return Packer.toBlob(doc);
}

function countWords(text) {
  const matches = text.match(new RegExp("[A-Za-z0-9''-]+", "g"));
  return matches ? matches.length : 0;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getRepeatWords(text) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [];
  const repeated = new Set();
  let previous = new Set();

  sentences.forEach((sentence) => {
    const words = (sentence.toLowerCase().match(/[a-zA-Z''-]+/g) || [])
      .map((word) => word.replace(/^['']+|['']+$/g, ""))
      .filter((word) => word.length >= 4 && !IGNORE_REPEATS.has(word) && !WEAK_WORDS[word]);

    const currentCounts = new Map();
    words.forEach((word) => currentCounts.set(word, (currentCounts.get(word) || 0) + 1));

    currentCounts.forEach((count, word) => {
      if (count > 1 || previous.has(word)) repeated.add(word);
    });

    previous = new Set(words);
  });

  return repeated;
}

function getParagraphRanges(text) {
  const ranges = [];
  let start = 0;
  const re = /\n\s*\n+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    ranges.push({ start, end: m.index });
    start = m.index + m[0].length;
  }
  ranges.push({ start, end: text.length });
  return ranges;
}

function getWeakStartRanges(text) {
  const ranges = [];
  const paraRanges = getParagraphRanges(text);

  for (const { start: pStart, end: pEnd } of paraRanges) {
    if (pStart >= pEnd) continue;
    const paragraph = text.slice(pStart, pEnd);
    const sentences = paragraph.match(/[^.!?]+[.!?]*/g) || [];

    const flaggedRanges = [];
    let cursor = 0;

    for (const sentence of sentences) {
      const idx = paragraph.indexOf(sentence, cursor);
      if (idx === -1) continue;
      cursor = idx + sentence.length;

      const sentTrim = sentence.trimStart();
      if (!sentTrim) continue;
      const offsetInSent = sentence.length - sentTrim.length;
      const firstWordMatch = sentTrim.match(/^([A-Za-z0-9''-]+)/);
      if (!firstWordMatch) continue;
      const rawWord = firstWordMatch[1];
      const normalized = rawWord.toLowerCase().replace(/^['']+|['']+$/g, "");
      if (!WEAK_START_WORDS.has(normalized)) continue;

      const relWordStart = offsetInSent + sentTrim.indexOf(rawWord);
      const absStart = pStart + idx + relWordStart;
      const absEnd = absStart + rawWord.length;
      flaggedRanges.push({ start: absStart, end: absEnd });
    }

    if (flaggedRanges.length >= 3) {
      ranges.push(...flaggedRanges);
    }
  }

  return ranges;
}

function analyseText(text) {
  const lowerWords = (text.toLowerCase().match(/[a-zA-Z''-]+/g) || []).map((word) => word.replace(/^['']+|['']+$/g, ""));
  const weakHits = lowerWords.filter((word) => WEAK_WORDS[word]);
  const adverbHits = lowerWords.filter((word) => word.endsWith("ly") && word.length > 4);
  const repeatHits = Array.from(getRepeatWords(text));
  const weakStartRanges = getWeakStartRanges(text);

  return {
    weakHits: Array.from(new Set(weakHits)),
    adverbHits: Array.from(new Set(adverbHits)),
    repeatHits,
    weakStartIssue: weakStartRanges.length > 0
  };
}

function highlightText(text) {
  const repeatWords = getRepeatWords(text);
  const weakStartSpanSet = new Set(getWeakStartRanges(text).map((r) => `${r.start},${r.end}`));
  const parts = text.split(/([A-Za-z0-9''-]+)/g);

  let offset = 0;
  return parts
    .map((part) => {
      const partStart = offset;
      const partEnd = offset + part.length;
      offset = partEnd;

      const key = part.toLowerCase().replace(/^['']+|['']+$/g, "");
      if (!key) return escapeHtml(part);

      const isWeakStart = weakStartSpanSet.has(`${partStart},${partEnd}`);

      if (isWeakStart) {
        return `<mark class="rounded bg-cyan-500/35 text-cyan-100">${escapeHtml(part)}</mark>`;
      }

      if (WEAK_WORDS[key]) {
        return `<mark class="rounded bg-yellow-500/35 text-yellow-100">${escapeHtml(part)}</mark>`;
      }

      if (key.endsWith("ly") && key.length > 4) {
        return `<mark class="rounded bg-orange-500/35 text-orange-100">${escapeHtml(part)}</mark>`;
      }

      if (repeatWords.has(key)) {
        return `<mark class="rounded bg-pink-500/35 text-pink-100">${escapeHtml(part)}</mark>`;
      }

      return escapeHtml(part);
    })
    .join("");
}

function FlagSummary({ text }) {
  const analysis = analyseText(text);
  const total =
    analysis.weakHits.length +
    analysis.adverbHits.length +
    analysis.repeatHits.length +
    (analysis.weakStartIssue ? 1 : 0);

  if (!text.trim()) return null;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950 p-3 text-xs text-zinc-400">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-bold uppercase tracking-wide text-zinc-500">Draft flags</p>
        <p className={total ? "font-bold text-yellow-300" : "font-bold text-emerald-300"}>{total ? `${total} to check` : "Clear"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {analysis.weakStartIssue && (
          <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-100">
            Too many weak starts reduces the quality of your writing.
          </span>
        )}
        {analysis.weakHits.map((word) => (
          <span key={`weak-${word}`} className="rounded-full bg-yellow-500/20 px-2 py-1 text-yellow-100">
            Weak: {word} → {WEAK_WORDS[word]}
          </span>
        ))}
        {analysis.adverbHits.map((word) => (
          <span key={`adverb-${word}`} className="rounded-full bg-orange-500/20 px-2 py-1 text-orange-100">
            Adverb: {word}
          </span>
        ))}
        {analysis.repeatHits.map((word) => (
          <span key={`repeat-${word}`} className="rounded-full bg-pink-500/20 px-2 py-1 text-pink-100">
            Repeated nearby: {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function AutoGrowTextArea({ value, onChange, onBlur, placeholder, highlight = true, rows = 3 }) {
  const textareaRef = useRef(null);
  const highlighted = useMemo(() => (highlight ? highlightText(value) : escapeHtml(value)), [value, highlight]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, [value]);

  if (!highlight) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        spellCheck="true"
        className="w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-violet-400"
      />
    );
  }

  return (
    <div className="relative rounded-xl border border-white/10 bg-zinc-950 p-3">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words p-3 text-lg leading-relaxed text-white"
        dangerouslySetInnerHTML={{ __html: highlighted + (value.endsWith(String.fromCharCode(10)) ? "<br />" : "") }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        spellCheck="true"
        className="relative z-10 w-full resize-none overflow-hidden bg-transparent text-lg leading-relaxed text-transparent caret-white outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

export default function SpecFictionBuilderApp() {
  const [activeStep, setActiveStep] = useState(() => loadPersistedWork()?.activeStep ?? STEPS[0].id);
  const [sectionDrafts, setSectionDrafts] = useState(
    () => loadPersistedWork()?.sectionDrafts ?? STORY_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: "" }), {})
  );
  const [promptResponses, setPromptResponses] = useState(() => loadPersistedWork()?.promptResponses ?? {});
  const [planningEmailClicked, setPlanningEmailClicked] = useState(false);
  const [planningEmailPressedOnce, setPlanningEmailPressedOnce] = useState(false);
  const [confirmRemoveEmailUiOpen, setConfirmRemoveEmailUiOpen] = useState(false);
  const [planningEmailPermanentlyDismissed, setPlanningEmailPermanentlyDismissed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(PLANNING_EMAIL_DISMISSED_KEY) === "1"
  );
  const [fontSize, setFontSize] = useState(() => loadPersistedWork()?.fontSize ?? 18);
  const [lastAutosaveAt, setLastAutosaveAt] = useState(() => loadPersistedWork()?.savedAt ?? null);
  const [autosaveFailed, setAutosaveFailed] = useState(false);
  const [copyAllNotice, setCopyAllNotice] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const tuteScrollRef = useRef(null);
  const saveMenuRef = useRef(null);
  const importInputRef = useRef(null);
  const sectionDraftsRef = useRef(sectionDrafts);
  const promptResponsesRef = useRef(promptResponses);
  const activeStepRef = useRef(activeStep);
  const fontSizeRef = useRef(fontSize);
  const fieldLogTimersRef = useRef({});
  sectionDraftsRef.current = sectionDrafts;
  promptResponsesRef.current = promptResponses;
  activeStepRef.current = activeStep;
  fontSizeRef.current = fontSize;

  const integrityRef = useRef(null);
  if (integrityRef.current === null) {
    const persisted = loadPersistedWork();
    const existing = persisted?.integrity;
    const entries = Array.isArray(existing?.entries) ? [...existing.entries] : [];
    const lastLoggedByField = {};
    entries.forEach((entry) => {
      if (entry && typeof entry.fieldKey === "string" && typeof entry.text === "string") {
        lastLoggedByField[entry.fieldKey] = entry.text;
      }
    });
    integrityRef.current = { entries, lastLoggedByField };
  }

  const current = STEPS.find((step) => step.id === activeStep) || STEPS[0];
  const fullDraft = STORY_SECTIONS.map((section) => sectionDrafts[section.id]).join("\n\n");
  const wordCount = useMemo(() => countWords(fullDraft), [fullDraft]);
  const remaining = MAX_WORDS - wordCount;
  const progress = Math.min(100, Math.round((wordCount / MAX_WORDS) * 100));
  const overLimit = wordCount > MAX_WORDS;

  function buildPlanningFieldLabel(stepId, index) {
    const step = STEPS.find((s) => s.id === stepId);
    const stepName = step ? step.title.replace(/^\d+\.\s*/, "") : stepId;
    const prompt = step?.prompts?.[index] || `Prompt ${index + 1}`;
    return `${stepName} - ${prompt}`;
  }

  function logFieldSnapshot(fieldKey, fieldLabel, text) {
    const b = integrityRef.current;
    if (!b) return;
    const next = text || "";
    if (!next.trim()) return;
    if (b.lastLoggedByField[fieldKey] === next) return;
    b.entries.push({
      t: Date.now(),
      fieldKey,
      field: fieldLabel,
      text: next
    });
    b.lastLoggedByField[fieldKey] = next;
    while (b.entries.length > ACTIVITY_LOG_MAX) b.entries.shift();
  }

  function scheduleFieldLog(fieldKey, fieldLabel, text) {
    if (fieldLogTimersRef.current[fieldKey]) {
      window.clearTimeout(fieldLogTimersRef.current[fieldKey]);
    }
    fieldLogTimersRef.current[fieldKey] = window.setTimeout(() => {
      logFieldSnapshot(fieldKey, fieldLabel, text);
      delete fieldLogTimersRef.current[fieldKey];
    }, 2000);
  }

  function flushFieldLog(fieldKey, fieldLabel, text) {
    if (fieldLogTimersRef.current[fieldKey]) {
      window.clearTimeout(fieldLogTimersRef.current[fieldKey]);
      delete fieldLogTimersRef.current[fieldKey];
    }
    logFieldSnapshot(fieldKey, fieldLabel, text);
  }

  function updateSection(id, value) {
    setSectionDrafts((drafts) => ({ ...drafts, [id]: value }));
    const section = STORY_SECTIONS.find((s) => s.id === id);
    const label = section ? section.title : id;
    scheduleFieldLog(`story:${id}`, label, value);
  }

  function updatePromptResponse(stepId, index, value) {
    const key = `${stepId}-${index}`;
    setPlanningEmailClicked(false);
    setPromptResponses((responses) => ({ ...responses, [key]: value }));
    scheduleFieldLog(`planning:${stepId}:${index}`, buildPlanningFieldLabel(stepId, index), value);
  }

  const planningSteps = STEPS.filter((step) => PLANNING_STEP_IDS.has(step.id));
  const planningComplete = planningSteps.every((step) =>
    step.prompts.every((_, index) => (promptResponses[`${step.id}-${index}`] || "").trim().length > 0)
  );

  function buildPlanningEmailBody() {
    const nl = String.fromCharCode(10);
    const divider = `${nl}${nl}---${nl}${nl}`;

    return planningSteps
      .map((step) => {
        const answers = step.prompts
          .map((prompt, index) => {
            const answer = promptResponses[`${step.id}-${index}`] || "";
            return `${prompt}${nl}${answer}`;
          })
          .join(`${nl}${nl}`);

        return `${step.title}${nl}${"=".repeat(step.title.length)}${nl}${answers}`;
      })
      .join(divider);
  }

  function emailPlanning() {
    const subject = encodeURIComponent("Speculative Fiction Planning");
    const body = encodeURIComponent(buildPlanningEmailBody());
    setPlanningEmailClicked(true);
    setPlanningEmailPressedOnce(true);
    window.location.href = `mailto:achievewriting@gmail.com?subject=${subject}&body=${body}`;
  }

  function downloadBackupJson(filePrefix = "specfic-backup") {
    const payload = {
      v: AUTOSAVE_VERSION,
      exportedAt: Date.now(),
      sectionDrafts: sectionDraftsRef.current,
      promptResponses: promptResponsesRef.current,
      activeStep: activeStepRef.current,
      fontSize: fontSizeRef.current,
      integrity: {
        entries: integrityRef.current.entries
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function startNewStoryWithArchive() {
    const ok = window.confirm("Start a new story? Current work will be archived as a backup JSON first.");
    if (!ok) return;

    downloadBackupJson("specfic-archived-story");

    const emptySectionDrafts = STORY_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: "" }), {});
    setSectionDrafts(emptySectionDrafts);
    setPromptResponses({});
    setActiveStep(STEPS[0].id);
    setPlanningEmailClicked(false);
    setPlanningEmailPressedOnce(false);
    setPlanningEmailPermanentlyDismissed(false);
    setConfirmRemoveEmailUiOpen(false);
    setImportNotice("Started new story. Previous work archived.");
    window.setTimeout(() => setImportNotice(""), 3000);

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(PLANNING_EMAIL_DISMISSED_KEY);
      } catch {
        /* ignore storage errors */
      }
    }

    Object.keys(fieldLogTimersRef.current).forEach((fieldKey) => {
      window.clearTimeout(fieldLogTimersRef.current[fieldKey]);
    });
    fieldLogTimersRef.current = {};

    integrityRef.current = { entries: [], lastLoggedByField: {} };
  }

  async function saveWorkAsFile() {
    const dateStamp = new Date().toISOString().slice(0, 10);
    let blob;
    let baseName;
    let acceptTypes;

    try {
      blob = await buildWorkDocxBlob(sectionDraftsRef.current, promptResponsesRef.current);
      baseName = `specfic-draft-${dateStamp}.docx`;
      acceptTypes = [
        {
          description: "Word document",
          accept: { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }
        }
      ];
    } catch {
      const text = buildFullExportText(sectionDraftsRef.current, promptResponsesRef.current);
      blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
      baseName = `specfic-draft-${dateStamp}.txt`;
      acceptTypes = [
        {
          description: "Text file (opens in Word)",
          accept: { "text/plain": [".txt"] }
        }
      ];
    }

    if (typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: baseName,
          types: acceptTypes
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = baseName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyFullWork() {
    const text = buildFullExportText(sectionDraftsRef.current, promptResponsesRef.current);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        window.alert("Could not copy. Use Save as Word instead.");
        return;
      }
    }
    setCopyAllNotice(true);
    window.setTimeout(() => setCopyAllNotice(false), 2000);
  }

  function downloadIntegrityReport() {
    const b = integrityRef.current;
    if (!b) return;
    const lines = ["SpecFic Builder Activity Log", ""];
    b.entries.forEach((entry, index) => {
      lines.push(formatActivityDateTime(entry.t));
      lines.push(`Field: ${entry.field}`);
      lines.push("Typed:");
      lines.push(entry.text || "");
      if (index < b.entries.length - 1) {
        lines.push("", "---", "");
      }
    });
    const content = lines.join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `specfic-activity-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openImportBackupDialog() {
    setSaveMenuOpen(false);
    if (importInputRef.current) importInputRef.current.click();
  }

  async function importBackupJson(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.sectionDrafts || typeof data.sectionDrafts !== "object") {
        throw new Error("Invalid backup file");
      }

      const nextSectionDrafts = STORY_SECTIONS.reduce((acc, section) => {
        const v = data.sectionDrafts[section.id];
        acc[section.id] = typeof v === "string" ? v : "";
        return acc;
      }, {});
      const nextPromptResponses =
        data.promptResponses && typeof data.promptResponses === "object" && !Array.isArray(data.promptResponses)
          ? data.promptResponses
          : {};
      const nextActiveStep =
        typeof data.activeStep === "string" && STEPS.some((s) => s.id === data.activeStep) ? data.activeStep : STEPS[0].id;
      const nextFontSize =
        typeof data.fontSize === "number" && Number.isFinite(data.fontSize)
          ? Math.min(24, Math.max(15, Math.round(data.fontSize)))
          : 18;

      setSectionDrafts(nextSectionDrafts);
      setPromptResponses(nextPromptResponses);
      setActiveStep(nextActiveStep);
      setFontSize(nextFontSize);
      if (typeof data.savedAt === "number" && Number.isFinite(data.savedAt)) {
        setLastAutosaveAt(data.savedAt);
      }

      if (data.integrity && typeof data.integrity === "object" && Array.isArray(data.integrity.entries)) {
        const entries = [...data.integrity.entries];
        const lastLoggedByField = {};
        entries.forEach((entry) => {
          if (entry && typeof entry.fieldKey === "string" && typeof entry.text === "string") {
            lastLoggedByField[entry.fieldKey] = entry.text;
          }
        });
        integrityRef.current = { entries, lastLoggedByField };
      }
      setImportNotice(`Imported ${file.name}`);
      window.setTimeout(() => setImportNotice(""), 3000);
    } catch {
      window.alert("That backup JSON could not be imported.");
    }
  }

  function emailMyselfFullDraft() {
    const text = buildFullExportText(sectionDraftsRef.current, promptResponsesRef.current);
    const subject = encodeURIComponent("SpecFic — my draft");
    const prefix = `mailto:?subject=${subject}&body=`;
    const maxTotal = 1900;
    let body = text;
    let encoded = encodeURIComponent(body);
    if (prefix.length + encoded.length > maxTotal) {
      body =
        "Your full draft is too long for an automatic email link (browser limit). Nothing is lost.\n\n" +
        "Use Save as Word or Copy all in SpecFic Builder, then attach or paste into this email.\n\n" +
        "--- Start of draft (preview) ---\n" +
        text.slice(0, 700);
      encoded = encodeURIComponent(body);
    }
    window.location.href = prefix + encoded;
  }

  useEffect(() => {
    function flushAutosave() {
      const payload = {
        v: AUTOSAVE_VERSION,
        sectionDrafts: sectionDraftsRef.current,
        promptResponses: promptResponsesRef.current,
        activeStep: activeStepRef.current,
        fontSize: fontSizeRef.current,
        savedAt: Date.now(),
        integrity: {
          entries: integrityRef.current.entries
        }
      };
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        setLastAutosaveAt(payload.savedAt);
        setAutosaveFailed(false);
      } catch {
        setAutosaveFailed(true);
      }
    }

    flushAutosave();
    const intervalId = setInterval(flushAutosave, 2000);
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushAutosave();
      }
    }
    function onBeforeUnload() {
      flushAutosave();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!saveMenuOpen) return;
    function onDocMouseDown(event) {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target)) {
        setSaveMenuOpen(false);
      }
    }
    function onEscape(event) {
      if (event.key === "Escape") setSaveMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [saveMenuOpen]);

  useEffect(() => {
    return () => {
      Object.keys(fieldLogTimersRef.current).forEach((fieldKey) => {
        window.clearTimeout(fieldLogTimersRef.current[fieldKey]);
      });
      fieldLogTimersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (tuteScrollRef.current) {
      tuteScrollRef.current.scrollTop = 0;
    }
  }, [activeStep]);

  return (
    <main className="min-h-screen bg-[#10131f] text-white" style={{ fontSize }}>
      {confirmRemoveEmailUiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-email-dismiss-title"
          onClick={() => setConfirmRemoveEmailUiOpen(false)}
        >
          <div
            className="max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="confirm-email-dismiss-title" className="mb-6 text-center text-lg leading-relaxed text-zinc-100">
              Are you sure? Mr C is happy with your plan?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemoveEmailUiOpen(false)}
                className="rounded-xl border border-white/10 bg-zinc-800 px-5 py-2 text-sm font-bold text-white hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(PLANNING_EMAIL_DISMISSED_KEY, "1");
                  } catch {
                    /* ignore quota / private mode */
                  }
                  setPlanningEmailPermanentlyDismissed(true);
                  setPlanningEmailClicked(false);
                  setPlanningEmailPressedOnce(false);
                  setConfirmRemoveEmailUiOpen(false);
                }}
                className="rounded-xl border border-orange-400 bg-orange-600 px-5 py-2 text-sm font-bold text-white hover:bg-orange-500"
              >
                Yes, I&apos;m sure
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#10131f]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex min-w-fit items-baseline gap-3">
            <h1 className="text-2xl font-black tracking-tight">SpecFic Builder</h1>
            <p className="text-sm text-zinc-400">Year 9 speculative fiction — up to 700 words</p>
          </div>

          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <p className="max-w-[10rem] text-right text-xs leading-tight text-zinc-500 sm:max-w-none">
              {autosaveFailed ? (
                <span className="text-amber-400">Could not autosave — try Save as Word or backup JSON.</span>
              ) : lastAutosaveAt ? (
                <span>
                  Autosaved{" "}
                  {new Date(lastAutosaveAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
              ) : (
                <span>Autosave every 2s</span>
              )}
            </p>
            {importNotice ? <p className="text-xs text-emerald-300">{importNotice}</p> : null}
            <div className="relative" ref={saveMenuRef}>
              <button
                type="button"
                aria-label="Open save menu"
                title="Save/Export/Import options"
                onClick={() => setSaveMenuOpen((open) => !open)}
                className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-sm font-black text-zinc-200 hover:bg-zinc-800"
              >
                ⚙
              </button>
              {saveMenuOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      saveWorkAsFile();
                      setSaveMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Save as Word
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      copyFullWork();
                      setSaveMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    {copyAllNotice ? "Copy all (copied)" : "Copy all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      emailMyselfFullDraft();
                      setSaveMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Email me
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadIntegrityReport();
                      setSaveMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Activity log
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadBackupJson();
                      setSaveMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Backup JSON
                  </button>
                  <button
                    type="button"
                    onClick={openImportBackupDialog}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    Import backup JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startNewStoryWithArchive();
                      setSaveMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-orange-200 hover:bg-zinc-800"
                  >
                    New Story (archive current)
                  </button>
                </div>
              )}
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={importBackupJson}
              className="hidden"
            />
            <button
              onClick={() => setFontSize((size) => Math.max(15, size - 1))}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-sm font-bold hover:bg-zinc-800"
            >
              A−
            </button>
            <span className="w-12 text-center text-sm text-zinc-400">{fontSize}px</span>
            <button
              onClick={() => setFontSize((size) => Math.min(24, size + 1))}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1 text-sm font-bold hover:bg-zinc-800"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      <div className="grid h-[calc(100vh-65px)] grid-cols-[44%_56%] gap-4 p-4">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-400/20 bg-slate-900 shadow-xl shadow-black/30">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-violet-800 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">Tutor / Reference</p>
              <h2 className="text-xl font-black">{current.title}</h2>
              <p className="text-sm text-white/80">{current.short}</p>
            </div>
            {planningComplete && !planningEmailPermanentlyDismissed && (
              <div
                className={`shrink-0 flex items-stretch overflow-hidden rounded-xl border shadow-lg ${
                  planningEmailClicked
                    ? "border-zinc-600 bg-zinc-800"
                    : "border-orange-300 bg-orange-500"
                }`}
              >
                <button
                  type="button"
                  onClick={emailPlanning}
                  className={
                    planningEmailClicked
                      ? "px-4 py-2 text-sm font-black text-zinc-300 hover:bg-zinc-700"
                      : "px-4 py-2 text-sm font-black text-white hover:bg-orange-400"
                  }
                >
                  Good job. Email Mr C
                </button>
                {planningEmailPressedOnce && !confirmRemoveEmailUiOpen && (
                  <button
                    type="button"
                    aria-label="Clear sent state"
                    onClick={() => setConfirmRemoveEmailUiOpen(true)}
                    className={
                      planningEmailClicked
                        ? "border-l border-zinc-600 px-3 py-2 text-sm font-black leading-none text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        : "border-l border-orange-400/40 px-3 py-2 text-sm font-black leading-none text-white hover:bg-orange-400"
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-slate-400/20 bg-slate-800/80 p-3">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`rounded-xl px-3 py-2 text-left text-xs font-bold leading-tight transition ${
                  activeStep === step.id ? "bg-violet-600 text-white" : "bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>

          <div
            ref={tuteScrollRef}
            className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(139,92,246,0.55)_rgba(30,41,59,0.45)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-500/60 [&::-webkit-scrollbar-thumb:hover]:bg-violet-400/80"
          >
            <section className="mb-5 rounded-2xl border border-slate-400/20 bg-slate-800/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">What to do</p>
              <p className="leading-relaxed text-zinc-100">{current.tute}</p>
            </section>

            <section className="mb-5 rounded-2xl border border-violet-500/30 bg-violet-950/30 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-300">{current.modelTitle}</p>
              <p className="whitespace-pre-line leading-relaxed text-violet-100">{current.model}</p>
            </section>

            <section className="mb-5 rounded-2xl border border-slate-400/20 bg-slate-800/70 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-500">Why it works</p>
              <div className="space-y-2">
                {current.breakdown.map((item, index) => (
                  <div key={index} className="rounded-xl bg-zinc-950 p-3 text-zinc-200">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {PLANNING_STEP_IDS.has(current.id) && (
              <section className="rounded-2xl border border-slate-400/20 bg-slate-800/70 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-500">Planning responses</p>
                <div className="space-y-3">
                  {current.prompts.map((prompt, index) => {
                    const key = `${current.id}-${index}`;
                    return (
                      <div key={key} className="rounded-xl bg-zinc-950 p-3">
                        <p className="mb-2 text-sm leading-snug text-zinc-200">{prompt}</p>
                        <AutoGrowTextArea
                          value={promptResponses[key] || ""}
                          onChange={(event) => updatePromptResponse(current.id, index, event.target.value)}
                          onBlur={(event) =>
                            flushFieldLog(
                              `planning:${current.id}:${index}`,
                              buildPlanningFieldLabel(current.id, index),
                              event.target.value
                            )
                          }
                          placeholder="Type your planning answer..."
                          highlight={false}
                          rows={1}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-400/20 bg-slate-900 shadow-xl shadow-black/30">
          <div className="flex items-center justify-between gap-4 border-b border-slate-400/20 bg-slate-800/80 px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Text Editor</p>
              <h2 className="text-xl font-black">Draft your story here</h2>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${overLimit ? "text-red-400" : "text-violet-300"}`}>
                {wordCount} / {MAX_WORDS}
              </p>
              <p className="text-xs text-zinc-500">{overLimit ? `${Math.abs(remaining)} words over` : `${remaining} words left`}</p>
            </div>
          </div>

          <div className="h-2 bg-slate-800/80">
            <div className={`h-2 ${overLimit ? "bg-red-500" : "bg-violet-500"}`} style={{ width: `${progress}%` }} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-900 p-5 [scrollbar-width:thin] [scrollbar-color:rgba(139,92,246,0.55)_rgba(30,41,59,0.45)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-500/60 [&::-webkit-scrollbar-thumb:hover]:bg-violet-400/80">
            <div className="space-y-4">
              {STORY_SECTIONS.map((section) => {
                const sectionWords = countWords(sectionDrafts[section.id] || "");
                return (
                  <section key={section.id} className="rounded-2xl border border-slate-400/20 bg-slate-800/65 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-400/20 pb-3">
                      <div>
                        <h3 className="text-base font-black text-violet-300">{section.title}</h3>
                        <p className="text-sm text-zinc-400">{section.help}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Target</p>
                        <p className="text-sm font-black text-white">{section.target}</p>
                        <p className="text-xs text-zinc-500">{sectionWords} words</p>
                      </div>
                    </div>

                    <AutoGrowTextArea
                      value={sectionDrafts[section.id] || ""}
                      onChange={(event) => updateSection(section.id, event.target.value)}
                      onBlur={(event) => flushFieldLog(`story:${section.id}`, section.title, event.target.value)}
                      placeholder={section.placeholder}
                    />
                    <FlagSummary text={sectionDrafts[section.id] || ""} />
                  </section>
                );
              })}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
