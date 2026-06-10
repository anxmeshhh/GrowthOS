import { useState, useMemo } from "react";
import { useGrowthState } from "@/hooks/use-growth-state";
import { ClipboardCheck, CheckCircle, XCircle, ChevronRight, HelpCircle, Award, Star } from "lucide-react";

type Question = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correct: string;
  explanation: string;
};

// Seed questions for topics
const TOPIC_QUIZZES: Record<string, { easy: Question[]; medium: Question[]; hard: Question[] }> = {
  css: {
    easy: [
      {
        id: "css-e-1",
        question: "What does CSS stand for?",
        options: [
          { id: "a", label: "Creative Style Sheets" },
          { id: "b", label: "Cascading Style Sheets" },
          { id: "c", label: "Computer Style Sheets" },
          { id: "d", label: "Colorful Style Sheets" }
        ],
        correct: "b",
        explanation: "CSS stands for Cascading Style Sheets. It describes how HTML elements are to be displayed on screen, paper, or in other media."
      },
      {
        id: "css-e-2",
        question: "Which HTML tag is used to define an internal style sheet?",
        options: [
          { id: "a", label: "<css>" },
          { id: "b", label: "<script>" },
          { id: "c", label: "<style>" },
          { id: "d", label: "<link>" }
        ],
        correct: "c",
        explanation: "The <style> tag is used to define internal CSS rules directly inside an HTML document's <head> section."
      },
      {
        id: "css-e-3",
        question: "Which HTML attribute is used to define inline styles?",
        options: [
          { id: "a", label: "styles" },
          { id: "b", label: "font" },
          { id: "c", label: "class" },
          { id: "d", label: "style" }
        ],
        correct: "d",
        explanation: "The 'style' attribute is used to apply CSS rules directly inline to a single HTML element."
      },
      {
        id: "css-e-4",
        question: "Which property is used to change the background color of an element?",
        options: [
          { id: "a", label: "color" },
          { id: "b", label: "bgcolor" },
          { id: "c", label: "background-color" },
          { id: "d", label: "background-style" }
        ],
        correct: "c",
        explanation: "The 'background-color' property sets the background color of an element in CSS."
      },
      {
        id: "css-e-5",
        question: "How do you add a background color for all <h1> elements?",
        options: [
          { id: "a", label: "h1 {background-color:#FFFFFF;}" },
          { id: "b", label: "h1.all {background-color:#FFFFFF;}" },
          { id: "c", label: "all.h1 {background-color:#FFFFFF;}" },
          { id: "d", label: "h1 {bg-color:#FFFFFF;}" }
        ],
        correct: "a",
        explanation: "To style all elements of a certain type, write the selector (h1) directly, followed by the property declarations in brackets."
      },
      {
        id: "css-e-6",
        question: "Which CSS property controls the text size?",
        options: [
          { id: "a", label: "text-size" },
          { id: "b", label: "font-style" },
          { id: "c", label: "font-size" },
          { id: "d", label: "text-style" }
        ],
        correct: "c",
        explanation: "The 'font-size' property sets the size of the font for text elements."
      },
      {
        id: "css-e-7",
        question: "What is the correct CSS syntax for making all the <p> elements bold?",
        options: [
          { id: "a", label: "p {font-weight:bold;}" },
          { id: "b", label: "<p style=\"font-size:bold;\">" },
          { id: "c", label: "p {text-size:bold;}" },
          { id: "d", label: "p {style:bold;}" }
        ],
        correct: "a",
        explanation: "The 'font-weight' property specifies the weight or boldness of a font. Value 'bold' makes text bold."
      },
      {
        id: "css-e-8",
        question: "How do you display hyperlinks without an underline?",
        options: [
          { id: "a", label: "a {text-decoration:none;}" },
          { id: "b", label: "a {decoration:no-underline;}" },
          { id: "c", label: "a {text-underline:none;}" },
          { id: "d", label: "a {underline:none;}" }
        ],
        correct: "a",
        explanation: "Setting 'text-decoration: none;' on link selectors (a) removes the default underline highlight."
      },
      {
        id: "css-e-9",
        question: "Which CSS property is used to change the left margin of an element?",
        options: [
          { id: "a", label: "padding-left" },
          { id: "b", label: "margin-left" },
          { id: "c", label: "indent-left" },
          { id: "d", label: "margin-padding-left" }
        ],
        correct: "b",
        explanation: "The 'margin-left' property defines the outer spacing margin on the left side of the element boundary."
      },
      {
        id: "css-e-10",
        question: "How do you select an element with id 'demo'?",
        options: [
          { id: "a", label: ".demo" },
          { id: "b", label: "*demo" },
          { id: "c", label: "#demo" },
          { id: "d", label: "demo" }
        ],
        correct: "c",
        explanation: "The '#' symbol is the ID selector symbol in CSS. For example, '#demo' matches an HTML element with id='demo'."
      }
    ],
    medium: [
      {
        id: "css-m-1",
        question: "What is the default value of the position property?",
        options: [
          { id: "a", label: "relative" },
          { id: "b", label: "absolute" },
          { id: "c", label: "static" },
          { id: "d", label: "fixed" }
        ],
        correct: "c",
        explanation: "By default, HTML elements are positioned 'static'. They follow the standard page flow rules and ignore top/right/bottom/left coordinates."
      },
      {
        id: "css-m-2",
        question: "Which layout model is best suited for single-dimensional space alignment (row OR column)?",
        options: [
          { id: "a", label: "CSS Grid" },
          { id: "b", label: "Flexbox" },
          { id: "c", label: "Tables" },
          { id: "d", label: "Floats" }
        ],
        correct: "b",
        explanation: "Flexbox (Flexible Box Layout) is designed specifically for laying out items in a single dimension (either a single column or single row)."
      },
      {
        id: "css-m-3",
        question: "What does the z-index property specify?",
        options: [
          { id: "a", label: "The horizontal position of an element" },
          { id: "b", label: "The vertical position of an element" },
          { id: "c", label: "The stack order of overlapping elements" },
          { id: "d", label: "The zoom scale factor of the element view" }
        ],
        correct: "c",
        explanation: "The z-index property specifies the stack order of elements that overlap. Higher z-index elements cover lower ones."
      },
      {
        id: "css-m-4",
        question: "What does box-sizing: border-box do?",
        options: [
          { id: "a", label: "It ignores borders when rendering components" },
          { id: "b", label: "It includes padding and border in the element's total width and height" },
          { id: "c", label: "It limits the size of borders to exactly 1px" },
          { id: "d", label: "It adds auto margins to centers elements" }
        ],
        correct: "b",
        explanation: "With box-sizing: border-box, the defined width and height of an element include its content, padding, and borders, simplifying sizing calculations."
      },
      {
        id: "css-m-5",
        question: "How do you select all elements inside a <div> that are direct children?",
        options: [
          { id: "a", label: "div * elements" },
          { id: "b", label: "div > *" },
          { id: "c", label: "div + *" },
          { id: "d", label: "div ~ *" }
        ],
        correct: "b",
        explanation: "The child combinator (>) selects elements that are immediate, direct descendants of the specified parent element."
      },
      {
        id: "css-m-6",
        question: "Which flex property determines if flex items should wrap if they exceed container bounds?",
        options: [
          { id: "a", label: "flex-flow" },
          { id: "b", label: "flex-wrap" },
          { id: "c", label: "flex-direction" },
          { id: "d", label: "flex-grow" }
        ],
        correct: "b",
        explanation: "The 'flex-wrap' property specifies whether flex items are forced into a single line or can wrap onto multiple lines if space runs out."
      },
      {
        id: "css-m-7",
        question: "What is the function of the transition-delay property?",
        options: [
          { id: "a", label: "It slows down the transition speed" },
          { id: "b", label: "It specifies when the transition effect will start" },
          { id: "c", label: "It loops the transition endlessly" },
          { id: "d", label: "It cancels transitions on active animations" }
        ],
        correct: "b",
        explanation: "The 'transition-delay' property specifies a duration to wait before starting the transition animation after it is triggered."
      },
      {
        id: "css-m-8",
        question: "How do you apply style rules to an element when it is hovered over?",
        options: [
          { id: "a", label: "selector:active" },
          { id: "b", label: "selector::hover" },
          { id: "c", label: "selector:hover" },
          { id: "d", label: "selector:focus" }
        ],
        correct: "c",
        explanation: "The ':hover' pseudo-class selects elements when the user moves their mouse pointer over them."
      },
      {
        id: "css-m-9",
        question: "What is the difference between em and rem units?",
        options: [
          { id: "a", label: "em is absolute, rem is relative" },
          { id: "b", label: "em is relative to parent element font size, rem is relative to root element font size" },
          { id: "c", label: "em is relative to root font size, rem is relative to screen width" },
          { id: "d", label: "There is no difference; they are exactly equivalent" }
        ],
        correct: "b",
        explanation: "An 'em' unit is relative to the font-size of its direct parent. A 'rem' (root em) unit is relative to the font-size of the root <html> element."
      },
      {
        id: "css-m-10",
        question: "Which value of the display property removes an element from page flow completely?",
        options: [
          { id: "a", label: "block" },
          { id: "b", label: "inline-block" },
          { id: "c", label: "none" },
          { id: "d", label: "hidden" }
        ],
        correct: "c",
        explanation: "display: none hides the element and takes it out of the document layout flow entirely (unlike visibility: hidden, which hides it but preserves its space)."
      }
    ],
    hard: [
      {
        id: "css-h-1",
        question: "Which selector has the HIGHEST specificity score?",
        options: [
          { id: "a", label: "#nav .link:hover" },
          { id: "b", label: "div.container ul li.item" },
          { id: "c", label: "#nav #main-link" },
          { id: "d", label: "a[href*='github']" }
        ],
        correct: "c",
        explanation: "ID selectors carry high specificity weight. '#nav #main-link' contains two ID selectors (specificity score 2,0,0), outranking options with only one ID or class selectors."
      },
      {
        id: "css-h-2",
        question: "In CSS Grid, what does grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) do?",
        options: [
          { id: "a", label: "Creates exactly 2 columns of 200px each" },
          { id: "b", label: "Fills the container with as many 200px columns as possible, stretching them to take remaining space" },
          { id: "c", label: "Forces columns to shrink below 200px if space gets tight" },
          { id: "d", label: "Arranges columns in a fixed masonry brick pattern" }
        ],
        correct: "b",
        explanation: "repeat(auto-fit, minmax(200px, 1fr)) dynamically places as many columns as fit in the container (minimum 200px wide). If space remains, columns expand to share the leftover room equally."
      },
      {
        id: "css-h-3",
        question: "What does the contain: layout style property do?",
        options: [
          { id: "a", label: "It locks the aspect ratio of the grid columns" },
          { id: "b", label: "It prevents text wrapping in flex lists" },
          { id: "c", label: "It indicates that changes inside the element don't affect layout of other parts of the document" },
          { id: "d", label: "It forces the elements to display inline only" }
        ],
        correct: "c",
        explanation: "contain: layout isolates layout boundaries. The browser knows that elements inside won't mutate or offset layout elements outside, improving paint performance."
      },
      {
        id: "css-h-4",
        question: "What is a major difference between CSS variables (custom properties) and Preprocessor variables (Sass/Less)?",
        options: [
          { id: "a", label: "CSS variables cannot handle hex colors" },
          { id: "b", label: "Preprocessor variables are dynamic in the client; CSS variables are compiled away statically" },
          { id: "c", label: "CSS variables are dynamic and can be manipulated by JavaScript in the browser; Preprocessor variables are static and compile-time only" },
          { id: "d", label: "CSS variables do not inherit down the DOM tree" }
        ],
        correct: "c",
        explanation: "CSS custom properties stay in the stylesheet and are interpreted dynamically in the browser, meaning JS can modify them on-the-fly (`style.setProperty`). Sass variables are evaluated at build-time."
      },
      {
        id: "css-h-5",
        question: "What does will-change: transform instruct the browser to do?",
        options: [
          { id: "a", label: "It blocks transitions on transforms" },
          { id: "b", label: "It prepares the browser for animations by offloading elements to the GPU (compositing layer)" },
          { id: "c", label: "It prevents transform actions in responsive queries" },
          { id: "d", label: "It forces the layout flow to use absolute positioning" }
        ],
        correct: "b",
        explanation: "will-change: transform hints to the browser that an element's transform will soon animate, prompting it to promote the element to its own layer and GPU rendering beforehand."
      },
      {
        id: "css-h-6",
        question: "How do media queries using display-mode: standalone work?",
        options: [
          { id: "a", label: "They style elements for offline network states" },
          { id: "b", label: "They apply styles when the app is running as a Progressive Web App (PWA) in standalone mode" },
          { id: "c", label: "They style elements when printed on physical pages" },
          { id: "d", label: "They isolate components from tailwind configurations" }
        ],
        correct: "b",
        explanation: "The display-mode media feature checks how the web application is displayed. Value 'standalone' matches PWAs opened outside standard browser Chrome headers."
      },
      {
        id: "css-h-7",
        question: "What is the result of using column-count: 3 on a text block?",
        options: [
          { id: "a", label: "It splits text into 3 separate block columns, flowing text automatically between columns like a newspaper" },
          { id: "b", label: "It creates 3 side-by-side div grids" },
          { id: "c", label: "It creates three tables stacked vertically" },
          { id: "d", label: "It limits text sentences to exactly 3 words per line" }
        ],
        correct: "a",
        explanation: "column-count specifies the number of columns an element's text content should be divided into, causing it to flow continuously from the bottom of one column to the top of the next."
      },
      {
        id: "css-h-8",
        question: "Which function allows mixing math operations with different units (e.g. subtracting px from %)?",
        options: [
          { id: "a", label: "mix()" },
          { id: "b", label: "calc()" },
          { id: "c", label: "math()" },
          { id: "d", label: "eval()" }
        ],
        correct: "b",
        explanation: "The calc() function performs mathematical calculations in CSS, permitting formulas like calc(100% - 20px) which combine different length units."
      },
      {
        id: "css-h-9",
        question: "What is a 'stacking context' in CSS?",
        options: [
          { id: "a", label: "A list of flex items structured as a column stack" },
          { id: "b", label: "A three-dimensional conceptual grouping of elements that determines how they overlap on-screen relative to each other" },
          { id: "c", label: "The order of scripts loaded in the head" },
          { id: "d", label: "The flexbox ordering parameter z-index" }
        ],
        correct: "b",
        explanation: "A stacking context is a 3D grouping of HTML layers. It bounds z-index coordinates: children of a stacking context are sorted within that context and cannot overlap with outer context elements."
      },
      {
        id: "css-h-10",
        question: "What does the @supports rule do?",
        options: [
          { id: "a", label: "It checks browser capability for specific CSS properties and values before applying styles" },
          { id: "b", label: "It loads external font stylesheets safely" },
          { id: "c", label: "It reports runtime styling errors to console logs" },
          { id: "d", label: "It binds click listeners in styles" }
        ],
        correct: "a",
        explanation: "@supports (also known as a feature query) allows testing if the client browser supports a particular CSS declaration before rendering related design styles."
      }
    ]
  }
};

