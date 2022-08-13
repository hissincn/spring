const data = require('./data.json');

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('spring', 'root', 'Hantianze2005519', {
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
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    author: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    source: DataTypes.STRING,
    type: DataTypes.STRING,


}, {
    timestamps: false,
    freezeTableName: true,
});


all = data.map(function(x) {
    return {
        content: x.content,
        author: x.author,
        source: x.source,
        type: x.type,
    }
});


//var neww = all.slice(4000, 8000);

//console.log(neww);

hitokoto.bulkCreate(all, {
    updateOnDuplicate: ['content'],
}).catch(function(err) {
    console.error(err);
});