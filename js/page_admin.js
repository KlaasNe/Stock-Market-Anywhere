var prices = new Prices()
refresh_period = 60
var indexes = new Indexes(refresh_period)
var sales = new Sales()

const sales_queue = []


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
    for(let trigram in sale_buttons){
        sale_buttons[trigram].dom.removeAttribute("disabled")
    }

    // x = setInterval(() => {
    //     if(indexes.is_time_for_next()){
    //         new_sale()
    //     }
    //
    //     update_countdown_new_price()
    // }, (1000));

    data_upload("indexes", indexes)
    data_upload("prices", prices)
    data_upload("is_krach", false)
}



function submit_new_sales(set_krach = null){
    console.log("doing sales omg so business!")
    for (let i in sales_queue) {
        const trigram = sales_queue[i]
        const actual_price = sale_buttons[trigram].actual_price
        sales.new(trigram, actual_price)
        new_sale_animation(default_prices[trigram]["colour"], actual_price)
        data_upload("new_sale", [default_prices[trigram]["colour"], actual_price])
    }
    sales_queue.splice(0, sales_queue.length)


    indexes.end()
    indexes.new(set_krach)

    if(indexes.is_krach()){
        krach_prices = prices.crash()
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

function update_sales(new_price){
	for(let drink in new_price){
		sale_buttons[drink].update_dom(new_price[drink])
	}
}

// build up the admin interface
const el_drinks = document.getElementById("drinks");
const sale_buttons = {}
for (let trigram in default_prices) {
	const full_name = default_prices[trigram]["full_name"]
	const initial_price = default_prices[trigram]["initial_price"]
	const colour = default_prices[trigram]["colour"]

	let button = new SaleButton(trigram, full_name, initial_price, colour)
	sale_buttons[trigram] = button

	el_drinks.appendChild(button.html())
}

for (let trigram in sale_buttons) {
    let executed_hold = false
    sale_buttons[trigram].dom.addEventListener('click', function() {
        if (!executed_hold) {
            sales_queue.push(trigram)
            sale_buttons[trigram].add_counter()
        }
        executed_hold = false
	})

    sale_buttons[trigram].dom.addEventListener('contextmenu', function(event) {
        event.preventDefault()
        const item_index = sales_queue.indexOf(trigram)
        sales_queue.splice(item_index, 1)
        sale_buttons[trigram].add_counter(-1)
    })

    sale_buttons[trigram].dom.addEventListener('mousedown', function(event) {
        if (event.button === 0) {
            const time_out = setTimeout(() => {
                executed_hold = true
                for (let i = 0; i < 10; i++) sales_queue.push(trigram)
                sale_buttons[trigram].add_counter(10)
            }, 500)

            sale_buttons[trigram].dom.addEventListener('mouseup', function () {
                clearTimeout(time_out)
            })
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
    if(indexes.is_krach()){
        submit_new_sales(false)
        html_el.classList.remove("active_krach")
    } else {
        submit_new_sales(true)
        html_el.classList.add("active_krach")
    }
})
