var prices = new Prices()
refresh_period = 15
var indexes = new Indexes(refresh_period)
var sales = new Sales()


function start_from_nothing(){
    indexes.new(false)
    prices.set_default()

    init()
}

function reload(){
    indexes.load(data_get_information("indexes"))
    prices.load(data_get_information("prices"))
    sales.load(data_get_information("sales"))
}

function init(){
    buttons_sale_drink.forEach(function(button_sale) {
        button_sale.removeAttribute("disabled")
    })

    x = setInterval(() => {
        if(indexes.is_time_for_next()){
            new_interval()
        }

        update_countdown_new_price()
    }, (1000));

    data_upload("indexes", indexes)
    data_upload("prices", prices)
    data_upload("is_krach", false)
}



function new_interval(set_krach = null){
    indexes.end()
    indexes.new(set_krach)

    if(indexes.is_krach()){
        krach_prices = prices.krach()
        prices.append(krach_prices)
    } else {
        new_sales_start = indexes.last_non_krach_party_index()[0]
        new_sales = sales.since(new_sales_start)
    
        new_prices = prices.compute_new_prices(new_sales, indexes, default_prices)
        prices.append(new_prices)
    }

    data_upload("sales", sales)
    data_upload("indexes", indexes)
    data_upload("prices", prices)
    data_upload("is_krach", indexes.is_krach())
    update_sales(prices.last(indexes))
}



// build up the admin interface
let el_drinks = document.getElementById("drinks");
let sale_buttons = {}
for(let i in default_prices){
	trigram = i
	fullname = default_prices[i]["full_name"]
	initial_price = default_prices[i]["initial_price"]
	colour = default_prices[i]["colour"]

	bouton = new SaleButton(trigram, fullname, initial_price, colour)
	sale_buttons[trigram] = bouton

	el_drinks.appendChild(bouton.html())
}

let buttons_sale_drink = document.querySelectorAll('.drink')
buttons_sale_drink.forEach(function(sale_button) {
	sale_button.addEventListener('click', function() {
		let trigram = this.getAttribute('trigram')
		let actual_price = this.getAttribute('actual_price')
		sales.new(trigram, actual_price)
	});
})

function update_sales(new_price){
	for(let drink in new_price){
		sale_buttons[drink].update_dom(new_price[drink])
	}
}

countdown_new_price_el = document.getElementById("remaining_time_til_new_prices")
function update_countdown_new_price(){
    countdown_new_price_el.innerText = indexes.time_until_next()
}



// handles krach
html_el = document.getElementsByTagName("html")[0]
krach_button = document.getElementById("krach")
krach_button.addEventListener('click', () => {
    if(indexes.is_krach()){
        new_interval(false)
        html_el.classList.remove("active_krach")
    } else {
        new_interval(true)
        html_el.classList.add("active_krach")
    }
})
