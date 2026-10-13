import type { Channel } from "./types";
/** A reserved channel keeps existing foreign keys and moderation working. */
export const OVERALL_ID = "feedback-overall-daet";
export const OVERALL_CHANNEL: Channel = {
  id: OVERALL_ID, slug: "overall-daet", name: "Overall Daet experience",
  category: "Civic", featured: false, cover: "/spots/bagasbas-surf.jpg",
  blurb: "Your whole visit, from arrival to the moments you take home.",
  about: "Feedback about the overall trip is kept separate from individual destinations.",
};
