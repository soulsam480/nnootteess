import type { QueryOptions } from "genosdb";

export function noteQuery(address: string): QueryOptions {
  return {
    query: { type: { $in: ["note", "code"] }, owner: address },
    field: "created_at",
    order: "desc",
  };
}
