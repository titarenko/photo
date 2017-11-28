module.exports = function lpadz (it) {
  it = it.toString()
  return it.length === 1 ? '0' + it : it
}
