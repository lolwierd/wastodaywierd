import { Suspense } from "react";
import ClientPage from "./client-page";

type PageWrapperProps = {
  searchParams?: Promise<Record<string, string>>;
};

export default async function PageWrapper({ searchParams }: PageWrapperProps) {
  const spObj = searchParams ? await searchParams : {};

  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 flex flex-col items-center justify-center gap-8">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <ClientPage initialSearchParams={spObj} />
    </Suspense>
  );
}
