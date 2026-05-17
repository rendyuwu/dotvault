export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">
        Provider Detail
      </h1>
      <p className="mt-2 text-[var(--color-text-dim)]">
        Viewing provider <span className="font-mono text-[var(--color-accent)]">{id}</span>
      </p>
    </div>
  );
}
