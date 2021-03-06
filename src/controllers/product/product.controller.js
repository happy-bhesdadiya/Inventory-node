const Stock = require('./../../models/stock');
const errorFunction = require('./../../utils/errorFunction');

const getStock = async (req, res, next) => {
  try {
    const stock = await Stock.findAll();

    if (stock) {
      res.status(200);
      return res.json(
        errorFunction(false, 'Fetching Stocks Successfully!', stock)
      );
    } else {
      res.status(404);
      return res.json(errorFunction(true, 'Stock not found!'));
    }
  } catch (e) {
    res.status(501);
    return res.json(errorFunction(true, 'Something went wrong', e));
  }
};

const getStockId = async (req, res) => {
  try {
    const stock = await Stock.findOne({ where: { id: req.params.id } });

    if (stock) {
      res.status(200);
      return res.json(
        errorFunction(false, 'Getting Stock Successfully!', stock)
      );
    } else {
      res.status(404);
      return res.json(errorFunction(true, 'Stock not found!'));
    }
  } catch (e) {
    res.status(501);
    return res.json(errorFunction(true, 'Something went wrong', e));
  }
};

module.exports = {
  getStock,
  getStockId,
};
