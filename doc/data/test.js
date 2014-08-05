console.log("Timestamp,Browser,OS");

for (var d = 1; d <= 31; d++) {
for (var h = 0; h <  24; h++) {
for (var m = 0; m < 60; m++) {
for (var s = 0; s < 60; s++) {
    var data = ",Chrome,Windows";
    var r = Math.ceil(Math.random() * 9);
    switch (r) {
        case 0:
        case 1: data = ',Chrome,OSX';      break;
        case 2: data = ',Chrome,Linux';    break;
        case 3: data = ',Firefox,Windows'; break;
        case 4: data = ',Firefox,Linux';   break;
        case 5: data = ',Firefox,OSX';     break;
        case 6: data = ',Safari,OSX';      break;
        case 7: data = ',IE,Windows';      break;
    }

    var _d = d < 10 ? '0' + d : d;
    var _h = h < 10 ? '0' + h : h;
    var _m = m < 10 ? '0' + m : m;
    var _s = s < 10 ? '0' + s : s;

    console.log('2014-07-' + _d + 'T' + _h + ':' + _m + ':' + _s + '.000Z' + data);
}
}
}
}
