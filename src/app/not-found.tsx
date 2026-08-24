import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <EmptyState
        icon={<FileQuestion className="size-5" />}
        title="That page does not exist"
        description="The component may have been renamed, or the link may be incomplete. The catalogue has everything in it."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="primary" size="sm">
              <Link href="/">Browse the catalogue</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/analytics/">Open analytics</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
