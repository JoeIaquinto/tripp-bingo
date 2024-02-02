import CreateSquareForm from "./create-square-form";
import { getServerAuthSession } from "~/server/auth";
import { columns as categoryColumns } from "./categories-table-columns";
import { DataTable } from "../../_components/ui/data-table";
import Header from "~/app/header";
import { api } from "~/trpc/server";
import { columns as squareColumns } from "./squares-table-columns";
import CreateCategoryForm from "./create-category-form";

export default async function Admin() {
  const session = await getServerAuthSession();
  const categories = await api.baseSquares.listCategories.query();
  const squares = await api.baseSquares.listSquares.query();

  const categoryOptions = categories.map(category => {
    return {
      value: category.id,
      label: category.name,
    }
  });

  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <main className="">
      <Header />
      <div className="space-y-6 gap-4 ml-4 mb-4">
        <div className="flex flex-row gap-4 items-baseline ml-4">
          <CreateCategoryForm />
        </div>
        <div className="flex flex-row items-baseline ml-4">
          <CreateSquareForm categoryOptions={categoryOptions} />
        </div>
        <DataTable data={categories} columns={categoryColumns} colToFilter="name" />
        <DataTable data={squares} columns={squareColumns} colToFilter="description" />
      </div>
    </main>
  )
}
