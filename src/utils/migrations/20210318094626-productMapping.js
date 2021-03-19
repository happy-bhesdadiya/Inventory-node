'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('productMapping', {
      id:{
        type: Sequelize.INTEGER,
         autoIncrement: true,
        primaryKey:true,
           },
           product_id:{
            type:Sequelize.INTEGER,
            onDelete: 'CASCADE',
            references: {
              model: 'product',
              key: 'id'
            }
          },
          assigned_by:{
            type:Sequelize.INTEGER,
            onDelete: 'CASCADE',
            references: {
              model: 'user',
              key: 'id'
            }
          },
          assigned_to:{
            type:Sequelize.INTEGER,
            onDelete: 'CASCADE',
            references: {
              model: 'user',
              key: 'id'
            }
          },
          
      issued_date:{
        type: 'TIMESTAMP',
        allowNull: true
            },
      returned_date:{
        type: 'TIMESTAMP',
        allowNull: true
            }  ,
      status:Sequelize.STRING
        });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('productMapping');
  }
};
