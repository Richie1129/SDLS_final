const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');
const Question_message = sequelize.define('question_message', {
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    }

});


module.exports = Question_message;