"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { isLocale } from "@/i18n/routing";
import { useAction } from "@/hooks/use-action";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  Dumbbell,
  Search,
  X,
  AlertCircle,
  Pencil,
  Check,
  RotateCcw,
} from "lucide-react";

type Source = "reading" | "speaking" | "writing" | "listening" | "manual";

const ALL_SOURCES: Source[] = [
  "reading",
  "speaking",
  "writing",
  "listening",
  "manual",
];

type PageStrings = {
  // nav
  home: string;
  practice: string;
  // page header
  pageTitle: string;
  pageSubtitle: string;
  // add-form toggle & cancel
  saveTrigger: string;
  cancel: string;
  // add form internals
  textareaPlaceholder: string;
  hideNote: string;
  addNoteToggle: string;
  notePlaceholder: string;
  enterHint: string;
  saveSentence: string;
  // source labels
  sources: Record<Source, string>;
  // filter
  filterAll: string;
  // search
  searchPlaceholder: string;
  clearSearchAriaLabel: string;
  // no-match
  noMatchIntro: string;
  noMatchSearchPrefix: string;
  noMatchIn: string;
  clearFilters: string;
  // empty state
  emptyTitle: string;
  emptyDesc: string;
  emptyAction: string;
  // AI badges
  analysing: string;
  aiUnavailable: string;
  retry: string;
  retryAriaLabel: string;
  // AI panel
  paraphrases: string;
  useWhen: string;
  // note editor
  addNoteLabel: string;
  saveNoteAriaLabel: string;
  cancelAriaLabel: string;
  // sentence card
  deleteSentenceAriaLabel: string;
  // delete toast
  sentenceRemoved: string;
  undo: string;
  // footer
  footerSaved: string;
  footerDue: string;
};

const STRINGS: Record<"en" | "fr", PageStrings> = {
  en: {
    home: "Home",
    practice: "Practice",
    pageTitle: "Phrase Bank",
    pageSubtitle:
      "Sentences worth keeping. Each one is analysed and drilled until it becomes part of how you speak.",
    saveTrigger: "Save a sentence…",
    cancel: "Cancel",
    textareaPlaceholder: "Paste or type a sentence you want to remember…",
    hideNote: "Hide note",
    addNoteToggle: "+ Add note",
    notePlaceholder: "Personal note (optional)…",
    enterHint: "to save",
    saveSentence: "Save sentence",
    sources: {
      reading: "Reading",
      speaking: "Speaking",
      writing: "Writing",
      listening: "Listening",
      manual: "Other",
    },
    filterAll: "All",
    searchPlaceholder: "Search sentences…",
    clearSearchAriaLabel: "Clear search",
    noMatchIntro: "No sentences match",
    noMatchSearchPrefix: "",
    noMatchIn: "in",
    clearFilters: "Clear filters",
    emptyTitle: "No saved sentences yet",
    emptyDesc:
      "When you find a sentence worth keeping — in a reading passage, a model answer, anywhere — save it here and practise until it’s yours.",
    emptyAction: "Save your first sentence",
    analysing: "Analysing…",
    aiUnavailable: "AI notes unavailable",
    retry: "Retry",
    retryAriaLabel: "Retry AI analysis",
    paraphrases: "Paraphrases",
    useWhen: "Use when",
    addNoteLabel: "Add note",
    saveNoteAriaLabel: "Save note",
    cancelAriaLabel: "Cancel",
    deleteSentenceAriaLabel: "Delete sentence",
    sentenceRemoved: "Sentence removed",
    undo: "Undo",
    footerSaved: "saved",
    footerDue: "due for practice",
  },
  fr: {
    home: "Accueil",
    practice: "Pratiquer",
    pageTitle: "Banque de phrases",
    pageSubtitle:
      "Des phrases à retenir. Chacune est analysée et répétée jusqu’à faire partie de votre expression naturelle.",
    saveTrigger: "Enregistrer une phrase…",
    cancel: "Annuler",
    textareaPlaceholder: "Collez ou tapez une phrase à retenir…",
    hideNote: "Masquer la note",
    addNoteToggle: "+ Ajouter une note",
    notePlaceholder: "Note personnelle (facultatif)…",
    enterHint: "pour enregistrer",
    saveSentence: "Enregistrer la phrase",
    sources: {
      reading: "Lecture",
      speaking: "Expression orale",
      writing: "Rédaction",
      listening: "Compréhension orale",
      manual: "Autre",
    },
    filterAll: "Tout",
    searchPlaceholder: "Rechercher des phrases…",
    clearSearchAriaLabel: "Effacer la recherche",
    noMatchIntro: "Aucune phrase ne correspond",
    noMatchSearchPrefix: " à",
    noMatchIn: "dans",
    clearFilters: "Effacer les filtres",
    emptyTitle: "Aucune phrase enregistrée",
    emptyDesc:
      "Quand vous trouvez une phrase digne d’être retenue — dans un texte, une réponse modèle, où que ce soit — enregistrez-la ici et pratiquez jusqu’à la maîteriser.",
    emptyAction: "Enregistrer votre première phrase",
    analysing: "Analyse en cours…",
    aiUnavailable: "Notes IA indisponibles",
    retry: "Réessayer",
    retryAriaLabel: "Réessayer l’analyse IA",
    paraphrases: "Reformulations",
    useWhen: "Utiliser quand",
    addNoteLabel: "Ajouter une note",
    saveNoteAriaLabel: "Enregistrer la note",
    cancelAriaLabel: "Annuler",
    deleteSentenceAriaLabel: "Supprimer la phrase",
    sentenceRemoved: "Phrase supprimée",
    undo: "Annuler",
    footerSaved: "enregistrée(s)",
    footerDue: "à réviser",
  },
};