const GENERIC_QUIZ_TEMPLATES = {
  easy: [
    {
      q: "What is the primary purpose of {title} in software systems?",
      opts: [
        { id: "a", label: "To store core configurations and data parameters" },
        { id: "b", label: "To structure logic and solve specific domain challenges" },
        { id: "c", label: "To encrypt network communications" },
        { id: "d", label: "To design physical graphics layouts" }
      ],
      correct: "b",
      explain: "The core goal of {title} is to organize structures and implement logic to solve domain-level tasks."
    },
    {
      q: "Which of the following describes a key fundamental concept of {title}?",
      opts: [
        { id: "a", label: "Storing redundant physical files" },
        { id: "b", label: "Minimizing runtime complexities and formatting files cleanly" },
        { id: "c", label: "Compiling code manually to machine binary directories" },
        { id: "d", label: "Running database connections synchronously over public endpoints" }
      ],
      correct: "b",
      explain: "Applying core patterns in {title} involves streamlining layout structures and keeping runtime overhead clean."
    }
  ],
  medium: [
    {
      q: "How does {title} typically interface with modern application layers?",
      opts: [
        { id: "a", label: "By establishing hardcoded physical connections to registers" },
        { id: "b", label: "Through well-defined service layers, events, or layout engines" },
        { id: "c", label: "By ignoring runtime state mutations" },
        { id: "d", label: "By compiling Javascript bundles into inline stylesheet variables" }
      ],
      correct: "b",
      explain: "{title} processes operate within event structures, rendering pipelines, or REST interfaces depending on their stack level."
    },
    {
      q: "What is a common architectural pattern used when organizing {title} projects?",
      opts: [
        { id: "a", label: "Single-file monoliths containing all styles, queries, and logic" },
        { id: "b", label: "Modular separation of concerns with clear configuration settings" },
        { id: "c", label: "Statically compiling all outputs to global browser scripts" },
        { id: "d", label: "Using inline overrides for database records" }
      ],
      correct: "b",
      explain: "Dividing modules by concerns enhances testability, maintainability, and clarity when configuring {title} systems."
    }
  ],
  hard: [
    {
      q: "When optimizing systems using {title}, which performance bottleneck is critical to avoid?",
      opts: [
        { id: "a", label: "High memory utilization due to uncollected closures or layout reflow triggers" },
        { id: "b", label: "Writing standard clean code documentation" },
        { id: "c", label: "Compiling scripts using standard compilers" },
        { id: "d", label: "Enabling strict type checks in development modes" }
      ],
      correct: "a",
      explain: "Resource leaks, endless DOM recalculation, or synchronous loop blocks cause substantial delays when compiling or processing {title} implementations."
    },
    {
      q: "Which pattern provides the most robust mechanism to scale {title} workflows?",
      opts: [
        { id: "a", label: "Relying on global shared memory spaces" },
        { id: "b", label: "Implementing strict state isolation, caching, and debouncing parameters" },
        { id: "c", label: "Forcing all executions to complete on primary interface threads synchronously" },
        { id: "d", label: "Avoiding unit test environments entirely" }
      ],
      correct: "b",
      explain: "State isolation, proper debounce parameters, and caching prevent race conditions and thread congestion."
    }
  ]
};

