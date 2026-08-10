import { boot } from "@/boot";
import { LocalStorage } from "@/storage/local";

const storage = new LocalStorage("chrome");

boot(storage);