type SavedSentence = {
  _id: Id<"savedSentences">;
  text: string;
  source: Source;
  note?: string;
  aiStatus: "pending" | "done" | "error";
  keyExpression?: string;
  grammarNote?: string;
  paraphrases?: string[];
  usageContexts?: string[];
  cefrLevel?: string;
  savedAt: number;
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FOCUS_RING_SM =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function AddForm({
  locale,
  t,
  onSaved,
}: {
  locale: "en" | "fr";
  t: PageStrings;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<Source>("reading");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const saveMutation = useMutation(api.mutations.sentences.saveSentence);
  const { execute: save, isLoading, error } = useAction(saveMutation);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;
    const result = await save({
      language: locale,
      text: text.trim(),
      source,
      note: note.trim() || undefined,
    });
    if (result) {
      setText("");
      setNote("");
      setShowNote(false);
      onSaved();
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.textareaPlaceholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-input bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors duration-150"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
        }}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {ALL_SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={[
              "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150",
              FOCUS_RING,
              source === s
                ? "border-foreground bg-foreground text-card"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            ].join(" ")}
          >
            {t.sources[s]}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowNote((v) => !v)}
          className={[
            "ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors rounded",
            FOCUS_RING_SM,
          ].join(" ")}
        >
          {showNote ? t.hideNote : t.addNoteToggle}
        </button>
      </div>

      {showNote && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors duration-150"
        />
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error.message}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[0.6875rem] text-muted-foreground">
          <kbd className="font-mono not-italic">⌘</kbd>
          <span className="text-muted-foreground/60"> / </span>
          <kbd className="font-mono not-italic">Ctrl</kbd>
          {" + Enter "}
          {t.enterHint}
        </p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!text.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {t.saveSentence}
        </Button>
      </div>
    </div>
  );
}

function AIPendingBadge({ t }: { t: PageStrings }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
      <Loader2 className="w-3 h-3 animate-spin" />
      {t.analysing}
    </span>
  );
}

function AIErrorBadge({
  t,
  onRetry,
}: {
  t: PageStrings;
  onRetry: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-destructive/70">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {t.aiUnavailable}
      <button
        type="button"
        onClick={onRetry}
        className={[
          "inline-flex items-center gap-0.5 text-[0.6875rem] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors rounded",
          FOCUS_RING_SM,
        ].join(" ")}
        aria-label={t.retryAriaLabel}
      >
        <RotateCcw className="w-2.5 h-2.5" />
        {t.retry}
      </button>
    </span>
  );
}

