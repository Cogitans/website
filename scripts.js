// Clearly I don't know how Javascript or Webdev works but trust me I can code
// the hell out of some nice machine learning models.

import {generateColor,
        getTextWidth,
        getTextHeight,
        character_width,
        character_height,
        getRandomString,
        getWidth,
        getHeight } from './utils.js';

// Load the documents into data.
var data;
var data_list = [];

// This class will maintain global state.
const PageState = {
    text_laid_out: false,
    words_flipped: false,
    current_num_lines: 0.,
    revealed_secret: false,
    finalized: false,
};


// Static information we're gonna show.
// This is a mapping from x-offset, y-offset to list of lines.
const InitialWave = new Map([
    [
        [0.1, 0.1],
        [[" Hi, ", null],
         [" I'm Aidan ", null]]
    ],
]);
const SecondWave = new Map([
    [
        [0.7, 0.6],
        [[" My Scholar ", "https://scholar.google.com/citations?user=FON6hKEAAAAJ&hl=en"],
         [" My Twitter ", "https://twitter.com/_aidan_clark_"]]
    ]
]);
var extra = "Bevan Clark if you really must know....";
let num_flickers = 30;

// Given a particular number of lines, this looks at the global mapping
// and decides what should be on each line in a fully-shown world.
function get_line_object(input_mapping, number_of_lines, number_of_characters) {
    let mapping = new Map();
    for (let [key, value] of input_mapping) {
        let [x_offset, y_offset] = key;
        let line_offset = Math.floor(y_offset * number_of_lines);
        let char_offset = Math.floor(x_offset * number_of_characters);
        for (let i = 0; i < value.length; i++) {
            let [words, link] = value[i];
            mapping.set(line_offset + i, [char_offset, words, link])
        }
    }
    return mapping;
}

// Given a line mapping, set the html!
function set_line_html(data_list, line_mapping, override_fn = null) {
    for (let [key, value] of line_mapping) {
        let [j, words, link] = value;
        let new_words = words
        let line = document.getElementById(`h1_${key}`)
        let color = "white";
        var text = data_list[key];
        let mouseover = null;
        let mouseout = null;
        line.children[0].innerHTML = text.substr(0, j)
        if (override_fn != null) {
            [new_words, color, mouseover, mouseout] = override_fn(
                line, words, color);
        }
        line.children[1].children[0].innerHTML = new_words;
        line.children[2].innerHTML = text.substr(j + new_words.length)
        line.children[1].style.color = color
        if (link != null) {
            line.children[1].setAttribute("href", link);
        }
        if (mouseover != null) {
            line.children[1].setAttribute("data-colorincreasing", false);
            line.children[1].setAttribute("data-colorindex", 0);
            line.children[1].addEventListener('mouseover', mouseover);
        }
        if (mouseout != null) {
            line.children[1].addEventListener('mouseout', mouseout);
        }
    }
}

function set_other_lines_to_default(num_lines, empty_lines) {
    for (let i = 0; i < num_lines; i++) {
        let line = document.getElementById(`h1_${i}`)
        if (empty_lines.includes(i)) {
            line.children[0].innerHTML = data_list[i];
            line.children[1].children[0].innerHTML = "";
            line.children[2].innerHTML = "";
        }
    }

}


function get_num_characters() {
    return Math.floor(getWidth() / character_width) - 1;
}

function num_lines() {
    return Math.floor(getHeight() / character_height);
}

function set_data_to_text_divisions() {
    let num_characters = get_num_characters();
    data_list = [];
    for (let i = 0; i < Math.floor(data.length / num_characters) ; i++) {
        data_list.push(data.slice(num_characters * i, num_characters * (i + 1)));
    }
}

