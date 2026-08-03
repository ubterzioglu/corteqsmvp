import type { ZgenData } from "@/lib/zgen/zgen-types";

/* =========================================================
   ZGEN – zgen-data.ts
   Path: src/lib/zgen/zgen-data.ts

   AVATARS (male + female)
   Served from: public/relocation-tools/zgen/

   Required filenames:
     /relocation-tools/zgen/gen_silent_m.jpg
     /relocation-tools/zgen/gen_silent_f.jpg
     /relocation-tools/zgen/gen_boomer_m.jpg
     /relocation-tools/zgen/gen_boomer_f.jpg
     /relocation-tools/zgen/gen_genx_m.jpg
     /relocation-tools/zgen/gen_genx_f.jpg
     /relocation-tools/zgen/gen_geny_m.jpg
     /relocation-tools/zgen/gen_geny_f.jpg
     /relocation-tools/zgen/gen_genz_m.jpg
     /relocation-tools/zgen/gen_genz_f.jpg
     /relocation-tools/zgen/gen_alpha_m.jpg
     /relocation-tools/zgen/gen_alpha_f.jpg
     /relocation-tools/zgen/gen_beta_m.jpg
     /relocation-tools/zgen/gen_beta_f.jpg

   Compatibility is DIRECTIONAL:
   compat[youGenId][otherGenId] => { dos: [5], donts: [5], joke: "..." }
   ========================================================= */

