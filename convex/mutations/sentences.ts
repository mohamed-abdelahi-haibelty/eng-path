import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fsrs, type Card, Rating, State } from "ts-fsrs";
import { AppException } from "../../lib/errors";

const RATING_MAP: Record<string, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const STATE_TO_ENUM: Record<string, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

const STATE_FROM_ENUM: Record<
  number,
  "new" | "learning" | "review" | "relearning"
> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

export const saveSentence = mutation({
  args: {
    language: v.union(v.literal("en"), v.literal("fr")),
    text: v.string(),
    source: v.union(
      v.literal("reading"),
      v.literal("speaking"),
      v.literal("writing"),
      v.literal("listening"),
      v.literal("manual")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");

    const trimmed = args.text.trim();
    if (!trimmed) throw new AppException("VALIDATION_ERROR", "Sentence cannot be empty.");

    const id = await ctx.db.insert("savedSentences", {
      userId,
      language: args.language,
      text: trimmed,
      source: args.source,
      note: args.note,
      aiStatus: "pending",
      savedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.sentences.enrichSentence, {
      sentenceId: id,
      text: trimmed,
      language: args.language,
    });

    return id;
  },
});

export const deleteSentence = mutation({
  args: {
    sentenceId: v.id("savedSentences"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");

    const sentence = await ctx.db.get(args.sentenceId);
    if (!sentence) throw new AppException("NOT_FOUND", "Sentence not found.");
    if (sentence.userId !== userId)
      throw new AppException("UNAUTHORIZED", "Not your sentence.");

    await ctx.db.delete(args.sentenceId);
  },
});

export const updateNote = mutation({
  args: {
    sentenceId: v.id("savedSentences"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");

    const sentence = await ctx.db.get(args.sentenceId);
    if (!sentence) throw new AppException("NOT_FOUND", "Sentence not found.");
    if (sentence.userId !== userId)
      throw new AppException("UNAUTHORIZED", "Not your sentence.");

    await ctx.db.patch(args.sentenceId, { note: args.note || undefined });
  },
});

export const rateSentence = mutation({
  args: {
    sentenceId: v.id("savedSentences"),
    rating: v.union(
      v.literal("again"),
      v.literal("hard"),
      v.literal("good"),
      v.literal("easy")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");

    const sentence = await ctx.db.get(args.sentenceId);
    if (!sentence) throw new AppException("NOT_FOUND", "Sentence not found.");
    if (sentence.userId !== userId)
      throw new AppException("UNAUTHORIZED", "Not your sentence.");

    const f = fsrs();
    const now = new Date();

    const isNew = !sentence.state || sentence.state === "new";
    const card: Card = {
      due: sentence.due ? new Date(sentence.due) : now,
      stability: isNew ? 0 : (sentence.stability ?? 0),
      difficulty: isNew ? 0 : (sentence.difficulty ?? 0),
      elapsed_days: sentence.elapsedDays ?? 0,
      scheduled_days: sentence.scheduledDays ?? 0,
      reps: sentence.reps ?? 0,
      lapses: sentence.lapses ?? 0,
      learning_steps: 0,
      state: STATE_TO_ENUM[sentence.state ?? "new"] ?? State.New,
      last_review: sentence.lastReview
        ? new Date(sentence.lastReview)
        : undefined,
    };

    const rating = RATING_MAP[args.rating];
    const schedulingCards = f.repeat(card, now) as unknown as Record<
      number,
      { card: Card; log: { elapsed_days: number } }
    >;
    const { card: next } = schedulingCards[rating];
    const nextState = STATE_FROM_ENUM[next.state] ?? "new";

    await ctx.db.patch(args.sentenceId, {
      stability: next.stability,
      difficulty: next.difficulty,
      elapsedDays: next.elapsed_days,
      scheduledDays: next.scheduled_days,
      reps: next.reps,
      lapses: next.lapses,
      state: nextState,
      due: next.due.getTime(),
      lastReview: now.getTime(),
    });

    return { nextDue: next.due.getTime() };
  },
});

export const retryEnrichment = mutation({
  args: {
    sentenceId: v.id("savedSentences"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");

    const sentence = await ctx.db.get(args.sentenceId);
    if (!sentence) throw new AppException("NOT_FOUND", "Sentence not found.");
    if (sentence.userId !== userId)
      throw new AppException("UNAUTHORIZED", "Not your sentence.");

    await ctx.db.patch(args.sentenceId, { aiStatus: "pending" });

    await ctx.scheduler.runAfter(0, internal.actions.sentences.enrichSentence, {
      sentenceId: args.sentenceId,
      text: sentence.text,
      language: sentence.language,
    });
  },
});

export const storeEnrichment = internalMutation({
  args: {
    sentenceId: v.id("savedSentences"),
    keyExpression: v.optional(v.string()),
    grammarNote: v.optional(v.string()),
    paraphrases: v.optional(v.array(v.string())),
    usageContexts: v.optional(v.array(v.string())),
    cefrLevel: v.optional(v.string()),
    blankWord: v.optional(v.string()),
    status: v.union(v.literal("done"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const { sentenceId, status, ...fields } = args;
    await ctx.db.patch(sentenceId, {
      aiStatus: status,
      ...(status === "done" ? fields : {}),
    });
  },
});
