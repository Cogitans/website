// Clearly I don't know how Javascript or Webdev works but trust me I can code
// the hell out of some nice machine learning models.

import {generateColor,
        getTextWidth,
        getTextHeight,
        colorNameToHex,
        get_height_width,
        getRandomString,
        getWidth,
        getHeight } from './utils.js';
import { lucretius_one, lucretius_two, lucretius_one_english, } from './text.js';

// Load the documents into data.
var data;
var data_list = [];
var imgoffset = [1, 5];

// This class will maintain global state.
const PageState = {
    text_laid_out: false,
    words_flipped: false,
    current_num_lines: 0.,
    revealed_secret: false,
    finalized: false,
};

function reset_page_state() {
    PageState.text_laid_out = false;
    PageState.words_flipped = false;
    PageState.current_num_lines = 0;
    PageState.revealed_secret = false;
    PageState.finalized = false;
}

// This describes whether we're in main-page or sidebar.
class PageType {
    // Create new instances of the same class as static attributes
    static Unloaded = new PageType("Unloaded")
    static Welcome = new PageType("Welcome")
    static Sidebar = new PageType("Sidebar")
  
    constructor(name) {
      this.name = name
    }
  }
var current_pagetype = PageType.Unloaded;

let link_ticks = 50;
let thought_colors = generateColor(colorNameToHex("red"), "#FFFFFF", link_ticks);
let link_colors = generateColor("#00D3FF ", "#FFFFFF", link_ticks);
let white_colors = generateColor(colorNameToHex("purple"), "#FFFFFF", link_ticks);
let google_colors = [
    generateColor("#4285F4 ", "#FFFFFF", link_ticks),
    generateColor("#DB4437 ", "#FFFFFF", link_ticks),
    generateColor("#F4B400 ", "#FFFFFF", link_ticks),
    generateColor("#0F9D58 ", "#FFFFFF", link_ticks),
]
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
        [0.8, 0.7],
        [[" My Scholar ", "https://scholar.google.com/citations?user=_19DrfIAAAAJ&hl=en", google_colors, null],
         [" My Twitter ", "https://twitter.com/_aidan_clark_", link_colors, null],
         [" My Thoughts ", null, thought_colors, moveToThoughts],
         [" Speak Latin ", null, white_colors, turnOnSpotlight],
        ]
    ]
]);
let num_flickers = 30;
var SideBarText = [
    ["Aidan Clark.", null, null, null],
    ["", null, null, null],
    ["Home", null, null, moveToHome],
    ["My Scholar ", "https://scholar.google.com/citations?user=_19DrfIAAAAJ&hl=en", google_colors, null],
    ["My Twitter ", "https://twitter.com/_aidan_clark_", link_colors, null],
    ["", null, null],

];

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gaussianRandom(mean, stdDev) {
    let u1 = Math.random();
    let u2 = Math.random();
    let randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return mean + stdDev * randStdNormal;
}

function getGaussianRandomInRange(min, max) {
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6; // 99.7% of values will lie within this range (3 standard deviations)
    let randomValue;

    do {
        randomValue = gaussianRandom(mean, stdDev);
    } while (randomValue < min || randomValue > max);

    return randomValue;
}

var IS_IN_ENGLISH_MODE = false;
var CURRENTLY_ACTIVE = new Set();
var OLD_TRANSLATED = new Map();

async function spotlight_on(i, j, from_i, from_j, is_edge_i, is_edge_j) {
    let str = `${i}-${j}-${from_i}-${from_j}`;
    let old = get_char_el(i, j);

    // Swap value ... but not on images or special tokens
    if (old != null && !old.innerHTML.includes("img") && !is_special(old)) {

        // Add current value
        OLD_TRANSLATED.set(str, old.textContent);
        CURRENTLY_ACTIVE.add(str);

        // console.log(old.innerHTML)
        let key = i * get_num_characters() + j;
        let translation = lucretius_one_english.charAt(key);
        var color;
        if (is_edge_i || is_edge_j) {
            swap_letter(translation, i, j, "mediumseagreen", 0, null, false, false);
            setTimeout(() => {
                let old = get_char_el(i, j);
                swap_letter(old.textContent, i, j, "grey", 0, null, false, false);
            }, getGaussianRandomInRange(120, 300));
        } else {
            swap_letter(translation, i, j, "grey", 0, null, false, false);
        }
    }
}


