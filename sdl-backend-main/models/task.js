const {DataTypes} = require('sequelize');
const sequelize = require('../util/database');
const Tag = require('./tag');

const Task = sequelize.define('task', {
    title: {
        type: DataTypes.TEXT,
        allowNull:false
    }, 
    content: {
        type: DataTypes.TEXT,
        allowNull:false
    },
    labels: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull:true
    }, 
    owner:{
        type: DataTypes.TEXT,
        allowNull:false
    }, 
    assignees: {
        type: DataTypes.ARRAY(DataTypes.JSONB),
        allowNull:true
    },
    image: {
        type: DataTypes.BLOB, // 使用 BLOB 儲存圖片二進制數據
        allowNull: true,
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
        allowNull: true,
    },    
}, {
    timestamps: true // ✅ 確保啟用了 Sequelize 自動生成 `createdAt` 和 `updatedAt`
});

Task.belongsToMany(Tag, {through:"Card_Tag"});
Tag.belongsToMany(Task, {through:"Card_Tag"});

module.exports = Task;