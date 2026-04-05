const pricingService = require("./pricing.service");

// 🔍 Obtener recomendación de precio
async function getPricing(req, res) {
  try {
    const { id } = req.params;

    const data = await pricingService.getPricingByProduct(id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// 🚀 Aplicar precio recomendado
async function applyPrice(req, res) {
  try {
    const { id } = req.params;

    const result = await pricingService.applyPricing(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
async function getReport(req, res) {
  try {
    const report = await pricingService.getPricingReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function applyAllPrices(req, res) {
  try {
    const result = await pricingService.applyPricingToAll();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
module.exports = {
  getPricing,
  applyPrice,
  getReport,
  applyAllPrices
};