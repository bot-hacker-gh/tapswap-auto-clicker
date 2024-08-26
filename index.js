const puppeteer = require("puppeteer");
const { randomInt } = require("crypto");
const { fetchData, randomSleep } = require("./utils");

const input = process.env.TOKEN;

const urlRexExp = new RegExp(
  /https?:\/\/(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&\/\/=]*)/gi
);

try {
  const url = input.match(urlRexExp)[0];

  class User {
    constructor(url) {
      this.url = url;
    }

    getCtx() {
      if (!this.ctx || !this.token) throw new Error("you need to login first");
      return this.ctx;
    }

    async login() {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.setViewport({ width: 412, height: 915 });
      await page.goto(this.url, { timeout: 60000 });
      await page.waitForFunction("window.ctx && window.ctx._authToken");
      const result = await page.evaluate(() => {
        const ctx = window.ctx;
        return {
          token: ctx._authToken,
          id: ctx.player.id,
          headers: Object.fromEntries(ctx.api._context.headers),
          player: ctx._player._data,
        };
      });
      await browser.close();

      if (!result) throw new Error("failed to login");
      console.log("successfully logged in");
      this.ctx = result;
      this.token = "Bearer " + result.token;
    }

    async post(path, body = {}) {
      const ctx = this.getCtx();

      return await fetchData("https://api.tapswap.club/api" + path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...ctx.headers,
          "content-id": ((ctx.id * Date.now()) % ctx.id).toString(),
          authorization: this.token,
        },
        body: JSON.stringify(body),
      });
    }

    async tap(count) {
      return await this.post("/player/submit_taps", { taps: count, time: Date.now() });
    }

    async boost(type) {
      const ctx = this.getCtx();

      const result = await this.post("/player/apply_boost", { type });
      ctx.player.energy = result.player.energy;
      return result;
    }

    async boostAddon(type) {
      return await this.post("/player/apply_boost_addon", { type });
    }

    async fullTap() {
      const ctx = this.getCtx();
      const remindingTaps = Math.floor(ctx.player.energy / ctx.player.energy_level);
      if (remindingTaps > 0) await this.tap(remindingTaps);
    }

    async getBoosts() {
      const ctx = this.getCtx();

      const canAddonEnergy = !ctx.player.boost[0].addons_cnt;
      const totalEnergyBoosts = ctx.player.boost[0].cnt;
      for (let i = 0; i < totalEnergyBoosts + canAddonEnergy; i++) {
        if (i === totalEnergyBoosts) {
          await this.boostAddon("energy");
          await randomSleep(2000);
        }
        await this.boost("energy");
        await randomSleep(1000);
        await this.fullTap();
      }

      const canAddonTurbo = !ctx.player.boost[1].addons_cnt;
      const totalTurboBoosts = ctx.player.boost[1].cnt;
      for (let i = 0; i < totalTurboBoosts + canAddonTurbo; i++) {
        if (i === totalTurboBoosts) {
          await this.boostAddon("turbo");
          await randomSleep(2000);
        }
        await this.boost("turbo");
        for (let i = 0; i < 6; i++) {
          await randomSleep(2700);
          await this.tap(randomInt(900, 1000));
        }
        await randomSleep(7050, 1);
      }
    }
  }

  async function main() {
    const user = new User(url);
    await user.login();
    await user.fullTap();
    await randomSleep(2000);
    await user.getBoosts();
  }
  main();
} catch (err) {
  console.log("error");
}
