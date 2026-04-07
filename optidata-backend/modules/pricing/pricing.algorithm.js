function calculateRecommendedPrice(product) {
  const { cost, totalSales, recentSales } = product;

  const BASE_MARGIN = 1.8;
  let demandFactor = 1;

  if (recentSales > 20) demandFactor = 1.2;
  else if (recentSales > 10) demandFactor = 1.1;
  else if (recentSales > 5) demandFactor = 1.0;
  else demandFactor = 0.9;

  if (totalSales < 10) {
    demandFactor *= 0.9;
  }

  const recommendedPrice = cost * BASE_MARGIN * demandFactor;

  return {
    recommendedPrice: Number(recommendedPrice.toFixed(2)),
    demandFactor
  };
}

module.exports = { calculateRecommendedPrice };