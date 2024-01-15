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
        errors.push("Item can't have no price")
    }

    let min_price = document.getElementById("min-price").value;
    min_price = min_price !== "" ? min_price : 0;
    if (price < min_price) {
        errors.push("Minimum price can't be greater than the initial price")
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
        log_errors_in_console(errors)
        // TODO Show error popup
    }
}

function make_trigram(name, maxNumberChars = 3) {
    const stripped_name = name.replace(/\s/g, '')
    if (stripped_name.length <= maxNumberChars) {
        return stripped_name.toUpperCase()
    }

    const nameParts = name.toUpperCase().split(' ').filter(n => n)
    if (nameParts.length === 1) {
        return name.substring(0, maxNumberChars).toUpperCase()
    }

    let trigram = name.substring(0, maxNumberChars - (Math.min(nameParts.length, maxNumberChars) - 1)).toUpperCase()
    const additionalChars = nameParts.slice(1, maxNumberChars).map(part => part.substring(0, 1))
    return trigram + additionalChars.join('')
}

function update_name(trigram) {
    const new_name = document.getElementById(`name-input-${trigram}`).value
    const errors = []
    const new_trigram = make_trigram(new_name)

    if (new_trigram !== trigram && prices.hasOwnProperty(new_trigram)) {
        errors.push("An item with this abbreviation already exists")
    }

    if (errors.length === 0) {
        prices[trigram].full_name = new_name
        update_trigram(trigram, new_trigram)
    } else {
        log_errors_in_console(errors)
        // TODO show error popup
    }
}

function update_trigram(trigram, new_trigram) {
    function clone_to_remove_event_listeners(element) {
        const new_element = element.cloneNode(true)
        element.parentNode.replaceChild(new_element, element)
        return new_element
    }
    if (trigram !== new_trigram) {
        Object.defineProperty(prices, new_trigram,
            Object.getOwnPropertyDescriptor(prices, trigram));
        delete prices[trigram];

        // Remove event listeners
        const new_name_input_field = clone_to_remove_event_listeners(document.getElementById(`name-input-${trigram}`))
        // Put cursor at the end because new element created and otherwise typing gets annoying
        // All this because I couldn't properly remove the event listener without replacing the whole input field
        new_name_input_field.focus()
        new_name_input_field.selectionStart = new_name_input_field.value.length

        const trigram_cell = document.getElementById(`trigram-${trigram}`)
        trigram_cell.id = `trigram-${new_trigram}`
        trigram_cell.innerText = new_trigram

        const name_input_field = document.getElementById(`name-input-${trigram}`)
        name_input_field.id = `name-input-${new_trigram}`
        document.getElementById(`name-input-${new_trigram}`).addEventListener("input", () => {
            update_name(new_trigram)
        })

        const new_price_input_field = clone_to_remove_event_listeners(document.getElementById(`price-input-${trigram}`))
        new_price_input_field.id = `price-input-${new_trigram}`
        document.getElementById(`price-input-${new_trigram}`).addEventListener("input", () => {
            update_price(new_trigram)
        })

        const new_min_price_input_field = clone_to_remove_event_listeners(document.getElementById(`min-price-input-${trigram}`))
        new_min_price_input_field.id = `min-price-input-${new_trigram}`
        document.getElementById(`min-price-input-${new_trigram}`).addEventListener("input", () => {
            update_min_price(new_trigram)
        })
    }
}

function update_price(trigram) {
    const errors = []
    const price_input_field = document.getElementById(`price-input-${trigram}`)
    let new_price = price_input_field.value

    if (parseInt(new_price) < 0) {
        errors.push("Price can't be less than 0")
    }

    if (parseInt(new_price) < prices[trigram].min_price) {
        errors.push("Price can't be less than the minimum price")
    }

    if (errors.length === 0) {
        if (numDigitsAfterDecimal(new_price) > 2) {
            new_price = (Math.floor(new_price * 100) / 100).toFixed(2)
            price_input_field.value = new_price
        }
        prices[trigram].initial_price = new_price
    } else {
        price_input_field.value = prices[trigram].initial_price
        log_errors_in_console(errors)
        // TODO Show error popup
    }
}

function update_min_price(trigram) {
    const errors = []
    const min_price_input_field = document.getElementById(`min-price-input-${trigram}`)
    let new_min_price = min_price_input_field.value
    const initial_price = prices[trigram].initial_price

    if (new_min_price < 0) {
        errors.push("Minimum price can't be less than 0")
    }

    if (parseInt(new_min_price) > initial_price) {
        errors.push("Minimum price can't be greater than the initial price")
    }

    if (errors.length === 0) {
        if (numDigitsAfterDecimal(new_min_price) > 2) {
            new_min_price = (Math.floor(new_min_price * 100) / 100).toFixed(2)
            min_price_input_field.value = new_min_price
        }
        prices[trigram].min_price = new_min_price
    } else {
        min_price_input_field.value = prices[trigram].min_price
        log_errors_in_console(errors)
        // TODO Show error popup
    }

}

function numDigitsAfterDecimal(x) {
    console.log(x, (x.toString().split('.')[1] || '').length)
    return (x.toString().split('.')[1] || '').length
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
    price_cell.innerHTML = `${currency}` + `<input id="price-input-${trigram}" type="number" value="${item_params.initial_price}" min="0" step="0.01"/>`
    new_row.appendChild(price_cell)

    const min_price_cell = document.createElement("td")
    min_price_cell.innerHTML = `${currency}` + `<input id="min-price-input-${trigram}" type="number" value="${item_params.min_price}" min="0" step="0.01"/>`
    new_row.appendChild(min_price_cell)

    const delete_cell = document.createElement("td")
    const delete_button = document.createElement("button")
    delete_button.onclick = () => { delete_trigram(trigram) }
    delete_button.innerHTML = "delete"
    delete_cell.appendChild(delete_button)
    new_row.appendChild(delete_cell)

    items_table.appendChild(new_row)

    document.getElementById(`name-input-${trigram}`).addEventListener("input", () => {
        update_name(trigram)
    })
    document.getElementById(`name-input-${trigram}`).value = item_params.full_name

    document.getElementById(`price-input-${trigram}`).addEventListener("input", () => {
        update_price(trigram)
    })
    document.getElementById(`price-input-${trigram}`).value = item_params.initial_price

    document.getElementById(`min-price-input-${trigram}`).addEventListener("input", () => {
        update_min_price(trigram)
    })
    document.getElementById(`min-price-input-${trigram}`).value = item_params.min_price
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

function execute_if_no_errors(errors, func = () => {}) {
    if (errors.length === 0) {
        func()
    } else {
       log_errors_in_console(errors)
    }
}

function log_errors_in_console(errors) {
    errors.forEach(error => {
        console.error(error)
    })
}
