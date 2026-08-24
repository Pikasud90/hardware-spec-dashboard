import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_COMPONENTS, COMPONENT_BY_SLUG } from "@/lib/catalog";
import { ComponentDetail } from "@/components/detail/component-detail";
import { CATEGORY_SHORT_LABELS } from "@/lib/validations/component";

interface PageProps {
  // Next 15 delivers route params asynchronously.
  params: Promise<{ slug: string }>;
}

/**
 * Every component gets a pre-rendered page at build time, which is what lets
 * the static export work without a server — and what makes each spec sheet a
 * real, linkable URL rather than client-side state.
 */
export function generateStaticParams() {
  return ALL_COMPONENTS.map((component) => ({ slug: component.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const component = COMPONENT_BY_SLUG.get(slug);
  if (!component) return { title: "Component not found" };

  return {
    title: component.name,
    description: `${CATEGORY_SHORT_LABELS[component.category]} specifications, derived metrics and category placement for the ${component.name}.`,
  };
}

export default async function ComponentPage({ params }: PageProps) {
  const { slug } = await params;
  const component = COMPONENT_BY_SLUG.get(slug);
  if (!component) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <ComponentDetail component={component} />
    </div>
  );
}
