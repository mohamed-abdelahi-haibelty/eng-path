import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
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

const STATE_FROM_ENUM: Record<number, "new" | "learning" | "review" | "relearning"> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

export const rateCard = mutation({
  args: {
    flashcardId: v.id("flashcards"),
    rating: v.union(
      v.literal("again"),
      v.literal("hard"),
      v.literal("good"),
      v.literal("easy")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in to review flashcards.");
    }

    const fc = await ctx.db.get(args.flashcardId);
    if (!fc) {
      throw new AppException("NOT_FOUND", "Flashcard not found.");
    }
    if (fc.userId !== userId) {
      throw new AppException("UNAUTHORIZED", "Not your flashcard.");
    }

    const f = fsrs();
    const now = new Date();

    // FSRS requires difficulty=0 && stability=0 to initialize a new card.
    // Normalize cards that were persisted with difficulty>0 but stability=0 (legacy bad state).
    const isUninitializedNew = fc.state === "new" && fc.stability === 0;
    const card: Card = {
      due: new Date(fc.due),
      stability: isUninitializedNew ? 0 : fc.stability,
      difficulty: isUninitializedNew ? 0 : fc.difficulty,
      elapsed_days: fc.elapsedDays,
      scheduled_days: fc.scheduledDays,
      reps: fc.reps,
      lapses: fc.lapses,
      learning_steps: 0,
      state: STATE_TO_ENUM[fc.state] ?? State.New,
      last_review: fc.lastReview ? new Date(fc.lastReview) : undefined,
    };

    const rating = RATING_MAP[args.rating];
    const schedulingCards = f.repeat(card, now) as unknown as Record<
      number,
      { card: Card; log: { elapsed_days: number } }
    >;
    const { card: next, log } = schedulingCards[rating];

    const nextState = STATE_FROM_ENUM[next.state] ?? "new";

    await ctx.db.patch(fc._id, {
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

    await ctx.db.insert("flashcardReviews", {
      userId,
      flashcardId: fc._id,
      rating: args.rating,
      reviewedAt: now.getTime(),
      elapsedDays: log.elapsed_days,
    });

    return { nextDue: next.due.getTime() };
  },
});
