const fToC = farenhaitTem => {
  const celsius = Math.floor(((farenhaitTem - 32) * 5) / 9) + 1;
  return celsius;
};

module.exports = fToC;
