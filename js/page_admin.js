const prices = new Prices()
const indexes = new Indexes(8) // OOOOHHHH MAGIC NUMBER (it doesn't do anything in this version)
const sales = new Sales()
let defaultPrices = JSON.parse(localStorage.getItem('defaultPrices'));
const drinks_sellability = {}

const sales_queue = []

function start_from_nothing() {
    indexes.new(false)
    prices.set_default()

    init()
}

function reload() {
    indexes.load(data_get_information("indexes"))
    prices.load(data_get_information("prices"))
    sales.load(data_get_information("sales"))
}

function init() {
    for (let trigram in sale_buttons) {
        sale_buttons[trigram].dom.removeAttribute("disabled")
        drinks_sellability[trigram] = true
    }

    data_upload("indexes", indexes)
    data_upload("prices", prices)
    data_upload("is_krach", false)
}


function submit_new_sales(set_krach = null) {
    const sales_data = {};
    for (const i in sales_queue) {
        const trigram = sales_queue[i];
        const actual_price = sale_buttons[trigram].actual_price;
        sales_data[trigram] = [
            defaultPrices[trigram]["colour"],
            actual_price,
            sales_data[trigram] ? sales_data[trigram][2] + 1 : 1
        ];
        sales.new(trigram, actual_price);
        // new_sale_animation(defaultPrices[trigram]["colour"], actual_price)
    }
    data_upload("new_sale", sales_data);

    indexes.end()
    indexes.new(set_krach)

    if (indexes.is_krach()) {
        krach_prices = prices.crash()
        prices.append(krach_prices)
    } else {
        // new_sales_start = indexes.last_non_krach_party_index()[0]
        // new_sales = sales.since(new_sales_start)
        new_sales = [];
        const sale_time = Date.now();
        sales_queue.forEach(trigram => {
            new_sales.push([trigram, sale_time, sale_buttons[trigram].actual_price]);
        });

        const new_prices = prices.compute_new_prices(new_sales, indexes, defaultPrices)
        prices.append(new_prices)
    }

    sales_queue.splice(0, sales_queue.length);

    data_upload("sales", sales)
    data_upload("indexes", indexes)
    data_upload("prices", prices)
    data_upload("is_krach", indexes.is_krach())
    update_sales(prices.last(indexes))
}

function update_sales(new_prices) {
    for (let drink in new_prices) {
        sale_buttons[drink].update_dom(new_prices[drink]);
    }

    calculate_price()
}

// build up the admin interface
const el_drinks = document.getElementById("drinks");
const drinks_for_sale = document.getElementById("sold-out");
const sale_buttons = {}
let generated_html = ""
for (let trigram in defaultPrices) {
    const full_name = defaultPrices[trigram]["full_name"]
    const initial_price = defaultPrices[trigram]["initial_price"]
    const colour = defaultPrices[trigram]["colour"]

    let button = new SaleButton(trigram, full_name, initial_price, colour)
    sale_buttons[trigram] = button

    el_drinks.appendChild(button.html())
    generated_html = generated_html.concat(`<div><input type="checkbox" onInput=switch_sellability_state('${trigram}') checked><span id="sellability-${trigram}">${full_name}</span></div>`)
}
drinks_for_sale.innerHTML = generated_html;

function switch_sellability_state(trigram) {
    drinks_sellability[trigram] = !drinks_sellability[trigram];

    const item = document.getElementById(`sellability-${trigram}`);
    if (drinks_sellability[trigram]) {
        item.innerHTML = item.innerText
        sale_buttons[trigram].dom.removeAttribute("disabled")
    } else {
        item.innerHTML = "<del>" + item.innerText + "</del>"
        sale_buttons[trigram].dom.setAttribute("disabled", true)
    }

    data_upload("sellability-state", drinks_sellability);
}

for (let trigram in sale_buttons) {
    let executed_hold = false
    sale_buttons[trigram].dom.addEventListener('click', function () {
        if (!sale_buttons[trigram].dom.getAttribute("disabled")) {
            if (!executed_hold) {
                sales_queue.push(trigram)
                sale_buttons[trigram].add_counter()
            }
            executed_hold = false
        }
        calculate_price()
    })

    sale_buttons[trigram].dom.addEventListener('contextmenu', function (event) {
        event.preventDefault()
        if (!sale_buttons[trigram].dom.getAttribute("disabled")) {
            const item_index = sales_queue.indexOf(trigram)
            if (item_index >= 0) {
                sales_queue.splice(item_index, 1)
                sale_buttons[trigram].add_counter(-1)
            }
        }
        calculate_price()
    })

    sale_buttons[trigram].dom.addEventListener('mousedown', function (event) {
        if (!sale_buttons[trigram].dom.getAttribute("disabled")) {
            if (event.button === 0) {
                const time_out = setTimeout(() => {
                    executed_hold = true
                    for (let i = 0; i < 10; i++) sales_queue.push(trigram)
                    sale_buttons[trigram].add_counter(10)
                }, 500)

                sale_buttons[trigram].dom.addEventListener('mouseup', function () {
                    clearTimeout(time_out)
                })
                calculate_price()
            }
        }
    })
}

// countdown_new_price_el = document.getElementById("remaining_time_til_new_prices")
// function update_countdown_new_price(){
//     countdown_new_price_el.innerText = indexes.time_until_next()
// }

// handles krach
html_el = document.getElementsByTagName("html")[0]
krach_button = document.getElementById("krach")
krach_button.addEventListener('click', () => {
    if (indexes.is_krach()) {
        submit_new_sales(false)
        html_el.classList.remove("active_krach")
    } else {
        submit_new_sales(true)
        html_el.classList.add("active_krach")
    }
});

bump_prices_button = document.getElementById("bump-prices");
bump_prices_button.addEventListener('click', () => {
    if (!indexes.is_krach()) {
        const bumped_prices = {};
        for (let trigram in sale_buttons) {
            const sale_button = sale_buttons[trigram];
            bumped_prices[trigram] = roundNumber(sale_button.actual_price * 1.1, 2);
            defaultPrices[trigram]["initial_price"] = roundNumber(defaultPrices[trigram]["initial_price"] * 1.1, 2);
        }
        indexes.end()
        indexes.new(false)
        prices.append(bumped_prices);
        update_sales(bumped_prices);
    }
});

function roundNumber(num, digits) {
    return +num.toFixed(digits);
}

function calculate_price() {
    let price = 0;
    const calc = document.getElementById("calculator");

    for (let i = 0; i < sales_queue.length; i++) {
        const drink = sales_queue[i];
        price += parseFloat(sale_buttons[drink].actual_price);
    }

    calc.innerText = `€${price.toFixed(2)}`;
}
