import PageWrapper from "./page-wrapper";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  return <PageWrapper searchParams={searchParams} />;
}
