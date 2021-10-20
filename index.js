
document.addEventListener('DOMContentLoaded', init, false);

// Initial set up, input event listener
function init() {
  const hexInput = document.querySelector(".hex-input")
  hexInput.addEventListener('keydown', function(e) {
  if (e.code === "Enter") {
    fetch('https://raw.githubusercontent.com/dariusk/corpora/master/data/colors/xkcd.json')
    .then(response => response.json())
    .then(data => {
          hexColorDelta(hexInput.value, data.colors);
      })
    }})
}


// Check if input entered is valid Hex code
// Regex taken from a StackOverflow post here:
// https://stackoverflow.com/questions/8027423/how-to-check-if-a-string-is-a-valid-hex-color-representation/8027444
function validHexInput(hexInput) {
  const isValid = /^#[0-9A-F]{6}$/i.test(hexInput);
  return isValid;
}


// This function is based on a StackOverflow post here:
// https://stackoverflow.com/questions/22692134/detect-similar-colours-from-hex-values
function convertToRGB(color) {

  if (color[0] === "#") {
    color = color.substring(1);
  }

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  return {
    r,
    g,
    b
  };
}

// This function is based on a StackOverflow post here:
// https://stackoverflow.com/questions/58058853/how-to-convert-rgb-or-hex-to-cmyk
function convertToCMYK(r, g, b) {

  // BLACK
  let computedK;
  if (r == 0 && g == 0 && b == 0) {
    computedK = 1;
    return {computedC: 0, computedM: 0, computedY:0, computedK:1};
  }

  let computedC = 1 - (r / 255);
  let computedM = 1 - (g / 255);
  let computedY = 1 - (b / 255);

  const minCMY = Math.min(computedC,
    Math.min(computedM, computedY));
  computedC = Math.round((computedC - minCMY) / (1 - minCMY) * 100);
  computedM = Math.round((computedM - minCMY) / (1 - minCMY) * 100);
  computedY = Math.round((computedY - minCMY) / (1 - minCMY) * 100);
  computedK = Math.round(minCMY * 100);

  return {
    computedC,
    computedM,
    computedY,
    computedK
  };
}


// This function is based on the StackOverflow post here:
// https://stackoverflow.com/questions/22692134/detect-similar-colours-from-hex-values
function hexColorDelta(hexInput, colors) {

  const errorMessage = document.querySelector(".error-message");

  if (!validHexInput(hexInput)) {
    errorMessage.style.display = "block";
    document.querySelector("table.color-table").classList.remove("visible");
    document.querySelector(".user-color-box").style.display = "none";
    console.log("Invalid!");
    return null;
  }

  errorMessage.style.display = "none";

  // get red/green/blue int values of the hex input
  let userColorRGB = convertToRGB(hexInput);
  const {r:r1, g:g1, b:b1} = userColorRGB;

  // get red/green/blue int values of each color in the data set,
  // compare to user input color and calculate similar colors
  let similarColors = colors.map(function(color) {

    const hexColorRGB = convertToRGB(color.hex);

    const {r:r2, g:g2, b:b2 } = hexColorRGB;

    // Add RGB to color properties
    color["RGB"] = `${r2}, ${g2}, ${b2}`;

    // Calculate and add CMYK to color properties
    const cmykColor = convertToCMYK(r2, g2, b2);
    const {computedC: c, computedM: m, computedY: y, computedK: k} = cmykColor;

    color["CMYK"] = `${c}, ${m}, ${y}, ${k}`

    // Calculate differences between reds, greens and blues
    let r = 255 - Math.abs(r1 - r2);
    let g = 255 - Math.abs(g1 - g2);
    let b = 255 - Math.abs(b1 - b2);

    // Limit differences between 0 and 1
    r /= 255;
    g /= 255;
    b /= 255;

    // Get similarity score, closer to 1 = greater similarity
    const similarityScore = (r + g + b) / 3;
    color["similarity"] = similarityScore;

    return color

  }).sort(function(a, b) {
    // Sort the colors from most to least similar
    return a.similarity > b.similarity ? -1 : 1;
  })

  // Get the top 50 colors
  const topColors = similarColors.slice(0, 50);
  buildTable(topColors, hexInput);

}

function buildTable(colors, userInput) {
  const table = document.querySelector(".color-table");
  const colorData = document.querySelector(".color-data");

  // Reset table in case data has been added previously
  colorData.innerHTML = "";

  const userColorBox = document.querySelector(".user-color-box");

  // Add the color data to the table
  colors.map(function(color) {

    // Capitalise first letter of color name, ready to insert into table
    const capName = `${color.color.charAt(0).toUpperCase()}${color.color.substring(1)}`;
    // Add a new row for each color
    colorData.innerHTML +=
      ` <tr>
          <td style="background-color:${color.hex}"></td>
          <td>${capName}</td>
          <td>${color.hex}</td>
          <td>${color.RGB}</td>
          <td>${color.CMYK}</td>
          <td>${(color.similarity * 100).toFixed(2)}%</td>
        </tr>`
  })

  table.classList.add("visible")
  userColorBox.style.display = "unset";
  userColorBox.style.backgroundColor= userInput;

}
