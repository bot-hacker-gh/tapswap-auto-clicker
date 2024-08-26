const { setTimeout: sleep } = require("timers/promises");
const { randomInt } = require("crypto");

module.exports.randomSleep = async (ms, accuracy = ms / 5) => sleep(randomInt(ms - accuracy, ms + accuracy));

module.exports.fetchData = async function fetchData(url, init) {
  const response = await fetch(url, init);
  console.log(url, " ", response.status);
  return await response.json();
};