export const ZGEN_DATA: ZgenData = {
  generations: [
    {
      id: "silent",
      name: "Silent Generation",
      range: [1928, 1945],
      avatars: { m: "/relocation-tools/zgen/gen_silent_m.jpg", f: "/relocation-tools/zgen/gen_silent_f.jpg" },
      avatarAlt: "Silent Generation avatar"
    },
    {
      id: "boomer",
      name: "Baby Boomers",
      range: [1946, 1964],
      avatars: { m: "/relocation-tools/zgen/gen_boomer_m.jpg", f: "/relocation-tools/zgen/gen_boomer_f.jpg" },
      avatarAlt: "Baby Boomers avatar"
    },
    {
      id: "genx",
      name: "Gen X",
      range: [1965, 1980],
      avatars: { m: "/relocation-tools/zgen/gen_genx_m.jpg", f: "/relocation-tools/zgen/gen_genx_f.jpg" },
      avatarAlt: "Gen X avatar"
    },
    {
      id: "geny",
      name: "Millennials (Gen Y)",
      range: [1981, 1996],
      avatars: { m: "/relocation-tools/zgen/gen_geny_m.jpg", f: "/relocation-tools/zgen/gen_geny_f.jpg" },
      avatarAlt: "Millennials avatar"
    },
    {
      id: "genz",
      name: "Gen Z",
      range: [1997, 2012],
      avatars: { m: "/relocation-tools/zgen/gen_genz_m.jpg", f: "/relocation-tools/zgen/gen_genz_f.jpg" },
      avatarAlt: "Gen Z avatar"
    },
    {
      id: "alpha",
      name: "Gen Alpha",
      range: [2013, 2025],
      avatars: { m: "/relocation-tools/zgen/gen_alpha_m.jpg", f: "/relocation-tools/zgen/gen_alpha_f.jpg" },
      avatarAlt: "Gen Alpha avatar"
    },
    {
      id: "beta",
      name: "Gen Beta",
      range: [2026, 2100],
      avatars: { m: "/relocation-tools/zgen/gen_beta_m.jpg", f: "/relocation-tools/zgen/gen_beta_f.jpg" },
      avatarAlt: "Gen Beta avatar"
    }
  ],

  /* ===== Profiles: traits + vibes (used in Card 2) ===== */
  profiles: {
    silent: {
      traits: [
        "Duty-first, feelings-later",
        "Polite disagreement as a sport",
        "Trust earned slowly, kept forever",
        "Prefers proven tools over shiny apps",
        "Reads the room before speaking",
        "Thrifty by reflex, not trend",
        "Loyal to institutions, cautious with change",
        "Understates success, overdelivers quietly",
        "Respects expertise and seniority",
        "Communicates with calm precision"
      ],
      vibes: [
        "Quiet competence, loud results",
        "Respect the process",
        "Less talk, more done",
        "Don’t waste; make it last",
        "Steady hands, steady plans"
      ]
    },

    boomer: {
      traits: [
        "Optimistic about hard work paying off",
        "Meetings as a legitimate productivity unit",
        "Phone calls beat long message threads",
        "Network-minded and relationship-driven",
        "Values titles, milestones, and clear ladders",
        "Confident presenter, comfortable leading the room",
        "Prefers big-picture narratives over micro-updates",
        "Expects reliability and punctuality",
        "Likes consensus, but wants closure",
        "Practical problem-solver with a can-do reflex"
      ],
      vibes: [
        "Let’s align and move",
        "Call me; we’ll sort it",
        "Strong handshake energy",
        "Make it official",
        "Work hard, then relax"
      ]
    },

    genx: {
      traits: [
        "Skeptical, but not cynical—usually",
        "Independent problem-solver, low-maintenance teammate",
        "Prefers autonomy over applause",
        "Allergic to corporate fluff",
        "Direct communicator with dry humor",
        "Values competence more than enthusiasm",
        "Efficient multitasker from pre-tab chaos era",
        "Trusts actions, questions promises",
        "Adapts fast, complains quietly",
        "Likes clear goals and minimal oversight"
      ],
      vibes: [
        "Show me the point",
        "Do it right, not loud",
        "I’ve seen worse",
        "Keep it simple, please",
        "Results over drama"
      ]
    },

    geny: {
      traits: [
        "Purpose-driven, but deadline-aware",
        "Feedback-friendly and growth-oriented",
        "Collaborative by default, hates silos",
        "Comfortable with change, expects context",
        "Prefers async clarity over surprise meetings",
        "Values flexibility as a productivity tool",
        "Asks “why” before “how”",
        "Balances ambition with burnout detection",
        "Wants managers who coach, not command",
        "Turns tools into systems and workflows"
      ],
      vibes: [
        "Explain the why",
        "Let’s improve the process",
        "Sync quickly, then ship",
        "Flexible, not flaky",
        "Meaning plus momentum"
      ]
    },

    genz: {
      traits: [
        "Fast scanner of information, low tolerance for fluff",
        "Prefers short messages and clear asks",
        "Comfortable challenging ideas early",
        "Values authenticity over formality",
        "Learns by tutorials, experiments, and iteration",
        "Expects tools to be intuitive and immediate",
        "Strong boundary setting around time and energy",
        "Socially aware, risk-aware, brand-aware",
        "Thrives with transparency and quick feedback loops",
        "Turns side projects into portfolios"
      ],
      vibes: [
        "Say it in one line",
        "Show receipts, not vibes",
        "Ship, learn, repeat",
        "Keep it real",
        "Respect the boundary"
      ]
    },

    alpha: {
      traits: [
        "Touch-first intuition; manuals feel optional",
        "AI-assisted thinking is normal, not fancy",
        "Expects personalization everywhere",
        "Learns visually and interactively",
        "Short attention span, sharp pattern spotting",
        "Gamifies progress without being asked",
        "Naturally multi-modal: voice, video, text",
        "Comfortable co-creating rather than consuming",
        "Impatient with slow interfaces and slow decisions",
        "Needs guardrails because speed outruns judgment"
      ],
      vibes: [
        "Instant, interactive, intuitive",
        "Make it playable",
        "Swipe to solve",
        "Co-create the answer",
        "If it’s boring, it’s broken"
      ]
    },

    beta: {
      traits: [
        "Born into ambient AI and smart environments",
        "Defaults to delegation: “system, handle it”",
        "Expects seamless identity and privacy controls",
        "Comfortable with synthetic media as everyday content",
        "High standards for UX and low patience for friction",
        "Uses agents and automation like utilities",
        "Values verification as much as creativity",
        "Thinks in prompts, workflows, and orchestration",
        "Collaboration includes humans and tools equally",
        "Treats learning as continuous, personalized streaming"
      ],
      vibes: [
        "Agent-first lifestyle",
        "Friction is a bug",
        "Verify, then vibe",
        "Orchestrate everything",
        "Personalized by default"
      ]
    }
  },

  /* ===== Compatibility (directional) ===== */
  compat: {
    silent: {
      boomer: {
        dos: [
          "Open with context and the point upfront.",
          "Show respect for experience before proposing change.",
          "Use phone or in-person for sensitive topics.",
          "Follow through on what you promise, quickly.",
          "Keep feedback private and factual."
        ],
        donts: [
          "Assume they dislike change; ask first.",
          "Use too much slang or sarcasm in meetings.",
          "Challenge status in public to make a point.",
          "Hide bad news behind vague language.",
          "Treat titles as meaningless in formal settings."
        ],
        joke: "If you want a Boomer’s buy-in, schedule it—spontaneity is not a calendar invite."
      },
      genx: {
        dos: [
          "Be concise and practical.",
          "Give autonomy and a clear outcome.",
          "Use written notes after verbal agreements.",
          "Acknowledge competence without overpraising.",
          "Respect their time; keep meetings short."
        ],
        donts: [
          "Micromanage how they get it done.",
          "Over-explain obvious steps.",
          "Turn everything into a committee decision.",
          "Assume cynicism equals disengagement.",
          "Force forced-fun team rituals."
        ],
        joke: "Gen X will nod at your plan and then quietly improve it while you’re still presenting slide two."
      },
      geny: {
        dos: [
          "Explain the why before the how.",
          "Give growth-oriented feedback with next steps.",
          "Invite ideas, then decide clearly.",
          "Use collaborative language without vagueness.",
          "Recognize effort when it leads to results."
        ],
        donts: [
          "Assume loyalty without purpose and fairness.",
          "Use only hierarchy to justify decisions.",
          "Delay feedback until the annual review.",
          "Dismiss work-life boundaries as weakness.",
          "Treat digital tools as optional in workflows."
        ],
        joke: "Tell Gen Y the mission and they’ll sprint; tell them 'because I said so' and they’ll open LinkedIn."
      },
      genz: {
        dos: [
          "Be direct, kind, and quick.",
          "Set expectations in writing and repeat them once.",
          "Ask how they prefer to receive feedback.",
          "Offer small wins and fast learning loops.",
          "Be transparent about constraints and tradeoffs."
        ],
        donts: [
          "Use long monologues as a management style.",
          "Confuse bluntness with rudeness.",
          "Assume silence means agreement.",
          "Mock newer tools or formats.",
          "Ignore mental load and context switching."
        ],
        joke: "If your update takes longer than a short video, Gen Z will ask for the highlights."
      },
      alpha: {
        dos: [
          "Use visual examples and concrete demos.",
          "Chunk tasks into short, clear steps.",
          "Give immediate feedback on attempts.",
          "Make rules explicit and consistent.",
          "Encourage curiosity with safe boundaries."
        ],
        donts: [
          "Rely on implied norms; spell them out.",
          "Expect patience for slow tools or slow decisions.",
          "Punish questions as interruptions.",
          "Use fear-based motivation.",
          "Assume they will infer priorities from vibes."
        ],
        joke: "Alpha doesn’t want the manual; they want the tutorial that skips the intro."
      },
      beta: {
        dos: [
          "Model calm focus and steady routines.",
          "Teach critical thinking with simple checks.",
          "Use short, friendly prompts and examples.",
          "Reward consistency more than intensity.",
          "Explain how decisions are made and changed."
        ],
        donts: [
          "Overload them with choices at once.",
          "Assume they will tolerate unclear ownership.",
          "Delay clarification when confusion shows.",
          "Make everything competitive by default.",
          "Treat attention as infinite."
        ],
        joke: "Beta will be ready to ship before the adults finish arguing about the font."
      }
    },

    boomer: {
      silent: {
        dos: [
          "Use formal courtesy and clear boundaries.",
          "Bring evidence and history when proposing change.",
          "Ask for their perspective before debating.",
          "Prefer one-on-one conversations for hard topics.",
          "Show reliability through consistent follow-up."
        ],
        donts: [
          "Rush them into decisions without reflection time.",
          "Assume they want to be 'modernized.'",
          "Use aggressive confrontation as honesty.",
          "Overuse buzzwords instead of specifics.",
          "Skip gratitude for long-term contributions."
        ],
        joke: "With Silent, the loudest move you can make is showing up prepared."
      },
      genx: {
        dos: [
          "State the goal, then let them choose the route.",
          "Keep status updates short and purposeful.",
          "Respect skepticism and answer with facts.",
          "Give credit publicly when earned.",
          "Align on outcomes, not hours."
        ],
        donts: [
          "Use authority as your only argument.",
          "Turn every issue into a meeting.",
          "Overpromise and underdeliver.",
          "Confuse independence with disrespect.",
          "Demand enthusiasm on command."
        ],
        joke: "Gen X doesn’t need a pep talk; they need the blocker removed."
      },
      geny: {
        dos: [
          "Connect tasks to impact and learning.",
          "Give feedback early and with specifics.",
          "Offer flexibility when results stay strong.",
          "Invite collaboration, then commit to a decision.",
          "Be transparent about promotion criteria."
        ],
        donts: [
          "Assume long hours equal commitment.",
          "Treat questions as challenges to authority.",
          "Gatekeep information as power.",
          "Ignore requests for tooling improvements.",
          "Reward only visible work, not effective work."
        ],
        joke: "Gen Y can handle hard work—just don’t call it 'paying dues' forever."
      },
      genz: {
        dos: [
          "Use clear expectations and quick check-ins.",
          "Give direct feedback with a path to fix it.",
          "Be authentic; drop the corporate theater.",
          "Support async work with written clarity.",
          "Normalize asking for help early."
        ],
        donts: [
          "Interpret boundary-setting as laziness.",
          "Wait weeks to address small issues.",
          "Use sarcasm as a teaching tool.",
          "Force camera-on as a loyalty test.",
          "Dismiss mental health as 'not work-related.'"
        ],
        joke: "Gen Z will respect your title more if your Wi-Fi is stable."
      },
      alpha: {
        dos: [
          "Teach by showing, then let them try fast.",
          "Use simple rules and immediate reinforcement.",
          "Make learning playful but goal-driven.",
          "Keep instructions short and visual.",
          "Set guardrails, then allow exploration."
        ],
        donts: [
          "Assume they’ll read long instructions first.",
          "Use shame when they fail publicly.",
          "Expect focus without breaks and variety.",
          "Treat tech as a distraction by default.",
          "Overcorrect every small mistake."
        ],
        joke: "Alpha hears 'policy' and immediately asks where the skip button is."
      },
      beta: {
        dos: [
          "Create predictable routines and clear roles.",
          "Encourage curiosity with safe experimentation.",
          "Use simple checklists and reminders.",
          "Model respectful disagreement.",
          "Teach responsible tech habits early."
        ],
        donts: [
          "Assume they’ll learn norms by osmosis.",
          "Flood them with alerts and pings.",
          "Reward speed over accuracy every time.",
          "Make every task a performance.",
          "Use fear to enforce compliance."
        ],
        joke: "Beta will ask for 'version history' on real life."
      }
    },

    genx: {
      silent: {
        dos: [
          "Lead with respect and steady tone.",
          "Bring a solution, not just a critique.",
          "Confirm agreements in writing.",
          "Be punctual and consistent.",
          "Ask for stories and lessons learned."
        ],
        donts: [
          "Use edgy humor in formal moments.",
          "Assume they want rapid change without proof.",
          "Interrupt to speed things up.",
          "Treat tradition as irrational.",
          "Let conflict linger without closure."
        ],
        joke: "Silent doesn’t want your hot take; they want your plan and your timeline."
      },
      boomer: {
        dos: [
          "Show results and track record.",
          "Respect process while proposing improvements.",
          "Use clear, confident communication.",
          "Escalate issues early with options.",
          "Acknowledge what already works."
        ],
        donts: [
          "Roll your eyes at 'the old way.'",
          "Undermine decisions in side conversations.",
          "Assume a title means they won’t listen.",
          "Ignore stakeholder management.",
          "Hide behind ambiguity to avoid accountability."
        ],
        joke: "Boomers love innovation—after it has a pilot, metrics, and a slide deck."
      },
      geny: {
        dos: [
          "Be candid, but add empathy.",
          "Offer freedom with clear accountability.",
          "Use collaborative problem-solving.",
          "Share decision criteria openly.",
          "Recognize initiative, not just output."
        ],
        donts: [
          "Assume optimism means naivety.",
          "Withhold feedback to avoid discomfort.",
          "Treat flexibility as a perk you can revoke casually.",
          "Dismiss values talk as 'soft stuff.'",
          "Ignore the need for career path clarity."
        ],
        joke: "Gen Y will ask for your vision; Gen X will ask for your deadline."
      },
      genz: {
        dos: [
          "Keep messages short with clear actions.",
          "Use direct feedback and quick iterations.",
          "Respect boundaries and async communication.",
          "Explain tradeoffs without condescension.",
          "Encourage questions without labeling them as excuses."
        ],
        donts: [
          "Use 'toughen up' as coaching.",
          "Assume they know unwritten rules.",
          "Gatekeep information as a rite of passage.",
          "Treat every ping as urgent.",
          "Mock their tools or communication style."
        ],
        joke: "Gen X says 'figure it out'; Gen Z says 'cool, send the docs link.'"
      },
      alpha: {
        dos: [
          "Teach with interactive examples.",
          "Use short cycles: try, review, adjust.",
          "Set clear boundaries and explain why.",
          "Celebrate learning, not just winning.",
          "Provide structure without rigidity."
        ],
        donts: [
          "Expect long attention on one format.",
          "Punish experimentation when outcomes are safe.",
          "Use vague instructions like 'be professional.'",
          "Assume silence means understanding.",
          "Overuse lectures instead of practice."
        ],
        joke: "Alpha treats 'best practices' like a challenge prompt."
      },
      beta: {
        dos: [
          "Keep systems simple and repeatable.",
          "Teach focus with clear single-task moments.",
          "Use friendly checklists and rituals.",
          "Model calm problem-solving.",
          "Show how to verify information quickly."
        ],
        donts: [
          "Overcomplicate with too many tools at once.",
          "Confuse constant activity with progress.",
          "Make feedback only about outcomes, not habits.",
          "Normalize being always-on.",
          "Treat curiosity as disruption."
        ],
        joke: "Beta will refactor your routine before you finish your morning coffee."
      }
    },

    geny: {
      silent: {
        dos: [
          "Use polite formality and steady pacing.",
          "Ask for guidance and honor it visibly.",
          "Keep commitments tight and consistent.",
          "Prefer private feedback exchanges.",
          "Bring practical proposals, not just ideals."
        ],
        donts: [
          "Over-share personal context in formal settings.",
          "Assume immediacy is always valued.",
          "Turn every decision into a brainstorming session.",
          "Use casual language for sensitive topics.",
          "Rush closure before they feel heard."
        ],
        joke: "Silent doesn’t need a motivational quote; they need you to do what you said."
      },
      boomer: {
        dos: [
          "Show respect, then propose improvements.",
          "Bring data and customer impact.",
          "Align with goals and ownership clearly.",
          "Offer options, not ultimatums.",
          "Follow up with a short written recap."
        ],
        donts: [
          "Assume they oppose flexibility; negotiate it.",
          "Use jargon without translating outcomes.",
          "Treat hierarchy like a villain story.",
          "Push change without acknowledging risk.",
          "Expect instant buy-in on first conversation."
        ],
        joke: "Boomers trust your idea right after they see it work twice in production."
      },
      genx: {
        dos: [
          "Be efficient and prepared.",
          "Respect independence and avoid micromanaging.",
          "Use humor lightly, not performatively.",
          "Ask for their input early, then act.",
          "Own mistakes quickly and move on."
        ],
        donts: [
          "Over-sell enthusiasm as competence.",
          "Turn feedback into a long coaching session.",
          "Assume they want constant alignment meetings.",
          "Confuse quietness with lack of care.",
          "Use vague timelines like 'soon-ish.'"
        ],
        joke: "Gen X doesn’t want your roadmap; they want your blockers list."
      },
      genz: {
        dos: [
          "Write clear expectations and define 'done.'",
          "Give feedback fast and specific.",
          "Invite suggestions on tools and workflow.",
          "Normalize saying 'I don’t know' and learning.",
          "Protect focus time with async updates."
        ],
        donts: [
          "Assume they’ll tolerate unclear priorities.",
          "Use passive-aggressive hints instead of asks.",
          "Treat boundaries as negotiable by default.",
          "Overload them with meetings for visibility.",
          "Label their directness as disrespect."
        ],
        joke: "Gen Z will accept your process if it comes with fewer meetings and better docs."
      },
      alpha: {
        dos: [
          "Use short instructions and immediate practice.",
          "Keep feedback frequent and positive-first.",
          "Offer choices, but limit them to a few.",
          "Use visuals and examples over speeches.",
          "Build habits with small daily routines."
        ],
        donts: [
          "Assume patience for slow reward cycles.",
          "Overcorrect in the moment every time.",
          "Make rules inconsistent across days.",
          "Use guilt as motivation.",
          "Treat tech use as all-good or all-bad."
        ],
        joke: "Alpha doesn’t multitask—they just run multiple apps on the same brain tab."
      },
      beta: {
        dos: [
          "Teach them to ask good questions.",
          "Use simple guardrails for safety and focus.",
          "Reinforce consistency and kindness.",
          "Show how to validate sources quickly.",
          "Keep goals small and track progress visibly."
        ],
        donts: [
          "Assume they’ll separate signal from noise alone.",
          "Reward only speed and novelty.",
          "Over-schedule every minute.",
          "Turn mistakes into a public lesson.",
          "Let devices replace actual communication."
        ],
        joke: "Beta’s first word might be 'update' because everything else gets one."
      }
    },

    genz: {
      silent: {
        dos: [
          "Use respectful language and measured tone.",
          "Ask permission before giving blunt feedback.",
          "Be reliable; consistency builds trust fastest.",
          "Prefer structured conversations over rapid-fire debate.",
          "Show appreciation in concrete ways."
        ],
        donts: [
          "Use edgy humor around serious topics.",
          "Assume informality equals authenticity.",
          "Interrupt to speed up the discussion.",
          "Dismiss long-term experience as outdated.",
          "Ghost follow-ups after asking for help."
        ],
        joke: "Silent reads your whole message; the flex is sending one that deserves it."
      },
      boomer: {
        dos: [
          "Lead with outcomes and business value.",
          "Be direct, but keep it respectful.",
          "Offer a pilot plan with clear metrics.",
          "Communicate progress proactively.",
          "Show accountability before asking for flexibility."
        ],
        donts: [
          "Assume they hate new tools; prove the benefit.",
          "Use sarcasm when disagreeing.",
          "Skip stakeholder alignment.",
          "Treat deadlines as optional.",
          "Publicly correct them to score points."
        ],
        joke: "Boomers will adopt your tool faster if you rename it 'the new standard.'"
      },
      genx: {
        dos: [
          "Be concise and skip the fluff.",
          "Ask for expectations explicitly.",
          "Show initiative without oversharing.",
          "Accept blunt feedback and act on it.",
          "Use async updates with clear next steps."
        ],
        donts: [
          "Treat their cynicism as personal.",
          "Over-explain your entire thought process.",
          "Demand constant reassurance.",
          "Escalate small conflicts emotionally.",
          "Mistake independence for coldness."
        ],
        joke: "Gen X won’t say 'great job,' but they also won’t stop you from doing it again."
      },
      geny: {
        dos: [
          "Collaborate and share credit openly.",
          "Give honest feedback with tact.",
          "Align on boundaries and response times.",
          "Use modern tools, but keep workflows stable.",
          "Ask for mentorship with specific goals."
        ],
        donts: [
          "Assume they want to be on-call socially and professionally.",
          "Treat purpose talk as performative.",
          "Ghost threads and expect trust to remain.",
          "Refuse process without proposing a better one.",
          "Make everything a debate about values."
        ],
        joke: "Gen Y loves your ambition—right until it schedules a meeting that could be a message."
      },
      alpha: {
        dos: [
          "Teach with quick demos and repetition.",
          "Use simple language and clear boundaries.",
          "Encourage creativity with safe constraints.",
          "Make feedback immediate and actionable.",
          "Keep sessions short and varied."
        ],
        donts: [
          "Assume they’ll learn by watching once.",
          "Overload with too many rules at once.",
          "Use shame to correct mistakes.",
          "Expect long focus without breaks.",
          "Treat questions as interruptions."
        ],
        joke: "Alpha learns faster than you explain, then asks why your explanation was so slow."
      },
      beta: {
        dos: [
          "Model healthy attention habits and pauses.",
          "Teach simple systems: check, verify, decide.",
          "Use short prompts and consistent routines.",
          "Reward kindness and collaboration.",
          "Show how to ask for help early."
        ],
        donts: [
          "Normalize constant notifications.",
          "Turn every task into content or performance.",
          "Reward shortcuts over understanding.",
          "Let misinformation slide unchallenged.",
          "Assume tech fluency equals judgment."
        ],
        joke: "Beta will have better digital hygiene than the adults who invented the mess."
      }
    },

    alpha: {
      silent: {
        dos: [
          "Use polite phrasing and slow the pace.",
          "Show respect through listening and patience.",
          "Explain your intent before your opinion.",
          "Follow up with a clear written summary.",
          "Ask for their preferred way of communicating."
        ],
        donts: [
          "Assume quick replies are mandatory.",
          "Use slang in formal contexts.",
          "Challenge them publicly for entertainment.",
          "Treat tradition as a joke.",
          "Switch topics rapidly without transitions."
        ],
        joke: "Silent thinks before speaking; Alpha thinks while opening three new tabs."
      },
      boomer: {
        dos: [
          "Be respectful and clear about goals.",
          "Show your work and logic, briefly.",
          "Accept structure, then optimize within it.",
          "Ask for feedback in small, frequent doses.",
          "Use shared documents to avoid confusion."
        ],
        donts: [
          "Assume rules are negotiable without discussion.",
          "Dismiss experience as irrelevant.",
          "Use memes to make serious points.",
          "Change tools weekly without alignment.",
          "Treat deadlines as suggestions."
        ],
        joke: "Boomers want a plan; Alpha wants a plan that updates itself."
      },
      genx: {
        dos: [
          "Be efficient and self-directed.",
          "Ask precise questions, not broad ones.",
          "Deliver small results early.",
          "Respect 'no meeting' preferences.",
          "Take feedback without dramatizing it."
        ],
        donts: [
          "Over-share every micro-decision.",
          "Expect constant encouragement.",
          "Use trend language as proof.",
          "Assume they’ll tolerate unclear ownership.",
          "Turn work into a social performance."
        ],
        joke: "Gen X sees your five-step plan and asks which step actually ships."
      },
      geny: {
        dos: [
          "Connect your work to impact and learning.",
          "Collaborate and share credit naturally.",
          "Ask for mentorship and accept coaching.",
          "Use tools that reduce friction for everyone.",
          "Clarify expectations and timelines upfront."
        ],
        donts: [
          "Treat every change as urgent.",
          "Ignore context and jump straight to solutions.",
          "Assume flexibility means zero structure.",
          "Dismiss feedback as 'old school.'",
          "Optimize for novelty over reliability."
        ],
        joke: "Gen Y will sponsor your growth; just don’t make them your full-time calendar."
      },
      genz: {
        dos: [
          "Use fast feedback loops and quick iterations.",
          "Keep communication short and explicit.",
          "Agree on boundaries and respect them.",
          "Share resources and templates openly.",
          "Normalize asking for help early."
        ],
        donts: [
          "Compete over who is more direct.",
          "Assume shared slang equals shared meaning.",
          "Treat every disagreement as identity-based.",
          "Overload each other with constant pings.",
          "Skip documentation because it feels slow."
        ],
        joke: "Alpha and Gen Z can finish the project in a day—then spend a week picking the best tool to do it."
      },
      beta: {
        dos: [
          "Be a calm example of focus and patience.",
          "Use simple routines and repeat them.",
          "Teach verification habits early.",
          "Encourage collaboration over competition.",
          "Keep goals small and celebrate consistency."
        ],
        donts: [
          "Overstimulate with constant switching.",
          "Make everything a race.",
          "Reward attention-seeking over learning.",
          "Normalize skipping basics.",
          "Treat mistakes as entertainment."
        ],
        joke: "Alpha will teach Beta the shortcut, and Beta will ask who approved it."
      }
    },

    beta: {
      silent: {
        dos: [
          "Use respectful language and clear structure.",
          "Listen fully before replying.",
          "Be consistent and follow through.",
          "Ask for rules and expectations explicitly.",
          "Offer help in practical, concrete ways."
        ],
        donts: [
          "Rush conversations with rapid topic changes.",
          "Assume informality is always welcome.",
          "Treat experience as optional context.",
          "Make jokes during serious discussions.",
          "Disappear after asking for guidance."
        ],
        joke: "Silent values patience; Beta is still buffering the concept."
      },
      boomer: {
        dos: [
          "Be polite, clear, and outcome-focused.",
          "Show accountability and respect deadlines.",
          "Ask for feedback and apply it fast.",
          "Use simple tools that keep everyone aligned.",
          "Explain your logic without sounding defensive."
        ],
        donts: [
          "Assume structure is oppression.",
          "Change direction without notifying stakeholders.",
          "Use trendy language as a substitute for clarity.",
          "Treat meetings as optional if invited.",
          "Push back without proposing alternatives."
        ],
        joke: "Boomers bring the process; Beta brings the auto-update that breaks it once."
      },
      genx: {
        dos: [
          "Be concise and prepared.",
          "Show independence with reliable execution.",
          "Ask specific questions and accept short answers.",
          "Respect boundaries and low-meeting culture.",
          "Deliver results, then iterate quietly."
        ],
        donts: [
          "Expect constant praise and reassurance.",
          "Overcomplicate the plan to sound smart.",
          "Take blunt feedback personally.",
          "Turn work into a popularity contest.",
          "Ping repeatedly without new information."
        ],
        joke: "Gen X won’t read your long message, but they will fix the problem it describes."
      },
      geny: {
        dos: [
          "Align on purpose, then agree on metrics.",
          "Use collaborative tone and shared ownership.",
          "Be transparent about capacity and blockers.",
          "Ask for coaching and apply it quickly.",
          "Respect flexibility while staying accountable."
        ],
        donts: [
          "Assume vibes replace clear priorities.",
          "Treat feedback as a personal rating.",
          "Ignore team conventions and tooling.",
          "Overcommit to look eager.",
          "Let ambiguity linger when you’re unsure."
        ],
        joke: "Gen Y will help you grow—Beta just needs to stop growing the meeting invite list."
      },
      genz: {
        dos: [
          "Keep messages short with clear next steps.",
          "Respect boundaries and response times.",
          "Use quick feedback loops and adjust fast.",
          "Document decisions in a shared place.",
          "Be honest early when something is unclear."
        ],
        donts: [
          "Assume speed matters more than clarity.",
          "Turn directness into a competition.",
          "Overreact to small conflicts.",
          "Flood chats with constant updates.",
          "Skip alignment and hope it works out."
        ],
        joke: "Beta and Gen Z can agree on one thing: if it’s not written down, it didn’t happen."
      },
      alpha: {
        dos: [
          "Keep routines simple and consistent.",
          "Use short, interactive learning moments.",
          "Model calm attention and turn-taking.",
          "Encourage curiosity with safe boundaries.",
          "Give immediate, kind corrections."
        ],
        donts: [
          "Overstimulate with constant switching.",
          "Make everything competitive.",
          "Use sarcasm as humor in teaching.",
          "Expect long focus without breaks.",
          "Ignore emotions when frustration shows."
        ],
        joke: "Beta will ask Alpha for help, and Alpha will respond with a tutorial they made mid-sentence."
      }
    }
  }
};
