const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Rag_message = sequelize.define('Rag_message', {
    input_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    response_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    author: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
});

module.exports = Rag_message;
