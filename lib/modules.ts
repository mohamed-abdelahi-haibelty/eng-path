import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

type UnitBySlug = NonNullable<
  FunctionReturnType<typeof api.queries.unit.unitBySlug>
>;

export type UnitModule = UnitBySlug["modules"][number];
export type ModuleName = UnitModule["name"];
