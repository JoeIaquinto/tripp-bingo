import { getServerAuthSession } from "~/server/auth";
import { DataTable } from "../../_components/ui/data-table";
import Header from "~/app/header";
import { api } from "~/trpc/server";
import { columns } from "./bingo-columns";
import CreatePatternForm from "./create-pattern-form";

export default async function BingoPatterns() {
  const session = await getServerAuthSession();
  const bingoPatterns = await api.bingoPatterns.listPatterns.query();

  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <main className="">
      <Header />
      <div className="space-y-6 gap-4 m-4">
        <div className="flex flex-row gap-4 items-baseline ml-4">
          <CreatePatternForm />
        </div>
        <DataTable data={bingoPatterns} columns={columns} colToFilter="name" />
      </div>
    </main>
  )
}
