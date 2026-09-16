import { redirect } from "next/navigation";

export default async function BoardFaceSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/board?open=${encodeURIComponent(slug)}`);
}
