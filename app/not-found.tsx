import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/shell/PageHeader";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Not found" title="That page does not exist" lede="The lesson or mission you were looking for is not published, or the link is wrong." />
      <LinkButton href="/curriculum" variant="secondary">
        Browse the curriculum
      </LinkButton>
    </div>
  );
}