function create_element_structure() {
    let num_lines_right_now = num_lines();
    if (PageState.current_num_lines <= num_lines_right_now) {
        // We need to create new lines!
        for (let i = PageState.current_num_lines; i < num_lines_right_now; i++) {
            var newh = document.createElement('h1');
            newh.id = `h1_${i}`
            var newSpan1 = document.createElement('span');
            var newSpan2 = document.createElement('a');
            var newSpan2_real = document.createElement('span');
            newSpan2.appendChild(newSpan2_real);
            var newSpan3 = document.createElement('span');
            newh.appendChild(newSpan1);
            newh.appendChild(newSpan2);
            newh.appendChild(newSpan3);
            document.getElementById('main').appendChild(newh);
        }
    } else {
        // We need to delete some lines!
        // let num_lines_to_delete = PageState.current_num_lines - num_lines_right_now;
        let element = document.getElementById('main');
        for (let i = PageState.current_num_lines; i > num_lines_right_now; i--) {
            let line_to_delete = document.getElementById(`h1_${i - 1}`);
            element.removeChild(line_to_delete)
        }
    }
    let element = document.getElementById('main');
    var num_real_h = 0
    for (let i = 0; i < element.children.length; i++) {
        var child = element.children[i];
        if (child.id.startsWith("h1")) {
            num_real_h += 1;
        }
    }
    if (num_real_h != num_lines_right_now) {
        console.log(`${num_lines_right_now} ${num_real_h}`);
    }
}

async function text_resize(previous_state = null) {
    // Get the existing state of the world.
    let element = document.getElementById('main');
    create_element_structure();
    for (let i = 0; i < num_lines(); i++) {
        let line = document.getElementById(`h1_${i}`)
        line.children[0].innerHTML = data_list[i];
    }
}

function replaceAt(text, index, replacement) {
    console.log(text);
    return text.substr(0, index) + replacement + text.substr(index + replacement.length);
}


let link_ticks = 50;
let link_colors = generateColor("#00D3FF ", "#FFFFFF", link_ticks);


