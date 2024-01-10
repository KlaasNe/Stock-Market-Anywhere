const prices = {}
let currency = "€"

document.getElementById("add-item").addEventListener("submit", (event) => {
    event.preventDefault();
    add_product();
});

function add_product() {
    const errors = []
    const product_name = document.getElementById("product").value
    const trigram = make_trigram(product_name);
    if (prices.hasOwnProperty(trigram)) {
        errors.push("An item with this abbreviation already exists")
    }
    const price = document.getElementById("price").value
    if (price.value === "") {
        errors.push("Item has no price")
    }
    if (errors.length === 0) {
        let min_price = document.getElementById("min-price").value;
        min_price = min_price !== "" ? min_price : 0;
        prices[trigram] = {
            "initial_price": price,
            "crash_price": min_price,
            "min_price": min_price,
            "full_name": product_name
        }
        append_new_item_html(trigram, prices[trigram]);
        product_name.value = ""
        price.value = ""
        min_price.value = ""
        product_name.focus()  // TODO MAKE THIS WORK
    } else {
        // TODO Show error popup
    }
}

function make_trigram(name, maxNumberChars = 3) {
    let trigram = ""
    let nameParts = name.toUpperCase().split(" ")
    if (nameParts[0].length < 3) {
        nameParts[0] = nameParts[0] + nameParts[1]
        nameParts.splice(1, 1)
    }
    const partsCount = nameParts.length
    const partsCountCapped = Math.min(maxNumberChars, partsCount)
    trigram += nameParts[0].substring(0, maxNumberChars - (partsCountCapped - 1))
    for (let i = 1; i < partsCountCapped; i++) {
        trigram += nameParts[i].substring(0, 1)
    }
    return trigram
}

function append_new_item_html(trigram, item_params) {
    const items_table = document.getElementById("items")
    items_table.innerHTML += `<tr id="${trigram}">` +
        "<td>" + trigram + "</td>" +
        "<td>" + `<input type="text" value="${item_params.full_name}" required/>` + "</td>" +
        "<td>" + `${currency}` + `<input type="number" value="${item_params.initial_price}" min="0" step="0.01"/>` + "</td>" +  // TODO Make currency variable
        "<td>" + `${currency}` + `<input type="number" value="${item_params.min_price}" min="0" step="0.01"/>` + "</td>" +
        `<td><button onclick="delete_trigram('${trigram}')">delete</button></td>` +
        "</tr>"
}

function delete_trigram(trigram) {
    prices.delete(trigram)
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