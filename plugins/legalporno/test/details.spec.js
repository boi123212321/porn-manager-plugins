const plugin = require("../main");
const { expect } = require("chai");
const { createPluginRunner } = require("../../../context");

const runPlugin = createPluginRunner("legalporno", plugin);

const fixture = require("./basic.fixture");

describe("Legalporno", () => {
  it("Should get scene info from scene name", async () => {
    const result = await runPlugin({
      sceneName:
        "DAP Destination Vanessa Vega 4on1 First Time DAP with Balls Deep Anal, DAP, Gapes and Facial GIO1421",
    });
    expect(result.name).to.equal(
      "DAP Destination Vanessa Vega 4on1 First Time DAP with Balls Deep Anal, DAP, Gapes and Facial GIO1421"
    );
    expect(result.custom).to.deep.equal({
      "Shoot ID": "GIO1421",
      "Scene ID": "GIO1421",
    });
    expect(result.releaseDate).to.equal(1584057600000);
    expect(result.description).to.be.undefined;
    expect(result.actors).to.deep.equal([
      "Michael Fly",
      "Neeo",
      "Rycky Optimal",
      "Thomas Lee",
      "Vanessa Vega",
    ]);
    expect(result.labels).to.deep.equal([
      "3+ on 1",
      "anal",
      "average anal gape",
      "blowjob",
      "bra",
      "brunette",
      "deep throat",
      "double anal (DAP)",
      "facial cumshot",
      "first time",
      "gapes (gaping asshole)",
      "heavily tattooed",
      "high heels",
      "indoor",
      "outie pussy lips",
      "shaved pussy hair",
      "shorts",
      "slim body",
      "small ass",
      "small tits",
      "stockings",
      "straight hair",
      "tall height",
      "triangular anal gape",
      "very long hair",
      "white skin",
    ]);
  });
});