function changeletter(i, j, value, color = "white", link = null) {
    let v = document.getElementById(`h1_${i}`);
    if (v.children[1].children[0].innerHTML.length > 0 || v.children[2].innerHTML.length > 0) {
        var text = v.children[0].innerHTML.concat(v.children[1].children[0].innerHTML, v.children[2].innerHTML);
    }
    else {
        var text = v.children[0].innerHTML;
    }
    v.children[0].innerHTML = text.substr(0, j)
    v.children[1].children[0].innerHTML = value
    v.children[2].innerHTML = text.substr(j + value.length)
    if (color != null) {
        v.children[1].style.color = color;
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// This function triggers the expected behavior on page load.
// Namely, slowly morphing the background text into color and
// final text, and adding the links.
const flipletters = async (is_main = false, skip_flicker = false) => {
    let number_of_characters = get_num_characters();
    let number_of_lines = num_lines();
    let line_mapping_inital = get_line_object(InitialWave, number_of_lines, number_of_characters);
    let line_mapping_second = get_line_object(SecondWave, number_of_lines, number_of_characters);

    // We need to know which lines don't have anything interesting.
    let empty_lines = new Array();
    let initial_keys = Array.from(line_mapping_inital.keys());
    let second_keys = Array.from(line_mapping_second.keys());
    for (let i = 0; i < number_of_lines; i++) {
        if (!initial_keys.includes(i) && !second_keys.includes(i)) {
            empty_lines.push(i);
        }
    }
    let local_data_list = [...data_list];

    let initial_i = !skip_flicker ? 0 : num_flickers - 1;

    // Pause a moment....
    if (!skip_flicker) {await delay(1000);}

    // Flicker the text into existence.
    let colors = generateColor("#FFFFFF", "#808080", num_flickers);
    for (let i = initial_i; i < num_flickers; i++) {
        if (is_main && should_interrupt_main) {return;}
        set_line_html(local_data_list, line_mapping_inital, function(line, words, color) {
            let word = getRandomString(words.length, words, (i + 1) / num_flickers);
            return [word, "#" + colors[i], null, null];
        });
        if (!skip_flicker) {await delay(50);}
    }

    // Pause again ... and flicker
    if (!skip_flicker) {await delay(500);}
    for (let i = initial_i; i < num_flickers; i++) {
        if (is_main && should_interrupt_main) {return;}
        set_line_html(local_data_list, line_mapping_second, function(line, words, color) {
            let word = getRandomString(words.length, words, (i + 1) / num_flickers);
            // Define our mouseover and mouseouts.
            let mouseover = null;
            let mouseout = null;
            if (i == num_flickers - 1) {
                mouseover = async function(){
                    line.children[1].setAttribute("data-colorincreasing", true);
                    while (line.children[1].getAttribute("data-colorindex") < link_ticks) {
                        if (line.children[1].getAttribute("data-colorincreasing") == "false") {
                            return;
                        }
                        let i = parseInt(line.children[1].getAttribute("data-colorindex"));
                        line.children[1].style.color = "#" + link_colors[i];
                        line.children[1].setAttribute("data-colorindex", i + 1)
                        await delay(10);
                    }
                };
                mouseout = async function(){
                    line.children[1].setAttribute("data-colorincreasing", false);
                    while (line.children[1].getAttribute("data-colorindex") >= 0) {
                        if (line.children[1].getAttribute("data-colorincreasing" == "true")) {
                            return;
                        }
                        let i = parseInt(line.children[1].getAttribute("data-colorindex"));
                        line.children[1].style.color = "#" + link_colors[i];
                        line.children[1].setAttribute("data-colorindex", i - 1)
                        await delay(10);
                    }
                }
            } else {
                mouseover = null;
                mouseout = null;
            }
            return [word, "#" + colors[i], mouseover, mouseout];
        });
        if (!skip_flicker) {await delay(50);}
    }
    set_other_lines_to_default(num_lines(), empty_lines);
}

function finalize_words() {
    // We need to add the extra bit, and the hover-colors.

    // Extra first.
    let number_of_characters = get_num_characters();
    let number_of_lines = num_lines();
    let char_offset = Math.floor(0.1 * number_of_characters);
    let line_offset = Math.floor(0.1 * number_of_lines);
    let initial = Array.from(InitialWave.values())[0][1][0];
    if (PageState.revealed_secret) {
        changeletter(line_offset + 1, char_offset, initial + extra.substr(0, extra.length));
    } else {
        if (initial.length + extra.length + char_offset
            < number_of_characters) {
                    let v = document.getElementById(`h1_${line_offset + 1}`);
                    v.onclick = async function() {
                        if (!PageState.revealed_secret) {
                            for (let j = 0; j < extra.length; j++) {
                                changeletter(line_offset + 1, char_offset, initial + extra.substr(0, j));
                                await delay(35);
                            }
                            PageState.revealed_secret = true
                        }
                    }
            }
    }
};

// This is our function that's called on initialization.
var running_main = false;
var should_interrupt_main = false;
export async function do_main() {
    running_main = true;
    // Load the data in -- we only need to do this once.
    const response = await fetch('http://127.0.0.1:5500/lucretius.txt');
    data = await response.text();
    set_data_to_text_divisions();
    await text_resize()
    PageState.text_laid_out = true;
    PageState.current_num_lines = num_lines();
    await flipletters(true);
    PageState.words_flipped = true;
    finalize_words();
    PageState.finalized = true;
    running_main = false;
  }

// This is our function that's called on a resize.
var num_resizes = 0;
async function resize_fn() {
    num_resizes += 1;
    let expected_num_resizes = num_resizes;
    // If a main function is running, interrupt it.
    should_interrupt_main = true;

    // There are two main paths: has a main function fully run or
    // was there an interruption before it happeed.
    if (!PageState.finalized) {
        // We're in an unfinalized state, we just want to skip
        // initialization for the current state.
        set_data_to_text_divisions();
        await text_resize()
        PageState.text_laid_out = true;
        PageState.current_num_lines = num_lines();
        flipletters(false, true);
        PageState.words_flipped = true;
        finalize_words();
        PageState.finalized = true;
    } else {
        // We're already loaded! We just need to reformat.
        set_data_to_text_divisions();
        await text_resize()
        if (expected_num_resizes != num_resizes) {
            return;
        }
        flipletters(false, true);
        finalize_words();
        PageState.current_num_lines = num_lines();
    }


};


var doit;
window.onresize = resize_fn;
// async function(){
//     clearTimeout(doit);
//     doit = setTimeout(resize_fn, 10);
// }