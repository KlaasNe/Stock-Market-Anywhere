// Sales is "imported" from the admin.html file

class Prices {
    prices_history = {}
    // prices_history structure :
    // {
    //      "tor": [3.2, 4, 5],
    //      "bar": [1.5, 1.34, 1.7],
    //      "plo": [0.62, 0.45, 0.2],
    // }

    constructor(amplification = 120) {
        this.amplification = amplification
        document.getElementById("parametre_prices_var_amp").value = amplification
    }

    load(json_object) {
        this.prices_history = json_object.prices_history
        this.amplification = json_object.amplification
        if ("number_of_drinks" in json_object) {
            this.number_of_drinks = json_object.number_of_drinks
        } else {
            this.number_of_drinks = Object.keys(defaultPrices).length;
        }
    }

    toCSV() {
        let trigrams = Object.keys(this.prices_history)
        let str_csv = "index," + trigrams.join(",") + "\n"

        let max_length = 0
        for (let i in trigrams) {
            max_length = Math.max(this.prices_history[trigrams[i]].length, max_length)
        }
        for (let i = 0; i < max_length; i++) {
            let prices = [i]
            for (let ii in trigrams) {
                let value = this.prices_history[trigrams[ii]].at(i)
                if (value === undefined) {
                    value = ""
                }
                prices.push(value)
            }
            str_csv += prices.join(",") + "\n"
        }

        return str_csv
    }

    append(prices_dict) {
        for (let drink in this.prices_history) {
            if (drink in prices_dict) {
                this.prices_history[drink].push(prices_dict[drink])
            }
        }

        return this
    }

    default() {
        let default_normal_prices = {}
        for (let drink in defaultPrices) {
            default_normal_prices[drink] = defaultPrices[drink]["initial_price"]
        }

        return default_normal_prices
    }

    set_default() {
        let default_normal_prices = this.default()

        for (let drink in default_normal_prices) {
            this.prices_history[drink] = [default_normal_prices[drink]]
        }
        this.number_of_drinks = Object.keys(default_normal_prices).length
    }

    crash() {
        let crash_prices = {}
        for (let drink in defaultPrices) {
            crash_prices[drink] = defaultPrices[drink]["crash_price"]
        }

        return crash_prices
    }

    price_variation(new_sales, former_prices) {
        let total_sales = new_sales.length

        let sales_per_drink = new Sales().cumulative_sales(new_sales)
        for (let drink in former_prices) {
            if (!(drink in sales_per_drink)) {
                sales_per_drink[drink] = 0;
            }
        }

        let average_sales = total_sales / this.number_of_drinks
        let maximum = Math.max(...Object.values(sales_per_drink));
        let centered_sales = this.center_sales(sales_per_drink, average_sales, maximum)

        // tend to amplification's value when total_sales goes to infinity
        // those points are then shared between the drinks
        let max_var_per_sale = ((Math.atan(total_sales / 10) / (Math.PI / 2)) * this.amplification);
        for (let drink in centered_sales) {
            centered_sales[drink] = centered_sales[drink] * max_var_per_sale;
        }

        return centered_sales
    }

    center_sales(sales_per_drink, average, max) {
        max = Math.max(max, 1);

        let centered_sales = {}
        for (let drink in sales_per_drink) {
            centered_sales[drink] = (sales_per_drink[drink] - average) / max
        }

        return centered_sales
    }

    last_non_krach(indexes) {
        let number_of_completed_indexes = indexes.party_index.length - 1
        let last_non_krach_index = indexes.last_non_krach_index()


        let last_non_krach = {}
        for (let drink in this.prices_history) {
            if (this.prices_history[drink].length === number_of_completed_indexes) { // take only drinks that are still updated
                last_non_krach[drink] = this.prices_history[drink][last_non_krach_index]
            } else {
                console.warn(`This drink is no longer being updated:\n\tdrink: ${drink}\n\tindexes.party_index.length: ${indexes.party_index.length}\n\tprices_history[drink].length: ${this.prices_history[drink].length}\n\tindexes.prices_history: ${indexes.party_index}`)
            }
        }

        return last_non_krach
    }

    last(indexes) {
        let number_of_indexes = indexes.party_index.length

        let last_prices = {}
        for (let drink in this.prices_history) {
            if (this.prices_history[drink].length === number_of_indexes) { // take only drinks that are still updated
                last_prices[drink] = this.prices_history[drink][number_of_indexes - 1]
            }
        }

        return last_prices
    }

    compute_new_prices(new_sales, indexes, default_prices) {
        const mapped_default_prices = {}
        Object.keys(default_prices).forEach(function(key, index) {
            mapped_default_prices[key] = default_prices[key]["initial_price"]
        });
        const original_price_sum = round(this.sum_prices(mapped_default_prices), 2)
        let former_prices = this.last_non_krach(indexes);
        let price_var = this.price_variation(new_sales, former_prices);

        let new_prices = {};
        for (let drink in this.prices_history) {
            let min_price = 0;
            if ("min_price" in default_prices[drink]) {
                min_price = default_prices[drink]["min_price"];
            }
            const new_price = Math.max(
                (former_prices[drink]
                    * (1 + price_var[drink] / 100))
                , min_price
            );
            new_prices[drink] = new_price.toFixed(2);
        }

        const new_price_sum = round(this.sum_prices(new_prices), 2)
        if (new_price_sum < original_price_sum) {
            let missing_value = round(original_price_sum - new_price_sum, 2);
            const new_prices_entries = Object.entries(new_prices)
            new_prices_entries.sort((a, b) => a[1] - b[1])
            for (let i = 0; i < missing_value * 100; i++) {
                new_prices_entries[i % new_prices_entries.length][1] = round(parseFloat(new_prices_entries[i % new_prices_entries.length][1]) + 0.01, 2);
            }
            new_prices = Object.fromEntries(new_prices_entries)
        }

        return new_prices;
    }

    sum_prices(prices) {
        let sum_prices = 0;
        for (let drink in prices) {
            sum_prices += parseFloat(prices[drink]);
        }

        return sum_prices
    }
}
