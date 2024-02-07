import { getServerAuthSession } from "~/server/auth";
import { DataTable } from "../../../_components/ui/data-table";
import Header from "~/app/header";
import { api } from "~/trpc/server";
import { columns } from "./line-columns";
import CreatePatternLineForm from "./create-line-form";

export default async function Page({ params }: { params: {id: string} }) {
  const session = await getServerAuthSession();
  const bingoId = parseInt(params.id);

  const bingoLinePatterns = await api.bingoPatterns.getLinesForPattern.query({
    id: bingoId
  });
  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <main className="">
      <Header />
      <div className="space-y-6 gap-4 m-4">
        <div className="flex flex-row gap-4 items-baseline ml-4">
          <CreatePatternLineForm bingoId={bingoId} />
        </div>
        <DataTable data={bingoLinePatterns} columns={columns} colToFilter="id" />
      </div>
    </main>
  )
}
