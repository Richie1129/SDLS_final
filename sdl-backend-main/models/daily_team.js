const { DataTypes} = require('sequelize');
const sequelize = require('../util/database');

const Daily_team = sequelize.define('daily_team', {
    
    title:{
        type: DataTypes.TEXT,
        allowNull:false,
    },
    content:{
        type: DataTypes.TEXT,
        allowNull:false,
    },
    fileData:{
        type: DataTypes.BLOB,
        allowNull:true,
    },
    filename:{
        type: DataTypes.TEXT,
        allowNull:true,
    },
    creator:{
        type: DataTypes.TEXT,
        allowNull:false,
    }
});

module.exports = Daily_team;