function generateQuizQuestions(topicId: string, topicTitle: string, difficulty: "easy" | "medium" | "hard"): Question[] {
  // If we have curated questions for this exact topic slug, use them
  const slug = topicId.toLowerCase();
  const matchedTopic = Object.keys(TOPIC_QUIZZES).find(key => slug.includes(key));
  if (matchedTopic) {
    const list = TOPIC_QUIZZES[matchedTopic][difficulty];
    if (list && list.length > 0) return list;
  }

  // Otherwise, dynamically generate 10 beautiful questions based on title and difficulty
  const templates = GENERIC_QUIZ_TEMPLATES[difficulty];
  const questions: Question[] = [];

  for (let i = 0; i < 10; i++) {
    const templateIdx = i % templates.length;
    const base = templates[templateIdx];
    
    questions.push({
      id: `${topicId}-gen-${difficulty}-${i}`,
      question: base.q.replace(/{title}/g, topicTitle) + ` (Q${i + 1} - ${difficulty.toUpperCase()} level)`,
      options: base.opts.map(o => ({
        ...o,
        label: o.label.replace(/{title}/g, topicTitle)
      })),
      correct: base.correct,
      explanation: base.explain.replace(/{title}/g, topicTitle)
    });
  }

  return questions;
}

export function QuizSandbox({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const { state, completeTopicQuiz } = useGrowthState();
  const topic = state.topics[topicId];
  
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  const startQuiz = (lvl: "easy" | "medium" | "hard") => {
    setDifficulty(lvl);
    const qList = generateQuizQuestions(topicId, topicTitle, lvl);
    setQuestions(qList);
    setIndex(0);
    setAnswers({});
    setPicked(null);
    setQuizFinished(false);
  };

  const handlePick = (optionId: string) => {
    if (picked !== null) return;
    setPicked(optionId);
    setAnswers(prev => ({ ...prev, [index]: optionId }));
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(prev => prev + 1);
      setPicked(null);
    } else {
      setQuizFinished(true);
    }
  };

  const scoreCount = useMemo(() => {
    return Object.entries(answers).reduce((acc, [idx, ans]) => {
      const q = questions[Number(idx)];
      return q && q.correct === ans ? acc + 1 : acc;
    }, 0);
  }, [answers, questions]);

  const scorePercent = questions.length > 0 ? Math.round((scoreCount / questions.length) * 100) : 0;
  const isPassing = scorePercent >= 70;

  const handleFinishAndSave = () => {
    completeTopicQuiz(topicId, scorePercent);
    // Reset selection so they see completion status
    setDifficulty(null);
  };

  if (!difficulty) {
    return (
      <div className="space-y-4 rounded-xl border border-[var(--paper-line)] bg-[var(--paper-bg)]/40 p-5 shadow-sm text-center py-8">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-900 mb-3">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--paper-ink)] font-sans">
            Topic quiz checkpoint: {topicTitle}
          </h3>
          <p className="text-[11px] text-[var(--paper-muted)] mt-1.5 max-w-sm mx-auto">
            Test your knowledge with 10 multiple-choice questions. Score 70% or higher to unlock the next roadmap stage.
          </p>
          {topic?.quizScore !== undefined && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Last score: {topic.quizScore}%</span>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-6 max-w-xs mx-auto">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--paper-muted)] mb-1">
            Choose Quiz Difficulty
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as const).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => startQuiz(lvl)}
                className="py-2.5 rounded-lg border border-[var(--paper-line)] bg-white/70 hover:bg-amber-500/10 hover:border-amber-500/30 text-xs font-semibold uppercase tracking-wider text-[var(--paper-ink)] cursor-pointer transition-all shadow-sm"
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[index];
  const isAnswered = picked !== null;

  return (
    <div className="space-y-4 rounded-xl border border-[var(--paper-line)] bg-[var(--paper-bg)]/40 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--paper-line)]/60 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-900/80" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--paper-ink)]">
            Checkpoint Quiz · {difficulty.toUpperCase()}
          </h3>
        </div>
        <div className="text-xs font-mono text-[var(--paper-muted)]">
          {quizFinished ? "Results" : `Question ${index + 1} of ${questions.length}`}
        </div>
      </div>

      {!quizFinished && (
        <div className="h-1 bg-white/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-700 transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      )}

      {quizFinished ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/80 border border-[var(--paper-line)] flex items-center justify-center mx-auto text-lg font-bold text-[var(--paper-ink)] shadow-sm">
            {scorePercent}%
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--paper-ink)]">
              {isPassing ? "Checkpoint Passed!" : "Checkpoint Failed"}
            </h3>
            <p className="text-xs text-[var(--paper-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
              You scored {scoreCount} out of {questions.length} questions correctly.
              {isPassing ? " Mastery unlocked! Save score to complete this checkpoint." : " Score 70% or more to check off this roadmap step."}
            </p>
          </div>

          <div className="pt-4 space-y-2 max-w-xs mx-auto">
            {isPassing ? (
              <button
                type="button"
                onClick={handleFinishAndSave}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                Save Score & Complete Step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startQuiz(difficulty)}
                className="w-full py-2 rounded-lg text-xs font-semibold border border-[var(--paper-line)] bg-white/70 hover:bg-white text-[var(--paper-ink)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                Try Again
              </button>
            )}
            <button
              type="button"
              onClick={() => setDifficulty(null)}
              className="w-full py-2 rounded-lg text-xs font-medium text-[var(--paper-muted)] hover:text-[var(--paper-ink)] transition-colors cursor-pointer"
            >
              Back to selection
            </button>
          </div>
        </div>
      ) : (
        currentQ && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium leading-relaxed text-[var(--paper-ink)] serif-font">
              {currentQ.question}
            </h4>

            <div className="space-y-2 pt-2">
              {currentQ.options.map(o => {
                const isPicked = picked === o.id;
                const isCorrect = o.id === currentQ.correct;
                const showResult = isAnswered;

                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handlePick(o.id)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3 rounded-lg text-xs border transition-all cursor-pointer flex items-start gap-2 ${
                      showResult
                        ? isCorrect
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : isPicked
                            ? "bg-rose-50 border-rose-200 text-rose-900"
                            : "bg-white/40 border-[var(--paper-line)] text-[var(--paper-muted)]"
                        : "bg-white/70 border-[var(--paper-line)] text-[var(--paper-ink)] hover:bg-amber-500/5 hover:border-amber-500/20"
                    }`}
                  >
                    <span className="font-mono font-bold shrink-0">{o.id.toUpperCase()}.</span>
                    <span className="flex-1 leading-snug">{o.label}</span>
                    {showResult && isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                    {showResult && !isCorrect && isPicked && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3 text-xs leading-relaxed text-[var(--paper-ink)] animate-in fade-in slide-in-from-top-1">
                <span className="font-semibold block text-[10px] font-mono text-amber-900 uppercase mb-0.5">EXPLANATION:</span>
                {currentQ.explanation}
              </div>
            )}

            {isAnswered && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {index < questions.length - 1 ? "Next Question" : "View Results"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
