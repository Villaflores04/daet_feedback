"use client";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function validKey(value: unknown) {
  const key = String(value || "");
  return key.length >= 16 && key.length <= 120;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spotId = searchParams.get("spotId");
  const visitorKey = searchParams.get("visitorKey") || "";

  if (!spotId) {
    return NextResponse.json({ error: "Missing spotId" }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();
    const { data: feedbackRows, error: feedbackError } = await db
      .from("feedback")
      .select("id")
      .eq("spot_id", spotId)
      .limit(200);

    if (feedbackError) throw feedbackError;

    const ids = (feedbackRows ?? []).map((row) => row.id);
    if (!ids.length) return NextResponse.json([]);

    const [{ data: reactions, error: reactionError }, { data: replies, error: replyError }] = await Promise.all([
      db
        .from("feedback_reactions")
        .select("feedback_id, visitor_key, reaction")
        .in("feedback_id", ids),
      db
        .from("feedback_replies")
        .select("id, feedback_id, visitor_key, display_name, comment, created_at")
        .in("feedback_id", ids)
        .order("created_at", { ascending: true })
    ]);

    if (reactionError) throw reactionError;
    if (replyError) throw replyError;

    const reactionMap = new Map<string, { agree: number; disagree: number; mine: string | null }>();

    for (const row of reactions ?? []) {
      const current = reactionMap.get(row.feedback_id) ?? {
        agree: 0,
        disagree: 0,
        mine: null
      };

      if (row.reaction === "agree") current.agree += 1;
      if (row.reaction === "disagree") current.disagree += 1;
      if (visitorKey && row.visitor_key === visitorKey) current.mine = row.reaction;

      reactionMap.set(row.feedback_id, current);
    }

    const replyMap = new Map<string, Array<{
      id: string;
      feedback_id: string;
      visitor_key: string;
      display_name: string;
      comment: string;
      created_at: string;
    }>>();

    for (const row of replies ?? []) {
      const current = replyMap.get(row.feedback_id) ?? [];
      current.push(row);
      replyMap.set(row.feedback_id, current);
    }

    return NextResponse.json(
      ids.map((id) => ({
        feedback_id: id,
        reactions: reactionMap.get(id) ?? {
          agree: 0,
          disagree: 0,
          mine: null
        },
        replies: replyMap.get(id) ?? []
      }))
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Community data unavailable."
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const feedbackId = String(body.feedback_id || "");
  const visitorKey = String(body.visitor_key || "");

  if (!feedbackId || !validKey(visitorKey)) {
    return NextResponse.json({ error: "Invalid community request." }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();

    const { data: feedback } = await db
      .from("feedback")
      .select("id")
      .eq("id", feedbackId)
      .maybeSingle();

    if (!feedback) {
      return NextResponse.json({ error: "Pulse not found." }, { status: 404 });
    }

    if (action === "reaction") {
      const reaction = body.reaction === "agree" || body.reaction === "disagree"
        ? body.reaction
        : null;

      if (!reaction) {
        return NextResponse.json({ error: "Pick agree or disagree." }, { status: 400 });
      }

      const { data: existing } = await db
        .from("feedback_reactions")
        .select("id, reaction")
        .eq("feedback_id", feedbackId)
        .eq("visitor_key", visitorKey)
        .maybeSingle();

      if (existing?.reaction === reaction) {
        const { error } = await db
          .from("feedback_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else if (existing) {
        const { error } = await db
          .from("feedback_reactions")
          .update({ reaction })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("feedback_reactions")
          .insert({ feedback_id: feedbackId, visitor_key: visitorKey, reaction });
        if (error) throw error;
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "reply") {
      const displayName = String(body.display_name || "").trim();
      const comment = String(body.comment || "").trim();

      if (displayName.length < 2 || displayName.length > 40) {
        return NextResponse.json({ error: "Set a public name first." }, { status: 400 });
      }

      if (comment.length < 2 || comment.length > 400) {
        return NextResponse.json({ error: "Reply must be 2–400 characters." }, { status: 400 });
      }

      const { data, error } = await db
        .from("feedback_replies")
        .insert({
          feedback_id: feedbackId,
          visitor_key: visitorKey,
          display_name: displayName,
          comment
        })
        .select("id, feedback_id, visitor_key, display_name, comment, created_at")
        .single();

      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Community action failed."
      },
      { status: 500 }
    );
  }
}
