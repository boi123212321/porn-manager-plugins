function lowercase(str) {
  return str.toLowerCase();
}

// NIST Metric to Imperial conversion chart:
// https://www.nist.gov/pml/weights-and-measures/approximate-conversions-metric-us-customary-measures

function cmToFt(cm) {
  cm *= 0.0328;
  return Math.round((cm + Number.EPSILON) * 100) / 100;
}

function kgToLbs(kg) {
  kg *= 2.20;
  return Math.round((kg + Number.EPSILON) * 100) / 100;
}

module.exports = async ({
  $createImage,
  args,
  $axios,
  $moment,
  $cheerio,
  $throw,
  $log,
  actorName,
}) => {
  if (!actorName)
    $throw("Uh oh. You shouldn't use the plugin for this type of event");

  $log(
    `Scraping freeones date for ${actorName}, dry mode: ${args.dry || false}...`
  );

  const blacklist = (args.blacklist || []).map(lowercase);
  if (!args.blacklist) $log("No blacklist defined, returning everything...");

  function isBlacklisted(prop) {
    return blacklist.includes(lowercase(prop));
  }

  //Check imperial unit preference
  const useImperial = args.useImperial;
  if (!useImperial) {
    $log("Imperial preference not set. Using metric values...");
  } else {
    $log("Imperial preference indicated. Using imperial values...");
  }

  /* const petiteThreshold = parseInt(args.petiteThreshold) || 160; */

  const url = `https://freeones.xxx/${actorName.replace(/ /g, "-")}/profile`;
  let html;
  try {
    html = (await $axios.get(url)).data;
  } catch (e) {
    $throw("Error fetching url: " + e.message);
  }

  const $ = $cheerio.load(html);

  function getNationality() {
    if (isBlacklisted("nationality")) return {};
    $log("Getting nationality...");

    const selector = $(
      '[data-test="section-personal-information"] a[href*="countryCode%5D"]'
    );

    if (!selector.length) {
      $log("Nationality not found");
      return {};
    }

    const nationality = $(selector).attr("href").split("=").slice(-1)[0];
    if (!nationality) {
      return {};
    }
    return {
      nationality,
    };
  }

  function getHeight() {
    if (isBlacklisted("height")) return {};
    $log("Getting height...");

    const selector = $('[data-test="link_height"] .text-underline-always');
    if (!selector) return {};

    const rawHeight = $(selector).text();
    const cm = rawHeight.match(/\d+cm/)[0];
    if (!cm) return {};
    let height = parseInt(cm.replace("cm", ""));
    if (!useImperial) return { height };

    // Convert to imperial
    return { height: cmToFt(height) };
  }

  function getWeight() {
    if (isBlacklisted("weight")) return {};
    $log("Getting weight...");

    const selector = $('[data-test="link_weight"] .text-underline-always');
    if (!selector) return {};

    const rawWeight = $(selector).text();
    const kg = rawWeight.match(/\d+kg/)[0];
    if (!kg) return {};
    let weight = parseInt(kg.replace("kg", ""));
    if (!useImperial) return { weight };

    // Convert to imperial
    return { weight: kgToLbs(weight) };
  }

  function getZodiac() {
    if (isBlacklisted("zodiac")) return {};
    $log("Getting zodiac sign...");

    const selector = $('[data-test="link_zodiac"] .text-underline-always');
    if (!selector) return {};
    const zodiacText = $(selector).text();
    const zodiac = zodiacText.split(" (")[0];
    return { zodiac };
  }

  function getBirthplace() {
    if (isBlacklisted("birthplace")) return {};
    $log("Getting birthplace...");

    const selector = $(
      '[data-test="section-personal-information"] a[href*="placeOfBirth"]'
    );
    const cityName = selector.length
      ? $(selector).attr("href").split("=").slice(-1)[0]
      : null;

    if (!cityName) {
      $log("No birthplace found");
      return {};
    } else {
      const stateSelector = $(
        '[data-test="section-personal-information"] a[href*="province"]'
      );
      const stateName = stateSelector.length
        ? $(stateSelector).attr("href").split("=").slice(-1)[0]
        : null;
      if (!stateName) {
        $log("No birth province found, just city!");
        return { birthplace: cityName };
      } else {
        let bplace = cityName + ", " + stateName.split("-")[0].trim();
        return { birthplace: bplace };
      }
    }
  }
  
  function getBirthplace() {
    if (isBlacklisted("birthplace")) return {};
    $log("Getting birthplace...");

    const citySelector = $('[data-test="section-personal-information"] a[href*="placeOfBirth"]');
	let cityName = "";
	if (citySelector) {
		cityName = citySelector.length ? $(citySelector).attr("href").split("=").slice(-1)[0] : null;
	}
	
	const stateSelector = $('[data-test="section-personal-information"] a[href*="province"]');
	
	let stateName = "";
	if (stateSelector) {
		stateName = stateSelector.length ? $(stateSelector).attr("href").split("=").slice(-1)[0] : null;
	}
	
	if (cityName && stateName) {
		return { birthplace: [cityName, stateName].join(", ") };
	}
	
	if (cityName) {
		return { birthplace: cityName };
	}
	
	if (stateName) {
		return { birthplace: stateName };
	}
  }

  function scrapeText(prop, selector) {
    if (isBlacklisted(prop)) return {};
    $log(`Getting ${prop}...`);

    const el = $(selector);
    if (!el) return {};

    return { [prop]: el.text() };
  }

  async function getAvatar() {
    if (args.dry) return {};
    if (isBlacklisted("avatar")) return {};
    $log("Getting avatar...");

    const imgEl = $(".profile-header .img-fluid");
    if (!imgEl) return {};

    const url = $(imgEl).attr("src");
    const imgId = await $createImage(url, `${actorName} (avatar)`);

    return { avatar: imgId };
  }

  function getAge() {
    if (isBlacklisted("bornOn")) return {};
    $log("Getting age...");

    const aTag = $('[data-test="section-personal-information"] a');
    if (!aTag) return {};

    const href = $(aTag).attr("href");
    const yyyymmdd = href.match(/\d\d\d\d-\d\d-\d\d/);

    if (yyyymmdd && yyyymmdd.length) {
      const date = yyyymmdd[0];
      const timestamp = $moment(date, "YYYY-MM-DD").valueOf();
      return {
        bornOn: timestamp,
      };
    } else {
      $log("Could not find actor birth date.");
      return {};
    }
  }

  function getMeasurements() {
    if (isBlacklisted("measurements")) return {};
    $log("Getting measurements...");

    const braSelector = $('[data-test="p-measurements"] a[href*="%5Bbra%5D"]');
    let braSize = "";
    let chestSize = "";
    let cupSize = "";
    if (braSelector) {
      braSize = braSelector.length
        ? braSelector.attr("href").split("=").slice(-1)[0]
        : null;
	}
	if (braSize) {
      chestSize = braSize.substr(0, 2);
      cupSize = braSize.substr(2, 1);
    }

    const waistSelector = $('[data-test="p-measurements"] a[href*="%5Bwaist%5D"]');
    let waistSize = "";
    if (waistSelector) {
      waistSize = waistSelector.length
		? waistSelector
			.attr("href")
			.split("=")
			.slice(-1)[0]
			.split(",")
			.slice(-1)[0]
		: null;
    }

    const hipSelector = $('[data-test="p-measurements"] a[href*="%5Bhip%5D"]');
    let hipSize = "";
    if (hipSelector) {
      hipSize = hipSelector.length
        ? hipSelector
            .attr("href")
            .split("=")
            .slice(-1)[0]
            .split(",")
            .slice(-1)[0]
        : null;
    }

    const fullMeasurements = [braSize, waistSize, hipSize].join("-");

    return {
      bra: braSize,
      chest: chestSize,
      cupsize: cupSize,
      waist: waistSize,
      hips: hipSize,
      measurements: fullMeasurements,
    };
  }

  function getAlias() {
    if (isBlacklisted("aliases")) return {};
    $log("Getting aliases...");

    const alias_sel = $(
      '[data-test="section-alias"] p[data-test*="p_aliases"]'
    );
    const alias_text = alias_sel.text();
    const alias_name =
      alias_text && !/unknown/.test(alias_text) ? alias_text.trim() : null;
    if (!alias_name) return {};
    const alias_fin = alias_name.split(/,\s*/g);

    return { aliases: alias_fin };
  }

  function getCareer() {
    if (isBlacklisted("career")) return {};
    $log("Getting career info...");

    const careerSelector = $(".timeline-horizontal p.m-0");
    if (!careerSelector) return {};

    let careerStart = $(careerSelector[0]).text();
    if (careerStart === "Begin") {
      careerStart = "";
    }
    let careerEnd = $(careerSelector[1]).text();
    if (careerEnd === "Now") {
      careerEnd = "";
    }

    return {
      started: careerStart,
      ended: careerEnd,
    };
  }

  const custom = {
    ...scrapeText(
      "hair color",
      '[data-test="link_hair_color"] .text-underline-always'
    ),
    ...scrapeText(
      "eye color",
      '[data-test="link_eye_color"] .text-underline-always'
    ),
    ...scrapeText(
      "ethnicity",
      '[data-test="link_ethnicity"] .text-underline-always'
    ),
    ...scrapeText("tattoos", '[data-test="p_has_tattoos"]'),
    ...scrapeText("piercings", '[data-test="p_has_piercings"]'),
    ...getHeight(),
    ...getWeight(),
    ...getBirthplace(),
    ...getZodiac(),
    ...getMeasurements(),
    ...getCareer(),
  };

  const data = {
    ...getNationality(),
    ...getAge(),
    ...getAlias(),
    ...scrapeText("description", '[data-test="p_additional_information"]'),
    ...(await getAvatar()),
    custom,
  };

  if (!blacklist.includes("labels")) {
    data.labels = [];
    if (custom["hair color"]) data.labels.push(`${custom["hair color"]} Hair`);
    if (custom["eye color"]) data.labels.push(`${custom["eye color"]} Eyes`);
    if (custom.ethnicity) data.labels.push(custom.ethnicity);
    /* if (custom.height && custom.height <= petiteThreshold)
      data.labels.push("Petite"); */
  }

  if (args.dry === true) {
    $log("Would have returned:", data);
    return {};
  }
  return data;
};
