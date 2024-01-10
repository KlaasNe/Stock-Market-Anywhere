const prices = {}
let currency = "€"

document.getElementById("add-item").addEventListener("submit", (event) => {
    event.preventDefault();
    add_product();
});

function add_product() {
    const errors = []
    const item_name = document.getElementById("product").value
    const trigram = make_trigram(item_name);

    if (prices.hasOwnProperty(trigram)) {
        errors.push("An item with this abbreviation already exists")
    }

    const price = document.getElementById("price").value
    if (price === "") {
        errors.push("Item has no price")
    }

    let min_price = document.getElementById("min-price").value;
    min_price = min_price !== "" ? min_price : 0;
    if (price < min_price) {
        errors.push("Minimum price can't be higher than the initial price")
    }

    if (errors.length === 0) {
        prices[trigram] = {
            "initial_price": price,
            "crash_price": min_price,
            "min_price": min_price,
            "full_name": item_name
        }
        append_new_item_html(trigram, prices[trigram]);

        document.getElementById("product").value = ""
        document.getElementById("price").value = null
        document.getElementById("min-price").value = null
        document.getElementById("product").focus()
    } else {
        // TODO Show error popup
    }
}

function make_trigram(name, maxNumberChars = 3) {
    const stripped_name = name.replace(/\s/g, '')
    if (stripped_name.length <= maxNumberChars) {
        return stripped_name.toUpperCase()
    }
    const nameParts = name.toUpperCase().split(' ').filter(n => n)
    if (nameParts[0].length <= 2 && nameParts.length !== maxNumberChars) {
        nameParts[0] = nameParts[0] + nameParts[1]
        nameParts.splice(1, 1)
    }
    const partsCount = nameParts.length
    const partsCountCapped = Math.min(maxNumberChars, partsCount)
    let trigram = nameParts[0].substring(0, maxNumberChars - (partsCountCapped - 1))
    for (let i = 1; i < partsCountCapped; i++) {
        trigram += nameParts[i].substring(0, 1)
    }
    return trigram
}

function update_name(trigram) {
    const new_name = document.getElementById(`name-input-${trigram}`).value
    prices[trigram].full_name = new_name
    update_trigram(trigram, new_name)
}

function update_trigram(trigram, new_name) {
    const new_trigram = make_trigram(new_name)
    if (trigram !== new_trigram) {
        Object.defineProperty(prices, new_trigram,
            Object.getOwnPropertyDescriptor(prices, trigram));
        delete prices[trigram];

        // Remove event listeners
        const old_element = document.getElementById(`name-input-${trigram}`);
        const new_element = old_element.cloneNode(true);
        old_element.parentNode.replaceChild(new_element, old_element);
        // Put cursor at the end because new element created and otherwise typing gets annoying
        // All this because I couldn't properly remove the evntlistener without replacint the whole input field
        new_element.focus()
        new_element.selectionStart = new_element.value.length

        const trigram_cell = document.getElementById(`trigram-${trigram}`)
        trigram_cell.id = `trigram-${new_trigram}`
        trigram_cell.innerText = new_trigram
        const input_field = document.getElementById(`name-input-${trigram}`)
        input_field.id = `name-input-${new_trigram}`
        document.getElementById(`name-input-${new_trigram}`).addEventListener("input", () => {
            update_name(new_trigram)
        })
    }
}

function append_new_item_html(trigram, item_params) {
    const table_cell = document.createElement("td")
    const name_input_field = document.createElement("input")

    name_input_field.type = "text"
    name_input_field.id = `name-input-${trigram}`
    name_input_field.required = true
    table_cell.appendChild(name_input_field)

    const items_table = document.getElementById("items")
    const new_row = document.createElement("tr")
    new_row.id = trigram

    const new_cell = document.createElement("td")
    new_cell.id = `trigram-${trigram}`
    new_cell.innerText = trigram

    new_row.appendChild(new_cell)
    new_row.appendChild(table_cell)

    const price_cell = document.createElement("td")
    price_cell.innerHTML = `${currency}` + `<input type="number" value="${item_params.initial_price}" min="0" step="0.01"/>`
    new_row.appendChild(price_cell)

    const min_price_cell = document.createElement("td")
    min_price_cell.innerHTML = `${currency}` + `<input type="number" value="${item_params.min_price}" min="0" step="0.01"/>`
    new_row.appendChild(min_price_cell)

    const delete_cell = document.createElement("td")
    const delete_button = document.createElement("button")
    delete_button.onclick = () => { delete_trigram(trigram) }
    delete_button.innerText = "delete"
    delete_cell.appendChild(delete_button)
    new_row.appendChild(delete_cell)

    items_table.appendChild(new_row)

    document.getElementById(`name-input-${trigram}`).addEventListener("input", () => {
        update_name(trigram);
    })
    document.getElementById(`name-input-${trigram}`).value = item_params.full_name
}

function delete_trigram(trigram) {
    delete prices[trigram]
    document.getElementById(trigram).remove()
}

function generate_items_html() {
    const items_table = document.getElementById("items")
    items_table.innerHTML = ""
    for (const trigram in prices) {
        append_new_item_html(trigram, prices[trigram])
    }
}

function setCurrency(character) {
    currency = character
    generate_items_html()
}