const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');
const QuestionMessage = require('./question_message');

const Question = sequelize.define('question', {
    title: {
        type: DataTypes.TEXT,
        allowNull: false
    }
    // ,
    // userId: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     references: {
    //         model: 'user', // 注意这里使用字符串指向模型名
    //         key: 'id'
    //     }
    // },
    // projectId: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    //     references: {
    //         model: 'project', // 注意这里使用字符串指向模型名
    //         key: 'id'
    //     }
    // }
});
Question.hasMany(QuestionMessage, {
    foreignKey: 'questionId',
    onDelete: 'CASCADE'
});
QuestionMessage.belongsTo(Question, {
    foreignKey: 'questionId'
});
module.exports = Question;