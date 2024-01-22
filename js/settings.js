let default_prices = {}
let currency = "€";
let title = "";
const currencies = {"€": "euro", "$": "usd", "£": "pound", "¥": "yen"}

const MAX_TITLE_LENGTH = 64;

window.onload = () => {
    document.getElementById("add-item").addEventListener("submit", (event) => {
        event.preventDefault();
        addProduct();
    });
}

function getDefaultPricesWithColours() {
    const default_prices_with_colours = default_prices
    const number_of_drinks = numberOfDrinks();
    let i = 0;
    for (let trigram in default_prices) {
        if (!default_prices[trigram]["colour"]) {
            default_prices_with_colours[trigram]["colour"] = "hsl(" + Math.ceil(i++ * 360 / number_of_drinks) + ", 90%, 60%)";
        }
    }
    return default_prices_with_colours;
}

function addProduct() {
    const errors = [];
    const item_name = document.getElementById("product").value;
    const trigram = makeTrigram(item_name);

    if (default_prices.hasOwnProperty(trigram)) {
        errors.push("An item with this abbreviation already exists");
    }

    const price = document.getElementById("price").value;
    if (price === "") {
        errors.push("Item can't have no price");
    }

    let min_price = document.getElementById("min-price").value;
    min_price = min_price !== "" ? min_price : 0;
    if (price < min_price) {
        errors.push("Minimum price can't be greater than the initial price");
    }

    executeIfNoErrors(errors, () => {
        default_prices[trigram] = {
            "initial_price": price,
            "crash_price": min_price,
            "min_price": min_price,
            "full_name": item_name
        }
        appendNewItemHtml(trigram, default_prices[trigram]);

        document.getElementById("product").value = "";
        document.getElementById("price").value = null;
        document.getElementById("min-price").value = null;
        document.getElementById("product").focus();
    });
    // TODO show error popup
}

function makeTrigram(name, maxNumberChars = 3) {
    const stripped_name = name.replace(/\s/g, '');
    if (stripped_name.length <= maxNumberChars) {
        return stripped_name.toUpperCase();
    }

    const nameParts = name.toUpperCase().split(' ').filter(n => n);
    if (nameParts.length === 1) {
        return name.substring(0, maxNumberChars).toUpperCase();
    }

    let trigram = name.substring(0, maxNumberChars - (Math.min(nameParts.length, maxNumberChars) - 1)).toUpperCase();
    const additionalChars = nameParts.slice(1, maxNumberChars).map(part => part.substring(0, 1));
    return trigram + additionalChars.join('');
}

function updateName(trigram) {
    const new_name = document.getElementById(`name-input-${trigram}`).value;
    const errors = [];
    const new_trigram = makeTrigram(new_name);

    if (new_trigram !== trigram && default_prices.hasOwnProperty(new_trigram)) {
        errors.push("An item with this abbreviation already exists");
    }

    executeIfNoErrors(errors, () => {
        default_prices[trigram].full_name = new_name;
        updateTrigram(trigram, new_trigram);
    })
    // TODO show error popup
}

function updateTrigram(trigram, new_trigram) {
    if (trigram !== new_trigram) {
        Object.defineProperty(default_prices, new_trigram, Object.getOwnPropertyDescriptor(default_prices, trigram));
        delete default_prices[trigram];

        document.getElementById(`tr-${trigram}`).id = `tr-${new_trigram}`;

        const trigram_cell = document.getElementById(`trigram-${trigram}`);
        trigram_cell.id = `trigram-${new_trigram}`;
        trigram_cell.innerText = new_trigram;

        const name_input_field = document.getElementById(`name-input-${trigram}`);
        name_input_field.id = `name-input-${new_trigram}`;
        document.getElementById(`name-input-${new_trigram}`).oninput = () => {
            updateName(new_trigram);
        }

        const new_price_input_field = document.getElementById(`price-input-${trigram}`);
        new_price_input_field.id = `price-input-${new_trigram}`;
        document.getElementById(`price-input-${new_trigram}`).oninput = () => {
            updatePrice(new_trigram);
        }

        const new_min_price_input_field = document.getElementById(`min-price-input-${trigram}`);
        new_min_price_input_field.id = `min-price-input-${new_trigram}`;
        document.getElementById(`min-price-input-${new_trigram}`).oninput = () => {
            updateMinPrice(new_trigram);
        }

        const delete_button = document.getElementById(`delete-${trigram}`);
        delete_button.id = `delete-${new_trigram}`;
        delete_button.onclick = () => {
            deleteTrigram(new_trigram);
        }
    }
}

function updatePrice(trigram) {
    const errors = [];
    const price_input_field = document.getElementById(`price-input-${trigram}`);
    let new_price = price_input_field.value;

    if (parseInt(new_price) < 0) {
        errors.push("Price can't be less than 0");
    }

    if (parseInt(new_price) < default_prices[trigram].min_price) {
        errors.push("Price can't be less than the minimum price");
    }

    executeIfNoErrors(errors, () => {
        if (numDigitsAfterDecimal(new_price) > 2) {
            new_price = (Math.floor(new_price * 100) / 100).toFixed(2);
            price_input_field.value = new_price;
        }
        default_prices[trigram].initial_price = new_price;
    }).else(() => {
        price_input_field.value = default_prices[trigram].initial_price;
    })
    // TODO Show error popup
}

