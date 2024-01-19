import CreateSquareForm from "./create-square-form";
import { getServerAuthSession } from "~/server/auth";
import ResetSquaresDialog from "./reset-squares";
import { columns } from "./squares-table-columns";
import { DataTable } from "../../_components/ui/data-table";
import { db } from "~/server/db";
import Header from "~/app/header";

export default async function Admin() {
  const session = await getServerAuthSession();
  const squares = await db.bingoSquare.findMany({});

  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <main className="">
      <Header />
      <div className="space-y-6 gap-4 ml-4 mb-4">
        <div className="flex flex-row gap-4 items-baseline ml-4">
          <CreateSquareForm />
          <ResetSquaresDialog />
        </div>
        <DataTable data={squares} columns={columns} colToFilter="content" />
      </div>
    </main>
  )
}
