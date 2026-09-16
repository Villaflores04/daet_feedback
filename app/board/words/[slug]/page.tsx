import { redirect } from "next/navigation";

export default async function BoardWordSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/board/words?open=${encodeURIComponent(slug)}`);
}