function updateMinPrice(trigram) {
    const errors = [];
    const min_price_input_field = document.getElementById(`min-price-input-${trigram}`);
    let new_min_price = min_price_input_field.value;
    const initial_price = default_prices[trigram].initial_price;

    if (new_min_price < 0) {
        errors.push("Minimum price can't be less than 0");
    }

    if (parseInt(new_min_price) > initial_price) {
        errors.push("Minimum price can't be greater than the initial price");
    }

    executeIfNoErrors(errors, () => {
        if (numDigitsAfterDecimal(new_min_price) > 2) {
            new_min_price = (Math.floor(new_min_price * 100) / 100).toFixed(2);
            min_price_input_field.value = new_min_price;
        }
        default_prices[trigram].min_price = new_min_price;
    }).else(() => {
        min_price_input_field.value = default_prices[trigram].min_price;
    })
    // TODO Show error popup
}

function updateTitle() {
    const errors = [];
    const new_title = document.getElementById("title-input").value;

    if (new_title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title too long, max length is ${MAX_TITLE_LENGTH} characters`);
    }

    executeIfNoErrors(errors, () => {
        title = new_title;
    })
}

function numDigitsAfterDecimal(x) {
    return (x.toString().split('.')[1] || '').length;
}

function appendNewItemHtml(trigram, item_params) {
    const table_cell = document.createElement("td");
    const name_input_field = document.createElement("input");

    name_input_field.type = "text";
    name_input_field.id = `name-input-${trigram}`;
    name_input_field.required = true;
    table_cell.appendChild(name_input_field);

    const items_table = document.getElementById("items");
    const new_row = document.createElement("tr");
    new_row.id = `tr-${trigram}`;

    const new_cell = document.createElement("td");
    new_cell.id = `trigram-${trigram}`;
    new_cell.innerText = trigram;

    new_row.appendChild(new_cell);
    new_row.appendChild(table_cell);

    const price_cell = document.createElement("td");
    price_cell.innerHTML = `${currency}<input id="price-input-${trigram}" type="number" value="${item_params.initial_price}" min="0" step="0.01"/>`;
    new_row.appendChild(price_cell);

    const min_price_cell = document.createElement("td");
    min_price_cell.innerHTML = `${currency}<input id="min-price-input-${trigram}" type="number" value="${item_params.min_price}" min="0" step="0.01"/>`;
    new_row.appendChild(min_price_cell);

    // TODO Custom colours?
    // const colour_picker_cell = document.createElement("td");
    // colour_picker_cell.innerHTML = `<input type="color"/>`;
    // new_row.appendChild(colour_picker_cell);

    const delete_cell = document.createElement("td");
    const delete_button = document.createElement("button");
    delete_button.id = `delete-${trigram}`;
    delete_button.onclick = () => {
        deleteTrigram(trigram);
    }
    delete_button.innerHTML = "delete";
    delete_cell.appendChild(delete_button);
    new_row.appendChild(delete_cell);

    items_table.appendChild(new_row);

    document.getElementById(`name-input-${trigram}`).oninput = () => {
        updateName(trigram);
    }
    document.getElementById(`name-input-${trigram}`).value = item_params.full_name;

    document.getElementById(`price-input-${trigram}`).oninput = () => {
        updatePrice(trigram);
    }
    document.getElementById(`price-input-${trigram}`).value = item_params.initial_price;

    document.getElementById(`min-price-input-${trigram}`).oninput = () => {
        updateMinPrice(trigram);
    }
    document.getElementById(`min-price-input-${trigram}`).value = item_params.min_price;
}

function deleteTrigram(trigram) {
    delete default_prices[trigram];
    document.getElementById(`tr-${trigram}`).remove();
}

function generateItemsHtml() {
    const items_table = document.getElementById("items");
    items_table.innerHTML = "";
    for (const trigram in default_prices) {
        appendNewItemHtml(trigram, default_prices[trigram]);
    }
}

function setCurrency(character) {
    currency = character;
    generateItemsHtml();
}

async function saveAs() {
    try {
        const fileHandle = await window.showSaveFilePicker({
            startIn: "documents",
            suggestedName: `${title}.json`,
            types: [
                {
                    description: "JSON Files",
                    accept: {
                        "application/json": [".json"],
                    },
                },
            ],
        });

        const file = await fileHandle.createWritable();
        const save_data = {
            title: title,
            currency: currency,
            default_prices: default_prices,
        }
        const jsonData = JSON.stringify(save_data);
        await file.write(jsonData);
        await file.close();
    } catch (error) {
        console.error("Error saving file: ", error);
    }
}

async function openFile() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            startIn: "documents",
            types: [
                {
                    accept: {
                        "application/json": [".json"]
                    },
                },
            ],
        });

        const file = await fileHandle.getFile();
        const save_data = JSON.parse(await file.text());
        console.log(save_data);
        default_prices = save_data["default_prices"];
        currency = save_data["currency"];
        title = save_data["title"];
        generateItemsHtml();
        document.getElementById("title-input").value = title;
        const radioButtons = document.getElementsByName('currency');
        for (let i = 0; i < radioButtons.length; i++) {
            radioButtons[i].checked = radioButtons[i].id === currencies[currency];
        }
    } catch (error) {
        console.error("Error opening file: ", error);
    }
}

function launch() {
    localStorage.setItem("defaultPrices", JSON.stringify(getDefaultPricesWithColours()));
    localStorage.setItem("title-input", title);
    window.location.assign("admin.html");
}

function numberOfDrinks() {
    return Object.keys(default_prices).length;
}

function executeIfNoErrors(errors, func = () => {}, log_errors = true) {
    if (errors.length === 0) {
        func();
    } else if (log_errors) {
        logErrorsInConsole(errors);
    }

    return {
        else: function (elseFunc) {
            if (errors.length > 0) elseFunc();
        }
    }
}

function logErrorsInConsole(errors) {
    errors.forEach(error => {
        console.error(error);
    });
}
