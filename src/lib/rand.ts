import dayjs from "dayjs";
import gen from "random-seed";

export function getRandomSeed() {
  return gen.create(dayjs().format());
}

export function getRandomElement<T>(arr: T[], randomSeed: gen.RandomSeed) {
  return arr[randomSeed.intBetween(0, arr.length - 1)]!;
}