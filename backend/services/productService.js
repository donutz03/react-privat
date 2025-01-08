const { readFile, writeFile } = require('../utils/fileHelpers');
const { isExpired, isNearExpiration } = require('../utils/dateHelpers');
const config = require('../config/config');

const moveExpiredProducts = (username) => {
  const foods = readFile(config.FILES.foods);
  const foodsUnavailable = readFile(config.FILES.foodsUnavailable);
  const expiredProducts = readFile(config.FILES.expiredProducts);

  if (!expiredProducts[username]) {
    expiredProducts[username] = [];
  }

  if (foods[username]) {
    const [expired, valid] = foods[username].reduce(([exp, val], food) => {
      return isExpired(food.expirationDate) 
        ? [[...exp, food], val]
        : [exp, [...val, food]];
    }, [[], []]);
    
    foods[username] = valid;
    expiredProducts[username].push(...expired);
  }

  if (foodsUnavailable[username]) {
    const [expired, valid] = foodsUnavailable[username].reduce(([exp, val], food) => {
      return isExpired(food.expirationDate)
        ? [[...exp, food], val]
        : [exp, [...val, food]];
    }, [[], []]);
    
    foodsUnavailable[username] = valid;
    expiredProducts[username].push(...expired);
  }

  writeFile(config.FILES.foods, foods);
  writeFile(config.FILES.foodsUnavailable, foodsUnavailable);
  writeFile(config.FILES.expiredProducts, expiredProducts);

  return {
    available: foods[username] || [],
    unavailable: foodsUnavailable[username] || [],
    expired: expiredProducts[username] || []
  };
};

module.exports = {
  moveExpiredProducts
};