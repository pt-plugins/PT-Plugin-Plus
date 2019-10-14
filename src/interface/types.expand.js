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
