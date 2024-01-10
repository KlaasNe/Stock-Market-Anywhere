const prices = {}
const currency = ""

function add_product() {
    const product_name = document.getElementById("product").value
    const price = document.getElementById("price").value
    const min_price = document.getElementById("min-price").value
    const trigram = make_trigram(product_name);
    prices[trigram] = {
        "initial_price": price,
        "crash_price": min_price,
        "min_price": min_price,
        "full_name": product_name
    };
    append_new_item_html(trigram, prices[trigram]);
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
        "<td>" + `<input type="text" value="${item_params.full_name}"/>` + "</td>" +
        "<td>" + "€" + `<input type="text" value="${item_params.initial_price}"/>` + "</td>" +  // TODO Make currency variable
        "<td>" + "€" + `<input type="text" value="${item_params.min_price}"/>` + "</td>"+
        `<td><button onclick="delete_trigram(${trigram})">delete</button></td>` +
        "</tr>"
}

function delete_trigram(htmlItem) {
    delete prices.trigram
    htmlItem.remove()
}

function generate_items_html() {
    return null
}