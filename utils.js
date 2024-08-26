import { setTimeout as sleep } from "timers/promises";
import { randomInt } from "crypto";

export const randomSleep = async (ms, accuracy = ms / 5) => sleep(randomInt(ms - accuracy, ms + accuracy));

export async function fetchData(url, init) {
  const response = await fetch(url, init);
  console.log(url, " ", response.status);
  return await response.json();
}
