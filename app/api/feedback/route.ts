import { NextResponse } from "next/server";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase";
import { polarityFromComment } from "@/lib/polarity";
import { EMOJIS, ratingFromEmoji, sentimentFromEmoji } from "@/lib/sentiment";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const spotId = searchParams.get("spotId");
  const client = supabasePublic();
  let q = client.from("feedback").select("*, spots(name, slug)").order("created_at", { ascending: false }).limit(200);
  if (spotId) q = q.eq("spot_id", spotId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const display_name = String(body.display_name || "").trim();
  const comment = String(body.comment || "").trim();
  const emoji = String(body.emoji || "");
  const rating = Number(body.rating) || ratingFromEmoji(emoji);
  const spot_id = String(body.spot_id || "");
  if (display_name.length < 2 || display_name.length > 40) {
    return NextResponse.json({ error: "Set a profile name (2-40 characters) first." }, { status: 400 });
  }
  if (!spot_id) return NextResponse.json({ error: "Choose a spot." }, { status: 400 });
  if (![1, 2, 3, 4, 5].includes(rating)) {
    return NextResponse.json({ error: "Rating must be 1-5." }, { status: 400 });
  }
  if (!EMOJIS.includes(emoji as (typeof EMOJIS)[number])) {
    return NextResponse.json({ error: "Pick a mood emoji." }, { status: 400 });
  }
  if (comment.length < 8 || comment.length > 600) {
    return NextResponse.json({ error: "Comment must be 8–600 characters." }, { status: 400 });
  }

  const row = {
    spot_id,
    display_name,
    rating,
    emoji,
    sentiment: sentimentFromEmoji(emoji),
    comment_sentiment: polarityFromComment(comment),
    comment
  };

  let client;
  try {
    client = supabaseAdmin();
  } catch {
    client = supabasePublic();
  }

  let { data, error } = await client.from("feedback").insert(row).select("*, spots(name, slug)").single();
  if (error && /comment_sentiment/i.test(error.message)) {
    const fallback = { spot_id, display_name, rating, emoji, sentiment: sentimentFromEmoji(emoji), comment };
    const retry = await client.from("feedback").insert(fallback).select("*, spots(name, slug)").single();
    data = retry.data;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
