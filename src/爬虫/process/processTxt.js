const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('spring', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
const hitokoto = sequelize.define('hitokoto', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    content: {
        type: DataTypes.STRING(65535),
        unique: true,
        allowNull: false,
    },
    author: DataTypes.STRING,
    source: DataTypes.STRING,
    type: DataTypes.STRING,

}, {
    timestamps: false,
    freezeTableName: true,
});


fs.readFile('D:/Project/Spring/Sentense/src/hitokoto.txt', 'utf8', function(err, data) {
    if (err) {
        return console.log('读取失败', err)
    }

    var result = [...new Set(data.split('\n'))];
    all = result.map(function(x) {
        return {
            content: x,
        }
    });
    hitokoto.bulkCreate(all, {
        updateOnDuplicate: ['content'],
    });
})