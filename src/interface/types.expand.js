String.prototype.getQueryString = function(name, split) {
  if (split == undefined) split = "&";
  var rule =
    "(^|" + split + "|\\?)" + name + "=([^" + split + "#]*)(" + split + "|#|$)";
  var reg = new RegExp(rule),
    r;
  if ((r = this.match(reg))) return decodeURI(r[2]);
  return null;
};

/**
 * @return {number}
 */
String.prototype.sizeToNumber = function() {
  let _size_raw_match = this.match(
    /^(\d*\.?\d+)(.*[^ZEPTGMK])?([ZEPTGMK](B|iB))$/i
  );
  if (_size_raw_match) {
    let _size_num = parseFloat(_size_raw_match[1]);
    let _size_type = _size_raw_match[3];
    switch (true) {
      case /Zi?B/i.test(_size_type):
        return _size_num * Math.pow(2, 70);
      case /Ei?B/i.test(_size_type):
        return _size_num * Math.pow(2, 60);
      case /Pi?B/i.test(_size_type):
        return _size_num * Math.pow(2, 50);
      case /Ti?B/i.test(_size_type):
        return _size_num * Math.pow(2, 40);
      case /Gi?B/i.test(_size_type):
        return _size_num * Math.pow(2, 30);
      case /Mi?B/i.test(_size_type):
        return _size_num * Math.pow(2, 20);
      case /Ki?B/i.test(_size_type):
        return _size_num * Math.pow(2, 10);
      default:
        return _size_num;
    }
  }
  return 0;
};

/**
 * @return {number}
 */
String.prototype.timeToDays = function() {
  let t = this.replace(/weeks/ig, "W")
    .replace(/days/ig, "D")
    .replace(/months/ig, "M")
    .replace(/years/ig, "Y")
    .replace(/hours/ig, "H")
    .replace(/\s+/g, "");
  const timeMatch = t.match(/\d+[天日周月年时DWMYH]/g);
  let length = 0;
  if (timeMatch == null)
    return 0;
  
  timeMatch.forEach(time => {

    const timeMatch = time.match(/(\d+)([天日周月年时DWMYH])/);
    if (timeMatch == null)
      return 0;

    const number = parseInt(timeMatch[1])
    const unit = timeMatch[2]
    switch (true) {
      case unit === 'D':
      case unit === '天':
      case unit === '日':
        length += number;
        break;
      case unit === 'W':
      case unit === '周':
        length += number * 7;
        break;
      case unit === 'M':
      case unit === '月':
        length += number * 30;
        break;
      case unit === 'Y':
      case unit === '年':
        length += number * 365;
        break;
      case unit === 'H':
      case unit === '时':
        length += Math.floor(number / 24);
        break;
      default:
    }
  })
  return length;
};
