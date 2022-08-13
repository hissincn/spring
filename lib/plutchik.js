const spring = require('./Ekman');

//Ekman==>Plutchik
const bridge = {
    PA: {
        joy: 3,
        surprise: 3
    },
    PE: {
        joy: 3,
        anticipation: 3
    },
    PD: {
        trust: 5,
        fear: 3,
        surprise: 3
    },
    PH: {
        joy: 3,
        trust: 3,
        anticipation: 3
    },
    PG: {
        joy: 1,
        trust: 3,
        fear: 3,
    },
    PB: {
        joy: 5,
        trust: 3,
        anticipation: 1
    },
    PK: {
        joy: 1,
        trust: 3,
        anticipation: 3
    },
    NA: {
        surprise: 3,
        anger: 5,
    },
    NB: {
        sadness: 3,
        disgust: 3,
        anticipation: 5
    },
    NJ: {
        fear: 3,
        surprise: 3,
        sadness: 3
    },
    NH: {
        joy: 3,
        fear: 3
    },
    PF: {
        trust: 3,
        fear: 1,
        surprise: 3,
        sadness: 3,
        disgust: 1,
        anticipation: 5
    },
    NI: {
        fear: 3,
        surprise: 1,
        anticipation: 3
    },
    NC: {
        fear: 5,
        surprise: 1,
        anticipation: 5
    },
    NG: {
        fear: 3,
        disgust: 5
    },
    NE: {
        fear: 1,
        surprise: 1,
        disgust: 1,
        anger: 3
    },
    ND: {
        disgust: 5,
        anger: 3
    },
    NN: {
        fear: 1,
        disgust: 5,
        anger: 3
    },
    NK: {
        sadness: 3,
        disgust: 3,
        anger: 3
    },
    NL: {
        surprise: 3,
        disgust: 3
    },
    PC: {
        surprise: 5,
        anticipation: 1
    }
}

//定义默认值
const defaultPlutchik = {
    joy: 2.5,
    trust: 2.5,
    fear: 2.5,
    surprise: 2.5,
    sadness: 2.5,
    disgust: 2.5,
    anger: 2.5,
    anticipation: 2.5
};


exports.plutchik = function(sentence) {

    //得到Plutchik模型集合
    let all = [];

    spring.Ekman(sentence).forEach(function(raw) {
        x = eval("bridge." + raw[0]);
        for (let key in x) {
            x[key] = x[key] * ((raw[1] + 1) / 10);
        }
        all.push(x);
    });

    //Plutchik模型集合相加
    if (all.length > 0) {
        let added = all.reduce((result, next) => {
            if (!result) result = {}
            Object.keys(next).forEach((key) => {
                result[key] = (result[key] ? result[key] : 0) + next[key]
            })
            return result
        })

        let addedTotal = 0;
        for (let i in added){
            addedTotal += added[i];
        }

        //处理&四舍五入保留一位小数
        for (let i in added) {
            added[i] = Math.round((added[i]/addedTotal) *5 * 10) / 10;
            //added[i] = Math.round(added[i] * 10) / 10;
        }

        //Plutchik总模型加入默认值&返回
        return {...defaultPlutchik, ...added };
    } else {
        return {...defaultPlutchik };
    }
}