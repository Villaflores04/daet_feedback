import { NextResponse } from "next/server";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase";
import { polarityFromComment } from "@/lib/polarity";
import { tooManyPulses } from "@/lib/ratelimit";
import { EMOJIS, ratingFromEmoji, sentimentFromEmoji } from "@/lib/sentiment";

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spotId = searchParams.get("spotId");
  const db = supabasePublic();
  let q = db.from("feedback").select("*, spots(name, slug)").order("created_at", { ascending: false }).limit(200);
  if (spotId) q = q.eq("spot_id", spotId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "The pulse could not be saved.", detail: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  if (tooManyPulses(clientIp(req))) {
    return NextResponse.json({ error: "Please wait before sending another pulse." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const display_name = String(body.display_name || "").trim();
  const comment = String(body.comment || "").trim();
  const emoji = String(body.emoji || "");
  const spot_id = String(body.spot_id || "");
  const rawRating = body.rating == null || body.rating === "" ? null : Number(body.rating);
  const usedStars = rawRating === 1 || rawRating === 2 || rawRating === 3 || rawRating === 4 || rawRating === 5;
  const rating = usedStars ? rawRating : ratingFromEmoji(emoji);
  if (display_name.length < 2 || display_name.length > 40) {
    return NextResponse.json({ error: "Set a public name (2-40 characters) first." }, { status: 400 });
  }
  if (!spot_id) return NextResponse.json({ error: "Choose a place before sending your pulse.", field: "spot_id" }, { status: 400 });
  if (!EMOJIS.includes(emoji as (typeof EMOJIS)[number])) {
    return NextResponse.json({ error: "Pick one emotion: 😞 😐 🙂 🤩.", field: "emoji" }, { status: 400 });
  }
  if (comment.length < 8 || comment.length > 600) {
    return NextResponse.json({ error: "Tell us a little more — your comment needs 8–600 characters.", field: "comment" }, { status: 400 });
  }
  let db;
  try { db = supabaseAdmin(); } catch { db = supabasePublic(); }
  const { data: spot } = await db.from("spots").select("id").eq("id", spot_id).maybeSingle();
  if (!spot) return NextResponse.json({ error: "That tourism spot was not found." }, { status: 400 });
  const row = {
    spot_id, display_name, rating, emoji,
    sentiment: sentimentFromEmoji(emoji),
    comment_sentiment: polarityFromComment(comment),
    comment,
    rating_source: usedStars ? "star" : "emoji_fallback"
  };
  let { data, error } = await db.from("feedback").insert(row).select("*, spots(name, slug)").single();
  if (error && /rating_source|comment_sentiment/i.test(error.message)) {
    const fallback = { spot_id, display_name, rating, emoji, sentiment: sentimentFromEmoji(emoji), comment };
    const retry = await db.from("feedback").insert(fallback).select("*, spots(name, slug)").single();
    data = retry.data; error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
