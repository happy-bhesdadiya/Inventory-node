require('dotenv').config();
const errorFunction = require('./../../utils/errorFunction');
const User = require('./../../models/user');
const Stock = require('./../../models/stock');
const Product = require('./../../models/product');
const ProductMapping = require('./../../models/productMapping');
const emailRegEx = RegExp(/^[a-zA-Z0-9._]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
const { securePassword } = require('../../utils/securePassword');
const { tokenGeneration } = require('../../utils/jwtTokens');
const Cryptr = require('cryptr');
const getUserFromSession = require('../../utils/getUser');
const { Sequelize } = require('../../utils/connect');
const cryptr = new Cryptr(process.env.SECRET_KEY);

const sevenDays = 7 * 24 * 60 * 60 * 1000;

const employeeLogin = async (req, res, next) => {
  try {
    const { email, password, is_admin } = req.body;
    if (emailRegEx.test(email) && password.length >= 8) {
      const employee = await User.findOne({
        where: { email: email, is_admin: is_admin },
      });
      if (employee) {
        const tokenOriginal = await tokenGeneration({ id: employee.id });
        const token = cryptr.encrypt(tokenOriginal);

        res.cookie('access-token', token, {
          maxAge: sevenDays,
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'none',
        });
        res.status(202);
        return res.json(
          errorFunction(false, 'Employee Logged In Successfully', {
            employee,
            token,
          })
        );
      } else {
        res.status(404);
        return res.json(errorFunction(true, 'Employee Not Found'));
      }
    } else {
      res.status(404);
      return res.json(errorFunction(true, 'Employee Not Found'));
    }
  } catch (error) {
    res.status(501);
    return res.json(errorFunction(true, 'Something Went Wrong'));
  }
};

const employeeSignUp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (emailRegEx.test(email)) {
      const existingEmployee = await User.findOne({ where: { email: email } });
      if (existingEmployee) {
        res.status(403);
        return res.json(errorFunction(true, 'Employee Already Exists'));
      } else {
        const hashedPassword = await securePassword(req.body.password);
        const newEmployee = await User.create({
          user_name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
          mobile_number: req.body.mobile_number,
          branch_id: req.body.branch_id,
          is_active: 1,
          is_admin: req.body.is_admin,
        });
        if (newEmployee) {
          const tokenOriginal = await tokenGeneration({ id: newEmployee.id });
          const token = cryptr.encrypt(tokenOriginal);

          res.cookie('access-token', token, {
            maxAge: sevenDays,
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'none',
          });
          res.status(201);
          return res.json(
            errorFunction(false, 'Employee Added Successfully', {
              newEmployee,
              token,
            })
          );
        } else {
          res.status(400);
          return res.json(errorFunction(true, 'Error Adding Employee'));
        }
      }
    } else {
      res.status(400);
      return res.json(errorFunction(true, 'Error Adding Employee'));
    }
  } catch (error) {
    res.status(501);
    console.log('Error Adding Employee : ', error);
    return res.json(errorFunction(true, 'Something Went Wrong', error));
  }
};

const employeeViewProfile = async (req, res, next) => {
  try {
    const employee = await getUserFromSession(req, res);
    if (employee) {
      res.status(200);
      return res.json(
        errorFunction(false, 'Showing Employee Details', employee)
      );
    } else {
      res.status(404);
      return res.json(errorFunction(true, 'Unauthenticated Employee'));
    }
  } catch (error) {
    res.status(501);
    return res.json(errorFunction(true, 'Something Went Wrong', error));
  }
};
const updateEmployeeProfile = async (req, res, next) => {
  try {
    console.log('Inside Update Profile');
    const employee = await getUserFromSession(req, res);
    console.log(employee.email);
    const existingEmployee = await User.findOne({
      where: { email: employee.email },
    });
    if (!existingEmployee) {
      res.status(404);
      return res.json(errorFunction(true, 'Employee Not Found'));
    }
    const hashedPassword = await securePassword(req.body.password);
    const c1 = await User.update(
      {
        user_name: req.body.name,
        mobile_number: req.body.mobile_number,
        password: hashedPassword,
        branch_id: req.body.branch_id,
        profile_pic: req.body.profile_pic,
        is_admin: req.body.is_admin,
        is_active: req.body.is_active,
      },
      {
        where: {
          email: req.body.email,
        },
      }
    );
    if (c1[0] === 1) {
      res.status(200);
      const emp = await User.findOne({ where: { email: employee.email } });
      return res.json(
        errorFunction(false, 'Employee Data Updated Succesfully', emp)
      );
    } else {
      res.status(404);
      return res.json(errorFunction(true, 'Employee Data  Not Updated '));
    }
  } catch (e) {
    res.status(501);
    return res.json(errorFunction(true, 'Something went wrong', e));
  }
};
const aquireProduct = async (req, res, next) => {
  const { stock_id } = req.body;
  try {
    const employee = await getUserFromSession(req, res);
    if (employee) {
      const isStockexistsandAvailable = await Stock.findOne({
        where: Sequelize.and({ id: stock_id }, { [available_qty.ne]: 0 }),
      });
      if (isStockexistsandAvailable) {
        for (var i in isStockexistsandAvailable.total_qty) {
          var checkname =
            isStockexistsandAvailable.product_name + ' ' + i.toString();
          const availableProduct = await Product.findOne({
            where: Sequelize.and(
              { product_name: checkname },
              { is_available: 1 }
            ),
          });
          if (availableProduct) {
            const newProductMap = await ProductMapping.create({
              product_id: availableProduct.id,
              assigned_to: employee.id,
              status: 'pending',
            });
            availableProduct.update({ is_available: 0 });
            res.status(200);
            return res.json(
              errorFunction(false, 'Your Request Has been sent to the Admin')
            );
          }
        }
      } else {
        res.status(404);
        return res.json(
          errorFunction(
            true,
            'Either This product is wrong or it is out of stock'
          )
        );
      }
    } else {
      res.status(404);
      return res.json(errorFunction(true, 'Unauthenticated Employee'));
    }
  } catch (error) {
    res.status(501);
    return res.json(errorFunction(true, 'Something Went Wrong', error));
  }
};







module.exports = {
  employeeLogin,
  employeeSignUp,
  employeeViewProfile,
  updateEmployeeProfile,
  aquireProduct,
 
};
