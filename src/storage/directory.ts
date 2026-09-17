import { db } from "@/storage/db";
import { user } from "@/storage/user";
import { NodeObject, QueryOptions } from "genosdb";
import { Ref, shallowRef } from "vue";

interface Directory {
  type: "directory";
  name: string;
  created_at: number;
  owner: string;
  version: number;
}

const CURRENT_VERSION = 1;

const directories = shallowRef<Array<NodeObject<Directory>>>([]);

function makeQuery(userId: string) {
  return {
    query: {
      type: "directory",
      owner: { $eq: userId },
    },
    field: "created_at",
    order: "desc",
  } satisfies QueryOptions;
}

async function all(userId: string) {
  const { results } = await db().map(makeQuery(userId));

  return results;
}

export async function startDirectory(userId: string, isLoggedIn: Ref<boolean>) {
  async function sync() {
    if (!isLoggedIn.value) {
      return;
    }

    const state = await all(userId);

    directories.value = state;
  }

  await sync();

  db().map(makeQuery(userId), ({ action }) => {
    if (action !== "initial") {
      sync();
    }
  });

  return directories;
}

export async function createDirectory(name: string): Promise<NodeObject<Directory>> {
  const userId = user.id;

  if (!userId) {
    throw new Error("user not logged in");
  }

  const directoryId = await db().put({
    name,
    created_at: Date.now(),
    type: "directory",
    owner: userId,
    version: CURRENT_VERSION,
  } satisfies Directory);

  return await find(directoryId);
}

export async function find(id: string): Promise<NodeObject<Directory>> {
  const { result } = await db().get(id);

  if (!result) {
    throw new Error("directory not found");
  }

  return result;
}
