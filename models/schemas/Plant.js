const { Schema } = require("mongoose");

const PlantSchema = new Schema({
  contentNumber: Number,
  plantName: String,
  fileRoute: String,
  imageFileName: Array,
  thumbnailFileName: Array,
  distributionName: {
    type: String,
    default: "",
  },
  originInfo: {
    type: String,
    default: "",
  },
  growthHeight: {
    type: Number,
    default: 0,
  },
  smell: {
    type: String,
    default: "",
  },
  toxicity: {
    type: String,
    default: "",
  },
  manageLevel: {
    type: String,
    default: "",
  },
  growthTemperature: {
    type: Number,
    default: 0,
  },
  winterTemperature: {
    type: String,
    default: "",
  },
  humidity: {
    type: String,
    default: "",
  },
  waterCycle: Array,
  specialManage: {
    type: String,
    default: "",
  },
  functionalInfo: {
    type: String,
    default: "",
  },
  growthType: Array,
  bloomingSeason: Array,
  fruitsSeason: {
    type: Number,
    default: 0,
  },
  brightness: Array,
});

module.exports = PlantSchema;
