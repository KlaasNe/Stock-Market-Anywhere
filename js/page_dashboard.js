const prices_listener = new ChangeListener("prices");
const new_sale_listener = new ChangeListener("new_sale");
const sellability_listener = new ChangeListener("sellability-state");
const title = localStorage.getItem("event-title");
const CURRENCY = localStorage.getItem("currency");
let prices_history;
let indexes;
let is_krach;
let drinks_sellability;

init()

function init(){
    document.getElementById("title-input").innerHTML = title;
    prices_listener.check()
    prices_history = prices_listener.value["prices_history"]
    indexes = data_get_information("indexes")

    init_chart()
    update_cheapest()
    generate_price_display()
}

setInterval(() => {
    if (prices_listener.check()) {
        prices_history = prices_listener.value["prices_history"]
        indexes = data_get_information("indexes")
        is_krach = data_get_information("is_krach")

        add_new_prices_to_chart()
        update_cheapest()
        update_prices_table()
        krach_style()
    }
}, 500)

setInterval(() => {
    if (chart.getNbrCurveMissing() > 1) // No idea why this doesn't work for >0
        display_new_curve()

    if (new_sale_listener.check()) {
        const sales = new_sale_listener.value
        for (const [_, data] of Object.entries(sales)) {
            for (let i = 0; i < data[2]; i++) new_sale_animation(data[0], data[1])
        }
    }

    if (sellability_listener.check()) {
        drinks_sellability = sellability_listener.value
        generate_price_display()
    }
}, 30)

function get_last_prices(index = -1){
    let last_prices = {}
    for(trigram in prices_history){
        last_prices[trigram] = prices_history[trigram].at(index)
    }

    return last_prices
}

function get_variation(){
    let variation = {}

    let last_prices = get_last_prices()
    for(trigram in prices_history) {
        variation[trigram] = last_prices[trigram] / prices_history[trigram][0]
        variation[trigram] = round((variation[trigram] - 1) * 100, 2)
    }

    return variation
}

function update_cheapest(){
    let last_prices = get_last_prices()
	var cheapest = Object.keys(last_prices).map(function(key) {
        return [key, last_prices[key]];
    });

    cheapest.sort(function(first, second) {
        return first[1] - second[1];
    });

	cheapest = cheapest.splice(0,3)
	for (let i=0; i < 3; i++) {
        try {
            let trigram = cheapest[i][0];
            document.querySelector("#cheapest .indice#numero_" + (i+1)).innerHTML = defaultPrices[trigram]["full_name"];
        } catch (ignored) {}
	}
}

function format_currency(price, max_price) {
    let num_string_parts = price.toString().split(".");
    if (num_string_parts.length < 2) {
        num_string_parts.push("00")
    } else if (num_string_parts.at(1).length < 2) {
        num_string_parts[1] = num_string_parts.at(1) + "0"
    }
    return num_string_parts.join(".");

}

async function generate_price_display() {
    let last_prices = get_last_prices();
	let tableau = document.querySelector('#afficheur_prix tbody');

    const sellability = await sellability_listener.value

    tableau.innerHTML = "";
	for (let trigram in defaultPrices) {
        const sold_out = !sellability[trigram];
		tableau.innerHTML +=
			"<tr class='prix_" + trigram + "'>" +
				"<td class='color-indicator-table' style='color:" + defaultPrices[trigram]["colour"] + "; border-top-left-radius: .5rem; border-bottom-left-radius: .5rem;'>&#11044;</td>" +
				"<td>" + (sold_out ? `<del>${defaultPrices[trigram]["full_name"]}</del>` : `${defaultPrices[trigram]["full_name"]}`) + "</td>" +
				"<td class='indice'>" + trigram + "</td>" +
				`<td class="${sold_out ? 'prix nfs' : 'prix'}" style='display: flex; justify-content: end; gap: 8px;'><span>${CURRENCY}</span><span>${format_currency(last_prices[trigram])}</span></td>` +
				"<td class='croissance' style='border-top-right-radius: .5rem; border-bottom-right-radius: .5rem;'>0 %</td>" +
			"</tr>";
	}
}

function update_prices_table(){
    let last_prices = get_last_prices()
    let variation = get_variation()

	for (let trigram in defaultPrices) {
		let trigram_el =  document.querySelector('#afficheur_prix .prix_' + trigram);
		let trigram_el_price = trigram_el.querySelector('.prix');
		let trigram_el_variation = trigram_el.querySelector('.croissance');

		trigram_el_price.innerText = `${CURRENCY} ` + last_prices[trigram]

        let variation_sign
        variation[trigram] > 0 ? variation_sign = "+" : variation_sign = ""
        trigram_el_variation.innerText = variation_sign + variation[trigram] + "%"

        variation[trigram] > 0 ? variation_sign = "positive" : variation_sign = "neutral"
        variation[trigram] < 0 ? variation_sign = "negative" : ""
        trigram_el.setAttribute("growth", variation_sign)
	}
}

function krach_style(){
    if(is_krach === true){
        document.querySelector("html").classList.add("active_krach")
    } else {
        document.querySelector("html").classList.remove("active_krach")
    }
}
