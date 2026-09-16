import type { Channel, Pulse } from "./types";

export const SEED_CHANNELS: Channel[] = [
  {
    id: "ch-bagasbas",
    slug: "bagasbas-beach",
    name: "Bagasbas Beach",
    category: "Coast",
    featured: true,
    cover: "/spots/bagasbas-surf.jpg",
    blurb:
      "Long dark-sand surfing beach on the Pacific side of Daet. Dawn glass-off and the town's most photographed horizon.",
    about:
      "Bagasbas faces due east, so first light hits the water before it hits town. The sand is volcanic and cool underfoot. Surfers work the regular Pacific swell; kiteboarders take the wind that runs the coast. Walk north along the boulevard when the tide is out — the town's postcard is this horizon, not a resort wall.",
  },
  {
    id: "ch-cathedral",
    slug: "cathedral-st-john",
    name: "Cathedral of St. John the Baptist",
    category: "Heritage",
    featured: true,
    cover: "/spots/st-john.jpg",
    blurb:
      "Daet mother church. Franciscan stone, evening mass light, and the civic pulse of the old town plaza.",
    about:
      "Raised by Franciscan friars in 1611, the Parroquia de San Juan Bautista is one of the oldest churches in Camarines Norte. The plaza in front is still the town's evening room — bells, vendors, and the slow civic shuffle. Go at dusk if you want the stone to work.",
  },
  {
    id: "ch-rizal",
    slug: "first-rizal-monument",
    name: "First Rizal Monument",
    category: "Heritage",
    featured: false,
    cover: "/spots/rizal.jpg",
    blurb:
      "The earliest known monument to Jose Rizal in the Philippines, raised in Daet in 1898 — a pylon, not a standing statue.",
    about:
      "Lt. Col. Antonio Sanz and Ildefonso Alegre of the Philippine Revolutionary Army built this three-tiered stone pylon from mortar and boulders of the old Spanish jail. It was unveiled on 30 December 1898, years before the Luneta statue. Stand close. It is quieter than the national story that grew around it.",
  },
  {
    id: "ch-mercedes",
    slug: "mercedes-island-views",
    name: "Mercedes Island Views",
    category: "Island",
    featured: true,
    cover: "/spots/mercedes.jpg",
    blurb:
      "Jump-off from Daet toward Apuao and Canimog. Sandbars, outrigger crossings, and gin-clear shallows.",
    about:
      "Daet is the jump-off; Mercedes holds the islands. Apuao Grande and Pequeña, Canimog with its lighthouse, Caringo, Canton — the Siete Pecados circuit. Hire a bangka, watch the tide, and walk the sandbar when it appears. This is the Pacific's quieter room, twenty minutes from the capitol lawn.",
  },
  {
    id: "ch-capitol",
    slug: "provincial-capitol",
    name: "Camarines Norte Provincial Capitol",
    category: "Civic",
    featured: false,
    cover: "/spots/capitol.jpg",
    blurb:
      "The formal seat of the province. Grounds, flags, and a working picture of Camarines Norte governance.",
    about:
      "Daet is the provincial capital, and the capitol grounds are part of the civic walk — lawn, portico, and the slow business of a Bicol province. Pair it with the First Rizal Monument a few minutes away. It is not a theme park. It is the town doing its job.",
  },
  {
    id: "ch-park",
    slug: "friendship-park",
    name: "Friendship Park",
    category: "Park",
    featured: false,
    cover: "/spots/friendship-park.jpg",
    blurb:
      "Shaded civic park in the heart of Daet — trees, path, and the afternoon crowd.",
    about:
      "Friendship Park is the town's living room when the beach is too far and the plaza is too loud. Acacia shade, a walking path, benches that fill after school. Families linger; joggers cut through. Keep it as a park, not a parking lot.",
  },
];

export const SEED_PULSES: Pulse[] = [];
