module.exports = function uniq (items) {
  const known = {}, unique = []
  for (let i of items) {
    if (known[i]) {
      continue
    }
    known[i] = true
    unique.push(i)
  }
  return unique
}
