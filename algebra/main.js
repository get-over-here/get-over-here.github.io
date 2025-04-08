(function() {

	// в конце генерации мы видим одно число в каждом направлении и все суммы


	// уровни сложности:
	// поле - 2х2, 3х3, 4х4...
	// количество цифр в числах - 1,2,3...
	// количество скрытых чисел, в зависимости от размера поля - 1, 2, 3...

	// @todo cells are objects with types and values
	// const TYPE_NONE = 0
	// const TYPE_SIGN = 1
	// const TYPE_NUMBER = 2
	function createZeroesArrayWithFill(rows, cols) {
		return Array.from({ length: rows }, () => Array(cols).fill(''))
	}
	function getRandomInteger(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min
	}
	function isOdd(number) {
		return number % 2 !== 0
	}
	function isNumber(value) {
		return typeof value === 'number' && isFinite(value)
	}

	let tableDom = document.getElementById('table')
	let keyboardDom = document.getElementById('keyboard')

	let currentCell

	tableDom.addEventListener('click', function(e) {

		if (currentCell) {
			currentCell.classList.remove('blinking')
			currentCell.classList.remove('bad')
		}

		if (e.target.nodeName !== 'TD') {
			return
		}
		if (e.target.dataset.hidden !== '?') {
			return
		}

		currentCell = e.target
		if (currentCell.classList.contains('good')) {
			return
		}

		currentCell.classList.add('blinking')
		currentCell.innerHTML = '_'
		currentCell.dataset.guess = ''

		if (keyboardDom.classList.contains('hidden')) {
			keyboardDom.classList.remove('hidden')
		}

	}, false)

	keyboardDom.addEventListener('click', function(e) {
		if (e.target.nodeName !== 'BUTTON') {
			return
		}

		let char = e.target.dataset.char
		currentCell.dataset.guess += char
		currentCell.innerHTML = currentCell.dataset.guess

		let x = parseInt(currentCell.dataset.x, 10)
		let y = parseInt(currentCell.dataset.y, 10)
		let guess = parseInt(currentCell.dataset.guess, 10)
		let value = gameTable[y][x]

		keyboardDom.classList.add('hidden')

		if (value === guess) {
			currentCell.classList.remove('blinking')
			currentCell.classList.add('good')
			totalHidden--
			if (totalHidden === 0) {
				nextStage()
			}
			return
		}

		currentCell.classList.remove('blinking')
		currentCell.classList.add('bad')
		
	}, false)

	/*
		1 add
		2 add substract
		3 add substract multiply
		4 add substract multiply divide
	*/
	let signs = 1
	// number of signs, from 1
	let rows = 1
	// numerical digits in numbers, not is result
	let size = 1


	let generateTable = (signs, rows, size)=>{
		const signsArr = '+-*/'
		const maxNumber = parseInt('9'.repeat(size))
		const minNumber = parseInt('1'+'0'.repeat(size-1))
		const cellLatest = cells - 1
		const cellPenult = cells - 2

		let gameTable = createZeroesArrayWithFill(cells, cells)
		let getRandomSign = ()=>{
			let pos = getRandomInteger(0, signs)
			pos = pos - 1
			if (pos < 0) {
				pos = 0
			}
			return signsArr[pos]
		}
		let computeSum = (first, sign, second)=>{
			switch (sign) {
				case '+':
					return first + second
				case '-':
					return first - second
				case '*':
					return first * second
				case '/':
					return first / second
				default:
					return second
			}
		}
		let putNumber = (x, y, num)=>{
			// put number to cell
			gameTable[y][x] = num
			
			let signX = ''
			let signY = ''
			if (y > 1) {
				signX = gameTable[y-1][x]
			}
			if (x > 1) {
				signY = gameTable[y][x-1]
			}
			let sumX = gameTable[cellLatest][x]
			let sumY = gameTable[y][cellLatest]
			gameTable[cellLatest][x] = computeSum(sumX, signX, num)
			gameTable[y][cellLatest] = computeSum(sumY, signY, num)
		}


		// prepare bottom cells
		let y = cellPenult
		for (let x = 0; x < cellPenult; x++) {
			if (!isOdd(x)) {
				gameTable[cellPenult][x] = '='
				gameTable[cellLatest][x] = 0
			}
		}
		// prepare right cells
		let x = cellPenult
		for (let y = 0; y < cellPenult; y++) {
			if (!isOdd(y)) {
				gameTable[y][cellPenult] = '='
				gameTable[y][cellLatest] = 0
			}
		}
		for (let y = 0; y < cellPenult; y++) {
			// fill row
			for (let x = 0; x < cellPenult; x++) {
				let lastSignCol = ''

				// if row is even - even col is number, odd col is sign
				if (!isOdd(y)) {
					if (!isOdd(x)) {
						putNumber(x, y, getRandomInteger(minNumber, maxNumber))
					} else {
						gameTable[y][x] = getRandomSign(signs)
					}

				// if row is odd  - even col is sign, odd col is space
				} else if (!isOdd(x)) {
					gameTable[y][x] = getRandomSign(signs)	
				}
			}
		}
		// let res = gameTable.join('\n')
		// console.log(res.replace(/,/g, ' '))
		return gameTable
	}

	let gameTable

	// 5,5 for two rows
	// 7,7 for three rows
	let cells = 2 * rows + 1 + 2 // visual: row[X +] row[Y +] 1[Z] 2[= N]
	const cellPenult = cells - 2
	let totalHidden = 0

	let nextStage = ()=>{
		let table = '<table>'

		gameTable = generateTable(signs, cells, size)
		totalHidden = 0

		for (let y = 0; y < cells; y++) {

			let isVisibleX = getRandomInteger(0, cellPenult)
			if (isOdd(isVisibleX)) {
				isVisibleX--
				if (isVisibleX < 0) {
					isVisibleX = 0
				}
			}

			table += '<tr>'
			for (let x = 0; x < cells; x++) {
				const cell = gameTable[y][x]
				let value = cell
				if (y < cellPenult && x < cellPenult && isVisibleX !== x && isNumber(value)) {
					value = '?'
					totalHidden++
				}
				table += `<td data-hidden="${value}" data-y="${y}" data-x="${x}">${value}</td>`
			}
			table += '</tr>'
		}
		table += '</table>'
		tableDom.innerHTML = table.trim()
	}


	nextStage()

})();