async function turnOnSpotlight() {
    if (IS_IN_ENGLISH_MODE) {
        // Back to latin!
        for (const old_str of CURRENTLY_ACTIVE) {
            let [old_i, old_j, old_from_i, old_from_j] = old_str.split("-");
            const old_letter = OLD_TRANSLATED.get(old_str);
            OLD_TRANSLATED.delete(old_letter);
            swap_letter(old_letter, parseInt(old_i), parseInt(old_j), "grey", 0, null, false, false);
            CURRENTLY_ACTIVE.delete(old_str);
        }
    }
    IS_IN_ENGLISH_MODE = !IS_IN_ENGLISH_MODE;
}

// Given a particular number of lines, this looks at the global mapping
// and decides what should be on each line in a fully-shown world.
function get_line_object(input_mapping, number_of_lines, number_of_characters) {
    let mapping = new Map();
    for (let [key, value] of input_mapping) {
        let [x_offset, y_offset] = key;
        let line_offset = Math.floor(y_offset * number_of_lines);
        let char_offset = Math.floor(x_offset * number_of_characters);
        for (let i = 0; i < value.length; i++) {
            var [words, link, link_colors, click_fn] = [null, null, null, null];
            if (value[i].length == 2) {
                [words, link] = value[i];
            } else if (value[i].length == 3) {
                [words, link, click_fn] = value[i];
            } else if (value[i].length == 4) {
                [words, link, link_colors, click_fn] = value[i];
            } else {
                console.error("This is bad.");
            }
            let internal_char_offset = Math.min(char_offset, get_num_characters() - words.length);
            mapping.set(line_offset + i, [internal_char_offset, words, link, link_colors, click_fn])
        }
    }
    return mapping;
}


function get_num_characters() {
    let [character_height, character_width] = get_height_width();
    return Math.floor(getWidth() / character_width) - 4;
}

