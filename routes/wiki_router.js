const express = require("express");
const router = express.Router();
const { Plant } = require("../models");
const translateOptionToText = require("../util/translateSearchOption");

router.get("/search", async (req, res) => {
  try {
    const { page, count, ...filterOption } = req.query;
    const pageNumber = Number(page) || 1;
    const plantCount = Number(count) || 20;

    const translated = translateOptionToText(filterOption);
    const [total, plants] = await Promise.all([
      Plant.aggregate(translated).sort({ plantName: 1 }),
      Plant.aggregate(translated)
        .sort({ plantName: 1 })
        .skip(plantCount * (pageNumber - 1))
        .limit(plantCount),
    ]);

    if (!plants) {
      return res.status(205).json({ isOk: false, message: "empty" });
    }

    return res.status(200).json({ isOk: true, total: total.length, plants });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ isOk: false });
  }
});

router.get("/recommend", async (req, res) => {
  try {
    const { ...filterOption } = req.query;

    const translated = translateOptionToText(filterOption);

    const plants = await Plant.aggregate(translated).sort({ plantName: 1 });

    if (!plants) {
      return res.status(205).json({ isOk: false, message: "empty" });
    }
    const range = plants.length;
    let selectedPlant;
    if (range > 2) {
      const target = Math.floor(Math.random() * range);
      const second = target === range - 1 ? target - 1 : target + 1;
      selectedPlant = [plants[target], plants[second]];
    } else {
      selectedPlant = [...plants];
    }

    return res.status(200).json({ isOk: true, plants: selectedPlant });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ isOk: false });
  }
});

module.exports = router;
