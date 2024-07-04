// How the hell are you not supposed to split up files?
// Idk I don't know how you're supposed to do any of this.

// These are utilities for creating color gradients.
function hex (c) {
    var s = "0123456789abcdef";
    var i = parseInt (c);
    if (i == 0 || isNaN (c))
      return "00";
    i = Math.round (Math.min (Math.max (0, i), 255));
    return s.charAt ((i - i % 16) / 16) + s.charAt (i % 16);
}
  

  /* Convert an RGB triplet to a hex string */
  function convertToHex (rgb) {
    return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
  }
  
  /* Remove '#' in color hex string */
  function trim (s) { return (s.charAt(0) == '#') ? s.substring(1, 7) : s }
  
  /* Convert a hex string to an RGB triplet */
  function convertToRGB (hex) {
    var color = [];
    color[0] = parseInt ((trim(hex)).substring (0, 2), 16);
    color[1] = parseInt ((trim(hex)).substring (2, 4), 16);
    color[2] = parseInt ((trim(hex)).substring (4, 6), 16);
    return color;
  }
  
  export function generateColor(colorStart,colorEnd,colorCount){
  
      // The beginning of your gradient
      var start = convertToRGB (colorStart);    
  
      // The end of your gradient
      var end   = convertToRGB (colorEnd);    
  
      // The number of colors to compute
      var len = colorCount;
  
      //Alpha blending amount
      var alpha = 0.0;
  
      var saida = [];
      
      for (let i = 0; i < len; i++) {
          var c = [];
          alpha += (1.0/len);
          
          c[0] = start[0] * alpha + (1 - alpha) * end[0];
          c[1] = start[1] * alpha + (1 - alpha) * end[1];
          c[2] = start[2] * alpha + (1 - alpha) * end[2];
  
          saida.push(convertToHex (c));
          
      }
      
      return saida;
      
  }

  export function colorNameToHex(color) {
    // Create a temporary element
    var tempDiv = document.createElement("div");
    // Set the color
    tempDiv.style.color = color;
    // Append the element to the document
    document.body.appendChild(tempDiv);

    // Get the computed style of the element
    var computedColor = window.getComputedStyle(tempDiv).color;

    // Remove the temporary element
    document.body.removeChild(tempDiv);

    // Convert the RGB color to hex
    var rgb = computedColor.match(/\d+/g);
    var hex = "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1).toUpperCase();

    return hex;
}

// These are utilities for dealing with how big text is.
/**
  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  * 
  * @param {String} text The text to be rendered.
  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  * 
  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  */
 export function getTextWidth(text, font) {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

export function getTextHeight(font = 'monospace') {

    var text = $('<span>Hg</span>').css({ fontFamily: font });
    var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

    var div = $('<div></div>');
    div.append(text, block);

    var body = $('body');
    body.append(div);

    try {

        var result = {};

        block.css({ verticalAlign: 'baseline' });
        result.ascent = block.offset().top - text.offset().top;

        block.css({ verticalAlign: 'bottom' });
        result.height = block.offset().top - text.offset().top;

        result.descent = result.height - result.ascent;

    } finally {
        div.remove();
    }

    return result.height * 2;
};

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body) {
    const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
    const fontSize = getCssStyle(el, 'font-size') || '16px';
    const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

    return [fontWeight, fontSize, fontFamily];
}

export function get_height_width() {
    const [fontWeight, fontSize, fontFamily] = getCanvasFontSize(document.body);
    let character_width = getTextWidth("N", `${fontWeight} ${fontSize} ${fontFamily}`) * 2;
    var character_height = getTextHeight();
    if (matchMedia('(pointer:coarse)').matches) {
        character_height = 38;
    } else {
        character_height = 32;
    }
    return [character_height, character_width];
}


// Randomizes a string.
export function getRandomString(length, prototype = null, progress = 0.0) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var result = '';
    for ( var i = 0; i < length; i++ ) {
        if (prototype != null) {
            if (Math.random() < progress) {
                result += prototype.charAt(i);
            } else {
                result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
        } else {
            result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
    }
    return result;
}

// Get the screen width.
export function getWidth() {
    return document.getElementById('body').getBoundingClientRect().width - 60
}

export function getHeight() {
    return document.getElementById('body').offsetHeight;
}