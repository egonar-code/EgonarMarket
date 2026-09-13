import { initSession } from "./api";

export const sessionReady = initSession().catch(() => null);
