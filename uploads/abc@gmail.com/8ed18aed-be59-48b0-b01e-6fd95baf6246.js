
const list = document.querySelector("ul");
const detailsBtn = document.querySelector(".details")

detailsBtn.addEventListener("click", async () => {
	try {
		// const response = await fetch('https://jsonplaceholder.typicode.com/todos')
		const response = await fetch('http://localhost:3001/api/stripe/customer/cus_S1gEOlzks439yZ', {
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwNmYwMzNiLTJhZWItNDIwYi04NjMyLTJkZjg3NWJjN2I2NyIsImVtYWlsIjoibGFsYWxhQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvbiI6ImZyZWUiLCJzdHJpcGVDdXN0b21lcklkIjpudWxsLCJpYXQiOjE3NDMxNjc2ODAsImV4cCI6MTc0MzI1NDA4MH0.OeU4mtciGet2SX7jtmFZ5UtwzY-umGIfDt4-QGPJSwU"
			}
		})
		if(!response.ok) {
			throw new Error(response)
		}

		const data = await response.json();
		console.log(data);
		window.location.href = data.url;
	} catch(error) {
		throw new Error(error.message)
	}
})

async function fetchData() {
	try {
		// const response = await fetch('https://jsonplaceholder.typicode.com/todos')
		const response = await fetch('http://localhost:3001/api/stripe/products', {
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU2NzVjOWM3LWZjZTEtNDMyZi1hZjFhLTMwOTcxMjYxMDQwYiIsImVtYWlsIjoiYWJjQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvbiI6ImZyZWUiLCJzdHJpcGVDdXN0b21lcklkIjpudWxsLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc1Mzk0Mjk0OSwiZXhwIjoxNzU0MDI5MzQ5fQ.3WtXL9uWBFTj0xyipDR6_orpv-yRc_xUqRt5GtTC9gg"
			}
		})
		if(!response.ok) {
			throw new Error(response)
		}

		const data = await response.json();
		return data

	} catch(error) {
		throw new Error(error.message)
	}
}
fetchData()

function createMarkup(arr) {
	return arr.map(({ unit_amount, currency, product: { name, description, default_price }}) => `
		<li class="product-item" data-price="${default_price}">
			<h2>${name}</h2>
			<p>${description}</p>
			<p>${unit_amount / 100} ${currency}</p>
			<button class="checkout__btn" type="button">Process to Checkout</button>
		</li>
	`).join("")
}

async function render() {
	try {
		const products = await fetchData();
		console.log(products);
		list.insertAdjacentHTML("beforeend", createMarkup(products))
	} catch(error) {
		// list.innerHTML = `<h2>${error.message}</h2>`
	}
}

render();

list.addEventListener("click", handleCheckout)

async function handleCheckout(event) {
	if(!event.target.classList.contains('checkout__btn')) {
		return;
	}

	const parent = event.target.closest(".product-item");
	const price = parent.dataset.price;
	console.log(price);

	try {
		const response = await fetch("http://localhost:3001/api/stripe/checkout", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU2NzVjOWM3LWZjZTEtNDMyZi1hZjFhLTMwOTcxMjYxMDQwYiIsImVtYWlsIjoiYWJjQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvbiI6ImZyZWUiLCJzdHJpcGVDdXN0b21lcklkIjpudWxsLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc1Mzk0Mjk0OSwiZXhwIjoxNzU0MDI5MzQ5fQ.3WtXL9uWBFTj0xyipDR6_orpv-yRc_xUqRt5GtTC9gg"
			},
			body: JSON.stringify({ price }),
		})

		if(!response.ok) {
			throw new Error(response.status)
		}

		const data = await response.json();
		console.log(data);

		if(data.error) {
			console.log(data.error); // отображать на странице ошибку
		}

		window.location.href = data.url
	} catch(error) {
		console.log(error);
	}
}