function num_lines() {
    let [character_height, character_width] = get_height_width();
    if (matchMedia('(pointer:coarse)').matches) {
        return Math.floor(getHeight() / (character_height * 2));
    } else {
        return Math.floor(getHeight() / character_height);
    }
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
            newh.appendChild(newSpan1);
            document.getElementById('main').appendChild(newh);

            // We're going to add a listener here to delegate from mouse events
            // on characters which are gonna be added to this like.
            newh.addEventListener("mouseover", function (event) {
                if (event.target.hasAttribute("data-colorindex")) {
                    event.target.mouseoverFn()
                }
                if (IS_IN_ENGLISH_MODE && event.target.id.includes("part")) {
                    // Make the thing english!
                    let [_, i, j] = event.target.id.split("-")
                    let [from_i, from_j] = [parseInt(i), parseInt(j)]
                    let [int_i, int_j] = [parseInt(i), parseInt(j)];
                    let nl = num_lines();
                    let nc = get_num_characters();

                    const I_AMOUNT = 4;
                    const J_AMOUNT = 15;

                    // First, do a sweep and remove old values
                    var DontTouch = new Set();
                    for (const old_str of CURRENTLY_ACTIVE) {
                        let [old_i, old_j, old_from_i, old_from_j] = old_str.split("-");
                        // Check if the value will still be translated
                        if (Math.abs(parseInt(old_i) - i) <= I_AMOUNT && Math.abs(parseInt(old_j) - j) <= J_AMOUNT) {
                            // Do nothing!
                            DontTouch.add(`${old_i}-${old_j}`)
                        } else {
                            const old_letter = OLD_TRANSLATED.get(old_str);
                            OLD_TRANSLATED.delete(old_letter);
                            console.log("to grey! B ", old_i, old_j)
                            swap_letter(old_letter, parseInt(old_i), parseInt(old_j), "grey", 0, null, false, false);
                            CURRENTLY_ACTIVE.delete(old_str);
                        }
                    }
                    for (let ii = -I_AMOUNT; ii <= I_AMOUNT; ii++) {
                        let diff_to_i = Math.abs(ii)
                        let off = Math.ceil(Math.pow(1.7, (I_AMOUNT - diff_to_i) + 2));
                        let iii = int_i + ii;
                        for (let jj = -(J_AMOUNT + off); jj <= (J_AMOUNT + off); jj++) {
                            let jjj = int_j + jj;
                            if (iii >= 0 && jjj >= 0 && iii <= nl && jjj <= nc) {
                                if (!DontTouch.has(`${iii}-${jjj}`)) {
                                    spotlight_on(iii, jjj, i, j,
                                                 (ii == I_AMOUNT || ii == -I_AMOUNT),
                                                 (jj == (J_AMOUNT + off) || jj == -(J_AMOUNT + off)));
                                } else {
                                    let old = get_char_el(iii, jjj);
                                    old.style.color = "grey";
                                }
                            }
                        }
                    }
                    // spotlight_on(i, j);
                }
            });
            newh.addEventListener("mouseout", function (event) {
                if (event.target.hasAttribute("data-colorindex")) {
                    event.target.mouseoutFn()
                }
            });
            newh.addEventListener("click", function (event) {
                if (event.target.hasAttribute("href")) {
                    event.target.clickFn()
                }
            });
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

function insert_line_html(el, text, i) {
    var parts = text.split('');//.split(/(\s+)/); // Split the string into an array of characters

    // Clear existing content if needed
    el.innerHTML = '';
    var containerDiv = document.createElement('h1___');
    containerDiv.className = 'text-container'; // Optionally, add a class for styling
    
    // Create div elements for each part (character or space)
    parts.forEach(function(part, j) {
        var partDiv = document.createElement('h1___');
        partDiv.className = 'part-div'; // Apply a class for styling
        partDiv.textContent = part; // Use textContent to set text content
        partDiv.id = "part-" + i + '-' + j;
        containerDiv.appendChild(partDiv);
    });
    // Append the container div to line.children[0]
    el.appendChild(containerDiv);
}

function add_mouseover(el, link_colors) {
    let [mouseover, mouseout] = makeFlickerFunctions(el, link_colors);
    el.setAttribute("data-colorincreasing", false);
    el.setAttribute("data-colorindex", 0);
    el.mouseoverFn = mouseover;
    el.mouseoutFn = mouseout;
}

function get_char_el(i, j) {
    let row = document.getElementById(`h1_${i}`);
    let chars = row.children[0].children[0].children;
    return chars[j];
}

async function swap_letter(to, i, j, color = null, flicker = 0, link_colors, should_add_color_listener = false, as_html = false, is_special = false) {
    // Swap the letter in row i col j to 'to'
    let old = get_char_el(i, j);
    old.textContent = to;
    if (flicker != 0) {
        // Flicker the text into existence.
        let initial_i = 0;
        var starting_color = colorNameToHex("grey")
        let colors = generateColor(colorNameToHex(color), starting_color, num_flickers);
        for (let i = initial_i; i < num_flickers; i++) {
            let temp_word = getRandomString(to.length, to, (i + 1) / num_flickers);
            old.textContent = temp_word;
            if (color != null) {
                old.style.color = "#" + colors[i];
            }
            await delay(flicker);
        }
    } else {
        if (as_html == true) {
            old.innerHTML = to;
        } else {
            old.textContent = to;
        }
    }
    if (color != null) {
        old.style.color = color;
    }
    if (should_add_color_listener == true) {
        add_mouseover(old, link_colors);
    }
    if (is_special) {
        make_special(old);
    }
    return old
}

function make_special(el) {
    el.setAttribute("is-special", true);
}

function unmake_special(el) {
    el.setAttribute("is-special", false);
}

function is_special(el) {
    if (el.hasAttribute("is-special")) {
        return el.getAttribute("is-special")
    }
    return false
}


async function text_resize(previous_state = null) {
    // Get the existing state of the world.
    let element = document.getElementById('main');
    create_element_structure();
    for (let i = 0; i < num_lines(); i++) {
        let line = document.getElementById(`h1_${i}`)
        insert_line_html(line.children[0], data_list[i], i);
    }
}

function makeFlickerFunctions(el, link_colors) {
    let mouseover = async function(){
        el.setAttribute("data-colorincreasing", true);
        while (el.getAttribute("data-colorindex") < link_ticks) {
            if (el.getAttribute("data-colorincreasing") == "false") {
                return;
            }
            let i = parseInt(el.getAttribute("data-colorindex"));
            el.style.color = "#" + link_colors[i];
            el.setAttribute("data-colorindex", i + 1)
            await delay(10);
        }
    };
    let mouseout = async function(){
        el.setAttribute("data-colorincreasing", false);
        while (el.getAttribute("data-colorindex") >= 0) {
            if (el.getAttribute("data-colorincreasing" == "true")) {
                return;
            }
            let i = parseInt(el.getAttribute("data-colorindex"));
            el.style.color = "#" + link_colors[i];
            el.setAttribute("data-colorindex", i - 1)
            await delay(100);
        }
    }
    return [mouseover, mouseout];
}

async function set_text_from_mapping(mapping, is_main, skip_flicker) {
    // Iterating through the map
    for (let [row, value] of mapping.entries()) {
        if (is_main && should_interrupt_main) {return;}
        const [col_start, text, link, link_colors, clickfn] = value;
        var is_constant_color = true;
        if (link_colors != null) {
            is_constant_color = !Array.isArray(link_colors[0]);
        }
        let flicker = skip_flicker? 0 : 50;
        for (let i = 0; i < text.length; i++) {
            var colors;
            if (is_constant_color == true) {
                colors = link_colors;
            } else {
                colors = link_colors[i % link_colors.length];
            }
            var swap_future = swap_letter(text[i], row, col_start + i, "white", flicker, colors, link != null || clickfn != null, false, true);
            if (link != null) {
                swap_future.then((el) => {
                    // We want to make these links also!
                    el.classList.add("clickable")
                    el.setAttribute("href", link)
                    el.clickFn = function () {
                        window.location.href = link;
                    }
                })
            } else if (clickfn != null) {
                swap_future.then((el) => {
                    // We want to make these links also!
                    el.classList.add("clickable")
                    el.onclick = clickfn;
                })

            }
        }
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

    // Iterating through the map
    await set_text_from_mapping(line_mapping_inital, is_main, skip_flicker)

    // // Pause a moment....
    if (!skip_flicker) {await delay(2000);}

    // Iterating through the second map...
    await set_text_from_mapping(line_mapping_second, is_main, skip_flicker)
}

function load_data() {
    data = lucretius_one;
    // if (Math.random() < 0.5) {
    //     data = lucretius_one;
    // } else {
    //     data = lucretius_two;
    // }
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

async function make_image(force = false) {
    if (matchMedia('(pointer:coarse)').matches || get_num_characters() < 30 || num_lines() < 12) {
        // Don't show an image on mobile.
        return;
    }
    // I think this should all be much simpler now..
    let chars_per_img = 2;
    let img_blocks_wide = 5;
    let offset_from_right = 3;
    let row_offset = 1;
    let col_offset = get_num_characters() - (img_blocks_wide * chars_per_img + offset_from_right);

    let [character_height, character_width] = get_height_width();
    var img_keys = [...Array(30).keys()];
    // We want to do a random order!
    shuffleArray(img_keys);
    for (let i = 0; i < img_keys.length; i++) {
        let img_i = Math.floor(img_keys[i] / (img_blocks_wide));
        let img_j = img_keys[i] % (5);
        let row_id = row_offset + img_i;
        let img_html = `<img alt="Q" src="../img/me_${img_i}_${img_j}.png"  height="${character_height}px" width="${character_width * 2}">`;
        swap_letter(img_html, row_offset + img_i, col_offset + img_j * 2, null, 0, null, false, true);
        swap_letter("", row_offset + img_i, col_offset + img_j * 2 + 1, null, 0, null, false, false);
        make_special(get_char_el(row_offset + img_i, col_offset + img_j * 2));
        make_special(get_char_el(row_offset + img_i, col_offset + img_j * 2 + 1));
        if (!PageState.finalized && !force) {
            await delay(35);
        }
    }
}

function addSkipClick() {
    let body = document.body;
    let el = document.createElement('clickoverlay');
    el.id = "clickoverlay";
    el.onclick = function() {
        if (PageState.words_flipped == false) {
            resize_fn();
        }
    };
    body.appendChild(el)
}

function removeSkipClick() {
    let body = document.body;
    for (let i = 0; i < body.children.length; i++) {
        var child = body.children[i];
        if (child.id.startsWith("clickoverlay")) {
            body.removeChild(child);
        }
    }
}

// This is our function that's called on initialization.
var running_main = false;
var should_interrupt_main = false;
export async function do_main(force = false) {
    if (localStorage.getItem("go_directly_to_thoughts") == "true") {
        await moveToThoughts();
    } else {
        await addSkipClick();
        await delay(100);
        running_main = true;
        load_data();
        set_data_to_text_divisions();
        await text_resize()
        PageState.text_laid_out = true;
        PageState.current_num_lines = num_lines();
        let flipping_letters = flipletters(true, force);
        if (force) {
            // Instantly make ready.
            resize_fn();
        }
        await flipping_letters;
        PageState.words_flipped = true;
        await make_image(false);
        PageState.finalized = true;
        running_main = false;
        current_pagetype = PageType.Welcome;
        await removeSkipClick();
    }
    localStorage.setItem("go_directly_to_thoughts", "false");
  }

// This is our function that's called on a resize.
var num_resizes = 0;
async function resize_fn(force_instant = false) {
    num_resizes += 1;
    let expected_num_resizes = num_resizes;
    // If a main function is running, interrupt it.
    should_interrupt_main = true;

    // There are two main paths: has a main function fully run or
    // was there an interruption before it happeed.
    if (!PageState.finalized || force_instant) {
        // We're in an unfinalized state, we just want to skip
        // initialization for the current state.
        set_data_to_text_divisions();
        await text_resize()
        PageState.text_laid_out = true;
        PageState.current_num_lines = num_lines();
        flipletters(false, true);
        PageState.words_flipped = true;
        PageState.finalized = true;
    } else {
        // We're already loaded! We just need to reformat.
        set_data_to_text_divisions();
        await text_resize()
        if (expected_num_resizes != num_resizes) {
            return;
        }
        flipletters(false, true);
        PageState.current_num_lines = num_lines();
    }
    await make_image();
    await removeSkipClick();
    current_pagetype = PageType.Welcome;


};


async function change_color(el, color) {
    let is_image = el.textContent.length != el.innerHTML.length
    if (is_image) {
        el.style.color = color
        el.innerHTML = ""
        el.textContent = "XX"
    } else {
        el.style.color = color
    }  
}

async function blackoutBackground(delay_in_ms) {
    let m = num_lines();
    let k = get_num_characters();
    var promises = Array();
    var char_keys = [...Array(m * k).keys()];
    shuffleArray(char_keys);
    for (let ii = 0; ii < char_keys.length; ii++) {
        let char_i = Math.floor(char_keys[ii] / (k));
        let char_j = char_keys[ii] % (k);
        let el = get_char_el(char_i, char_j)
        if (el != null) {
            promises.push(change_color(el, "black"))
            if (ii % 20 == 0) {
                await delay(delay_in_ms);
            }
        }
    }
    return Promise.allSettled(promises);
}

async function drawSidebar(fade_in = true) {
    let main = document.getElementById(`main`);

    // Delete an existing sidebar and/or make a new one.
    var maybe_existing = document.getElementById("sidebar-box");
    if (maybe_existing != null) {
        main.removeChild(maybe_existing);
    }
    var sidebar_box = document.createElement('div');
    sidebar_box.classList.add("container");
    sidebar_box.id = "sidebar-box";
    main.appendChild(sidebar_box);

    // Delete an existing sidebar and/or make a new one.
    maybe_existing = document.getElementById("sidebar");
    if (maybe_existing != null) {
        sidebar_box.removeChild(maybe_existing);
    }
    var sidebar = document.createElement('div');
    sidebar.classList.add("left-side");
    sidebar.id = "sidebar";
    sidebar_box.appendChild(sidebar);
    maybe_existing = document.getElementById("thoughts");
    if (maybe_existing != null) {
        sidebar_box.removeChild(maybe_existing);
    }
    var thoughts = document.createElement('div');
    thoughts.id = "thoughts";
    thoughts.classList.add("right-side");
    sidebar_box.appendChild(thoughts);

    // Add the picture on the left-hand side, with the 
    let [character_height, character_width] = get_height_width();
    var imgspan = document.createElement('span');
    imgspan.id = "sidebarimg";
    let s = `<img alt="Q" src="../img/me.png"  height="${character_height * 6}px" width="${character_width * 2 * 5}">`;
    if (fade_in == true) {
        imgspan.style.opacity = 0;
    }
    imgspan.innerHTML = s;
    sidebar.appendChild(imgspan);
    if (fade_in == true) {
        for (let i = 0; i <= 100; i += 2) {
            imgspan.style.opacity = i / 100;
            await delay(2);
        }
    }

    // Draw in each of the title/links.
    for (let i = 0; i < SideBarText.length; i++) {
        let str = SideBarText[i][0];
        let link = SideBarText[i][1];
        let color = SideBarText[i][2];
        let action = SideBarText[i][3];
        var welcomeh = document.createElement('h2');
        sidebar.appendChild(welcomeh);
        var welcomespan = document.createElement('a');
        welcomespan.innerHTML = str;
        welcomespan.style.color = "white";
        if (action != null) {
            welcomespan.onclick = action;
            welcomespan.classList.add("clickable")
        }
        if (link != null) {
            welcomespan.setAttribute("href", link);
            welcomespan.classList.add("clickable")
        }
        welcomeh.appendChild(welcomespan);
    }

    // Now we draw in thoughts!
    let maybe_existing_placeholder = document.getElementById("thoughts_placeholder");
    if (maybe_existing_placeholder == null) {
        let thoughts_placeholder = document.createElement('h1');
        thoughts_placeholder.id = "thoughts_placeholder"
        thoughts_placeholder.innerHTML = "I'm sure I'll have some soon..."
        thoughts.appendChild(thoughts_placeholder);
    }
    reset_page_state();
}

// This assumes it's being called from the welcome page.
async function unloadWelcomeAndSwitch(immediate = false) {
    // Flicker out everything visible.
    if (immediate == false) {
        await blackoutBackground(1);
    } else {
        await blackoutBackground(0);
    }

    // Delete the invisible divs!
    let main = document.getElementById(`main`);
    let m = num_lines();
    for (let i = 0; i <= m; i++) {
        let line = document.getElementById(`h1_${i}`)
        if (line != null) {
            main.removeChild(line);
        }
    }

    // Draw the sidebar!
    await drawSidebar(!immediate);

}

// Delete mainpage
async function switchToSidebar() {
    if (current_pagetype == PageType.Sidebar) {
        return;
    } else if (current_pagetype == PageType.Unloaded) {
        await drawSidebar(false);
        current_pagetype = PageType.Sidebar;
    } else if (current_pagetype == PageType.Welcome) {
        current_pagetype = PageType.Sidebar;
        await unloadWelcomeAndSwitch();
    }
}


async function switchToHomeContent() {
    localStorage.setItem("go_directly_to_thoughts", "false");
    var maybe_existing = document.getElementById("sidebar-box");
    if (maybe_existing != null) {
        main.removeChild(maybe_existing);
    }
    do_main(true);
}



// We're gonna work on having a dynamic sidebar....
var switching = false;;
export async function moveToThoughts(push_state = true) {
    if (switching == true) {
        return;
    } else {
        switching = true;
        if (IS_IN_ENGLISH_MODE) {
            turnOnSpotlight();
        }
        await switchToSidebar();
        switching = false;

    }
    if (push_state) {
        window.history.pushState("Thoughts", "Thoughts", "/thoughts");
    }
}


async function moveToHome() {
    if (switching) {
        return;
    } else {
        switching = true;
        await switchToHomeContent();
        switching = false;
    }
    window.history.pushState("Home", "Home", "/");
}


var doit;
window.onresize = function() {
    if (current_pagetype == PageType.Sidebar) {
        drawSidebar(false);
    } else if (current_pagetype == PageType.Unloaded) {
        resize_fn();
    } else if (current_pagetype == PageType.Welcome) {
        resize_fn();
    }
}

// Event listener for popstate (back button clicked)
window.addEventListener('popstate', function(event) {
    // Check if the state is "Home"
    if (event.state === "Thoughts") {
        moveToThoughts(false);
    } else if (event.state === "Home") {
        switchToHomeContent();
    }
});

let lastScrollTop = 0;

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
        // Scrolling down
        console.log('Scrolling down');
        // Add your logic for intercepting scroll down here
    } else {
        // Scrolling up
        console.log('Scrolling up');
        // Add your logic for intercepting scroll up here
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
});