const smellObject = {
  1: "거의 없음",
  2: "약함",
  3: "중간",
  4: "강함",
};

const bloomingSeasonObject = {
  1: "봄",
  2: "여름",
  3: "가을",
  4: "겨울",
};

const brightnessObject = {
  1: "낮은 광도(300~800 Lux)",
  2: "중간 광도(800~1,500 Lux)",
  3: "높은 광도(1,500~10,000 Lux)",
};

const translateOptionToText = optionObj => {
  const translated = [];
  if (JSON.stringify(optionObj) === "{}") {
    return translated;
  }

  for (const [key, options] of Object.entries(optionObj)) {
    if (!options && key !== "search") break;

    if (key === "search") {
      const keyword = options;
      translated.push({
        $match: { plantName: { $regex: new RegExp(keyword) } },
      });
    }

    if (key === "brightness") {
      const brightnessParams = options.map(option => brightnessObject[option]);
      translated.push({ $match: { brightness: { $all: brightnessParams } } });
    }

    if (key === "smell") {
      const smellParams = options.map(option => smellObject[option]);
      translated.push({ $match: { smell: { $in: smellParams } } });
    }

    if (key === "bloomingSeason") {
      const bloomingSeasonParams = options.map(
        option => bloomingSeasonObject[option],
      );
      translated.push({
        $match: { bloomingSeason: { $in: bloomingSeasonParams } },
      });
    }

    if (key === "growthTemperature") {
      const growthTemperatureParams = options.map(option => Number(option));
      translated.push({
        $match: { growthTemperature: { $in: growthTemperatureParams } },
      });
    }

    if (key === "growthHeight") {
      const heightParams = options.map(option => {
        if (option === 15) {
          return {
            growthHeight: { $gt: option * 10 },
          };
        }
        return {
          growthHeight: { $gt: option * 10, $lte: (option + 5) * 10 },
        };
      });
      translated.push({ $match: { $or: heightParams } });
    }
  }
  return translated;
};

module.exports = translateOptionToText;
