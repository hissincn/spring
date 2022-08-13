const cutter = require("@node-rs/jieba");
const dict = require('./Ekman_dict.json');

exports.Ekman = function(sentence) {

    let result = [];

    cutter.cut(sentence).forEach(function(word) {

        if (dict.hasOwnProperty(word)) {

            searched = dict[word];

            if (searched.length == 3) {
                [p1, v1, s1] = searched;
                result.push([p1, v1, s1]);

            } else if (searched.length == 6) {
                [p1, v1, s1, p2, v2, s2] = searched;
                result.push([p1, v1, s1]);
                result.push([p2, v2, s2]);
            }
        }
    });

    return result;

}