function AIPanel({
  sentence,
  t,
}: {
  sentence: SavedSentence;
  t: PageStrings;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `ai-panel-${sentence._id}`;

  if (!sentence.keyExpression) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={[
          "flex items-start gap-2 w-full text-left rounded-md px-2 py-1.5 -mx-2 bg-muted/50 hover:bg-muted transition-colors duration-150",
          FOCUS_RING,
        ].join(" ")}
      >
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">
              {sentence.keyExpression}
            </span>
            {sentence.cefrLevel && (
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                {sentence.cefrLevel}
              </span>
            )}
          </span>
          {!open && sentence.grammarNote && (
            <span className="block text-[0.6875rem] text-muted-foreground truncate mt-0.5">
              {sentence.grammarNote}
            </span>
          )}
        </span>
        <ChevronDown
          className={[
            "w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div id={panelId} className="mt-3 space-y-3 text-sm">
          {sentence.grammarNote && (
            <p className="text-muted-foreground leading-relaxed">
              {sentence.grammarNote}
            </p>
          )}

          {sentence.paraphrases && sentence.paraphrases.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                {t.paraphrases}
              </p>
              {sentence.paraphrases.map((p, i) => (
                <p
                  key={i}
                  className="text-foreground/80 leading-relaxed pl-3 border-l border-border"
                >
                  {p}
                </p>
              ))}
            </div>
          )}

          {sentence.usageContexts && sentence.usageContexts.length > 0 && (
            <div className="space-y-1">
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                {t.useWhen}
              </p>
              <ul className="space-y-1">
                {sentence.usageContexts.map((ctx, i) => (
                  <li
                    key={i}
                    className="text-muted-foreground leading-relaxed flex gap-2"
                  >
                    <span className="text-muted-foreground/50 shrink-0">·</span>
                    {ctx}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoteEditor({
  sentenceId,
  initialNote,
  t,
}: {
  sentenceId: Id<"savedSentences">;
  initialNote?: string;
  t: PageStrings;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNote ?? "");
  const updateNote = useMutation(api.mutations.sentences.updateNote);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    await updateNote({ sentenceId, note: value });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={[
          "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 rounded",
          FOCUS_RING_SM,
        ].join(" ")}
      >
        <Pencil className="w-3 h-3" />
        {value ? value : t.addNoteLabel}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
        className="flex-1 text-xs rounded border border-input bg-muted/40 px-2 py-1 focus:outline-none focus:border-ring"
        placeholder={t.notePlaceholder}
      />
      <button
        type="button"
        onClick={handleSave}
        aria-label={t.saveNoteAriaLabel}
        className={[
          "text-state-success hover:opacity-80 rounded",
          FOCUS_RING_SM,
        ].join(" ")}
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label={t.cancelAriaLabel}
        className={[
          "text-muted-foreground hover:text-foreground rounded",
          FOCUS_RING_SM,
        ].join(" ")}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function SentenceCard({
  sentence,
  t,
  onDelete,
  onRetry,
}: {
  sentence: SavedSentence;
  t: PageStrings;
  onDelete: (id: Id<"savedSentences">) => void;
  onRetry: (id: Id<"savedSentences">) => void;
}) {
  return (
    <article className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base leading-relaxed text-foreground font-medium flex-1">
          {sentence.text}
        </p>
        <button
          type="button"
          onClick={() => onDelete(sentence._id)}
          className={[
            "shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors duration-150",
            FOCUS_RING,
          ].join(" ")}
          aria-label={t.deleteSentenceAriaLabel}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        <span className="text-[0.6875rem] font-semibold border border-border rounded px-1.5 py-0.5 text-muted-foreground">
          {t.sources[sentence.source]}
        </span>

        {sentence.aiStatus === "pending" && <AIPendingBadge t={t} />}
        {sentence.aiStatus === "error" && (
          <AIErrorBadge t={t} onRetry={() => onRetry(sentence._id)} />
        )}

        <div className="ml-auto">
          <NoteEditor
            sentenceId={sentence._id}
            initialNote={sentence.note}
            t={t}
          />
        </div>
      </div>

      {sentence.aiStatus === "done" && <AIPanel sentence={sentence} t={t} />}
    </article>
  );
}

function EmptyState({
  t,
  onAdd,
}: {
  t: PageStrings;
  onAdd: () => void;
}) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
        <span className="text-2xl" aria-hidden="true">
          ✦
        </span>
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">{t.emptyTitle}</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          {t.emptyDesc}
        </p>
      </div>
      <Button variant="secondary" onClick={onAdd} className="mt-2">
        <Plus className="w-4 h-4" />
        {t.emptyAction}
      </Button>
    </div>
  );
}

export default function PhraseBankPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;

  const t = STRINGS[locale];

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<Source | null>(null);

  // Pending-delete: sentence grays out immediately; mutation fires after 5 s unless undone
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set()
  );
  const pendingDeleteTimers = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  const sentences = useQuery(api.queries.sentences.listSentences, {
    language: locale,
  });
  const deleteMutation = useMutation(api.mutations.sentences.deleteSentence);
  const retryMutation = useMutation(api.mutations.sentences.retryEnrichment);

  const isLoading = sentences === undefined;

  const activeSources = new Set((sentences ?? []).map((s) => s.source));

  const filtered = (sentences ?? []).filter((s) => {
    if (pendingDeleteIds.has(s._id)) return false;
    if (filterSource && s.source !== filterSource) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.text.toLowerCase().includes(q) ||
      (s.note ?? "").toLowerCase().includes(q) ||
      (s.keyExpression ?? "").toLowerCase().includes(q)
    );
  }) as SavedSentence[];

  const handleDelete = (id: Id<"savedSentences">) => {
    if (pendingDeleteIds.has(id)) return;

    setPendingDeleteIds((prev) => new Set([...prev, id]));

    const timer = setTimeout(() => {
      deleteMutation({ sentenceId: id });
      pendingDeleteTimers.current.delete(id);
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 5000);

    pendingDeleteTimers.current.set(id, timer);

    toast(t.sentenceRemoved, {
      action: {
        label: t.undo,
        onClick: () => {
          const timer = pendingDeleteTimers.current.get(id);
          if (timer) clearTimeout(timer);
          pendingDeleteTimers.current.delete(id);
          setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
      duration: 5000,
    });
  };

  const handleRetry = (id: Id<"savedSentences">) => {
    retryMutation({ sentenceId: id });
  };

  const hasSentences = (sentences?.length ?? 0) > 0;
  const dueCount = (sentences ?? []).filter(
    (s) =>
      s.aiStatus === "done" &&
      (!s.state ||
        s.state === "new" ||
        (s.due !== undefined && s.due <= Date.now()))
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <BackLink href={`/${locale}`}>{t.home}</BackLink>
          {hasSentences && (
            <Link
              href={`/${locale}/sentences/practice`}
              className={[
                "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded",
                FOCUS_RING_SM,
              ].join(" ")}
            >
              <Dumbbell className="w-4 h-4" />
              {t.practice}
              {dueCount > 0 && (
                <span className="bg-foreground text-card text-[0.6875rem] font-bold px-1.5 py-0.5 rounded tabular-nums">
                  {dueCount}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Title */}
        <div className="mb-8">
          <Eyebrow as="p" size="sm">
            {locale === "fr" ? "Français" : "English"}
          </Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 leading-tight">
            {t.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {t.pageSubtitle}
          </p>
        </div>

        {/* Add form toggle */}
        {!showForm && (
          <Button
            variant="secondary"
            onClick={() => setShowForm(true)}
            className="w-full justify-start gap-2 mb-6"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t.saveTrigger}</span>
          </Button>
        )}

        {showForm && (
          <div className="mb-6">
            <AddForm locale={locale} t={t} onSaved={() => setShowForm(false)} />
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={[
                "mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded",
                FOCUS_RING_SM,
              ].join(" ")}
            >
              {t.cancel}
            </button>
          </div>
        )}

        {/* Source filter — only when sentences exist from multiple sources */}
        {hasSentences && activeSources.size > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <button
              type="button"
              onClick={() => setFilterSource(null)}
              className={[
                "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150",
                FOCUS_RING,
                filterSource === null
                  ? "border-foreground bg-foreground text-card"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              ].join(" ")}
            >
              {t.filterAll}
            </button>
            {ALL_SOURCES.filter((s) => activeSources.has(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterSource(s === filterSource ? null : s)}
                className={[
                  "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150",
                  FOCUS_RING,
                  filterSource === s
                    ? "border-foreground bg-foreground text-card"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                ].join(" ")}
              >
                {t.sources[s]}
              </button>
            ))}
          </div>
        )}

        {/* Search — only when there are sentences */}
        {hasSentences && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors duration-150"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t.clearSearchAriaLabel}
                className={[
                  "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded",
                  FOCUS_RING_SM,
                ].join(" ")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-card border border-border rounded-xl p-5 animate-pulse"
              >
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasSentences && (
          <EmptyState t={t} onAdd={() => setShowForm(true)} />
        )}

        {/* No results for search / filter */}
        {!isLoading &&
          hasSentences &&
          filtered.length === 0 &&
          (search || filterSource) && (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t.noMatchIntro}
                {search ? `${t.noMatchSearchPrefix} «${search}»` : ""}
                {filterSource
                  ? ` ${t.noMatchIn} ${t.sources[filterSource]}`
                  : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterSource(null);
                }}
                className={[
                  "text-xs text-muted-foreground hover:text-foreground transition-colors rounded",
                  FOCUS_RING_SM,
                ].join(" ")}
              >
                {t.clearFilters}
              </button>
            </div>
          )}

        {/* Sentence list */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((sentence) => (
              <SentenceCard
                key={sentence._id}
                sentence={sentence}
                t={t}
                onDelete={handleDelete}
                onRetry={handleRetry}
              />
            ))}
          </div>
        )}

        {/* Count footer */}
        {!isLoading && hasSentences && (
          <p className="mt-8 text-xs text-muted-foreground text-center tabular-nums">
            {sentences!.length} {t.footerSaved}
            {dueCount > 0 && (
              <>
                {" · "}
                <Link
                  href={`/${locale}/sentences/practice`}
                  className="hover:text-foreground transition-colors underline underline-offset-2"
                >
                  {dueCount} {t.footerDue}
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
