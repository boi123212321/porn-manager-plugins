import $cheerio from "cheerio";

import { ActorContext, ActorOutput } from "../../types/actor";

interface MyContext extends ActorContext {
  args: {
    dry?: boolean;
  };
}

export default async function (ctx: MyContext): Promise<ActorOutput> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { args, $axios, $logger, $formatMessage, actorName, $createImage } = ctx;

  const name = actorName
    .replace(/#/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  $logger.info(`Scraping actor info for '${name}', dry mode: ${args?.dry || false}...`);

  const url = `https://www.adultempire.com/allsearch/search?q=${name}`;
  const html = (await $axios.get(url)).data;
  const $ = $cheerio.load(html);

  const firstResult = $(`a.boxcover[label="Performer"]`).toArray()[0];
  const href = $(firstResult).attr("href");

  if (href) {
    const actorUrl = `https://adultempire.com${href}`;
    const html = (await $axios.get<string>(actorUrl)).data;
    const $ = $cheerio.load(html);

    let thumbnail: string | undefined;

    const images = $(`a.fancy`).toArray();

    const firstImageResult = images[0];
    const thumbnailUrl = $(firstImageResult).attr("href");

    if (thumbnailUrl) {
      thumbnail = await $createImage(thumbnailUrl, `${actorName} (thumbnail)`);
    }

    let hero;

    const secondImageResult = images[1];
    const heroUrl = $(secondImageResult).attr("href");

    if (heroUrl) {
      hero = await $createImage(heroUrl, `${actorName} (hero image)`);
    }

    let description;

    const descEl = $(".text-md");
    if (descEl) {
      description = descEl.children().remove("div").end().text().trim();
    }

    let aliases: string[] = [];

    const aliasEl = $("#content .row .col-sm-5 .m-b-1");

    if (aliasEl) {
      const text = aliasEl.text();
      aliases = text
        .replace("Alias: ", "")
        .split(",")
        .map((s) => s.trim());
    }

    const result = {
      thumbnail,
      $ae_thumbnail: thumbnailUrl,
      hero,
      $ae_hero: heroUrl,
      aliases,
      description,
    };

    if (args?.dry) {
      $logger.info(`Would have returned ${$formatMessage(result)}`);
      return {};
    } else {
      return result;
    }
  }

  return {};
}
