const { hitokoto } = require("./hitokoto");
const { Sequelize, DataTypes } = require('sequelize');

const need = 10;
const cache = 5;
const gap = 200;
var allList = [];

const sequelize = new Sequelize('spring', 'root', 'Hantianze2005519', {
    host: 'localhost',
    dialect: 'mysql'
});
const data = sequelize.define('data', {
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
    provenance: DataTypes.STRING,
    author: DataTypes.STRING,
    source: DataTypes.STRING,
    para: DataTypes.JSON,

}, {
    timestamps: false,
    freezeTableName: true,
});

function dbPusher(results) {
    all = results.map(function(x) {
        return {
            content: x.content,
            provenance: x.provenance,
            author: x.author,
            source: x.source,
            para: x.para,
        }
    });

    return data.bulkCreate(all, {
        //updateOnDuplicate: ['content'],
    });
}
var puller = setInterval(function() {

    if (allList.length < need) {
        hitokoto().then(results => allList.push(results)).catch(err => err);
    } else {
        clearInterval(puller);
    }

    if ((allList.length % cache == 0 && allList.length != 0) || allList.length >= need) {
        let cacheList = [...allList];
        dbPusher(cacheList.splice((Math.floor(allList.length / cache) - 1) * cache, cache))
            .then(function(p) {
                console.log('created:' + cache + '\n all:' + allList.length);
            })
            .catch(function(err) {
                clearInterval(puller);
                console.log('failed: ' + err);
            });
    }
    //console.log(allList);
}, gap);