let signError = ''
let isDocumentSignedSuccess = false

const PK_FORM_TYPE_FILE = 1,
	PK_FORM_TYPE_KM = 2,
	PK_FORM_TYPE_KSP = 3

var euSettings = {
	language: 'uk',
	encoding: 'utf-8',
	httpProxyServiceURL: 'https://sign-wiget-node-js-server.onrender.com',
	directAccess: !0,
	CAs: './Data/CAs.json',
	CACertificates: './Data/CACertificates.p7b',
	allowedKeyMediaTypes: [],
	KSPs: [],
}

var euSignFile = new EndUser(null, EndUserConstants.EndUserLibraryType.JS),
	euSignKeyMedia = new EndUser(null, EndUserConstants.EndUserLibraryType.SW),
	keyMedias = [],
	euSign = euSignFile,
	formType = PK_FORM_TYPE_FILE

function readFile(e) {
	return new Promise(function (resolve, reject) {
		var reader = new FileReader()
		reader.onloadend = function (event) {
			if (event.target.readyState === FileReader.DONE) {
				resolve({
					file: e,
					data: new Uint8Array(event.target.result),
				})
			}
		}
		reader.readAsArrayBuffer(e)
	})
}

function getSelectedKSP() {
	var val = document.getElementById('pkKSPSelect').value
	return euSettings.KSPs.find(ksp => ksp.name == val) || null
}

function setLibraryType(e) {
	let fileBlock = document.getElementById('pkFileBlock')
	let keyMediaBlock = document.getElementById('pkKeyMediaBlock')
	let kspBlock = document.getElementById('pkKSPBlock')
	let signBlock = document.getElementById('signBlock')

	fileBlock.style.display = 'none'
	keyMediaBlock.style.display = 'none'
	kspBlock.style.display = 'none'
	signBlock.style.display = 'none'

	formType = e
	if (e === PK_FORM_TYPE_FILE) {
		fileBlock.style.display = 'block'
		euSign = euSignFile
	} else if (e === PK_FORM_TYPE_KM) {
		keyMediaBlock.style.display = 'block'
		euSign = euSignKeyMedia
	} else if (e === PK_FORM_TYPE_KSP) {
		kspBlock.style.display = 'block'
		euSign = euSignFile
	}

	initialize()
		.then(() => {
			signBlock.style.display = 'block'
		})
		.catch(err => {
			console.log('Initialize error: ' + (err.message || err))
		})
}

function initialize() {
	return euSign
		.IsInitialized()
		.then(initialized => {
			if (!initialized) return euSign.Initialize(euSettings)
		})
		.then(() => {
			if (formType === PK_FORM_TYPE_KSP) {
				setKSPs()
				return euSign.AddEventListener(
					EndUserConstants.EndUserEventType.ConfirmKSPOperation,
					onConfirmKSPOperation
				)
			}
		})
}

function onConfirmKSPOperation(e) {
	document.getElementById('pkKSPQRImageBlock').innerHTML =
		'<a href="' +
		e.url +
		'"><img src="data:image/bmp;base64,' +
		e.qrCode +
		'" style="padding: 10px; background: white;"></a>'
	document.getElementById('pkKSPQRBlock').style.display = 'block'
}

function readPrivateKey() {
	return new Promise(function (resolve, reject) {
		if (formType === PK_FORM_TYPE_FILE) {
			let fileInput = document.getElementById('pkFile')
			let passwordInput = document.getElementById('pkFilePassword')
			if (!fileInput.value) return reject('Не обрано файл з ос. ключем')
			if (!passwordInput.value) return reject('Не вказано пароль до ос. ключа')

			readFile(fileInput.files[0])
				.then(fileData => {
					return euSign.ReadPrivateKeyBinary(
						fileData.data,
						passwordInput.value,
						null,
						null
					)
				})
				.then(resolve)
				.catch(reject)
		} else if (formType === PK_FORM_TYPE_KSP) {
			let ksp = getSelectedKSP()
			let userId = document.getElementById('pkKSPUserId').value
			if (!ksp) return reject('Не обрано сервіс підпису')
			if (!ksp.confirmationURL && !userId)
				return reject('Не вказано ідентифікатор користувача')
			euSign
				.ReadPrivateKeyKSP(ksp.confirmationURL ? '' : userId, ksp.name)
				.then(resolve)
				.catch(reject)
		} else {
			reject('Тип ключа не підтримується')
		}
	})
}

function signData() {
	let includeOrigin = document.getElementById('envelopedOrigin').checked
	let fileInput = document.getElementById('dataFile')
	let spinner = document.getElementById('spinner')
	let signButton = document.getElementById('sign-button')
	let certBlock = document.getElementById('pkDetails')

	spinner.style.display = 'block'
	signButton.disabled = true
	certBlock.innerHTML = ''

	readFile(fileInput.files[0])
		.then(({ data }) => _signData(data, includeOrigin))
		.catch(err => {
			console.error('Fail read data from file: ' + (err.message || err))
			spinner.style.display = 'none'
			signButton.disabled = false
		})
}

function _signData(data, includeOrigin) {
	let signTextarea = document.getElementById('sign-textarea')
	let signButton = document.getElementById('sign-button')
	let spinner = document.getElementById('spinner')

	readPrivateKey()
		.then(key => {
			return euSign.SignDataEx(1, data, true, true, includeOrigin)
		})
		.then(signature => {
			signTextarea.value = signature
			spinner.style.display = 'none'
			signButton.disabled = false
			isDocumentSignedSuccess = true
			saveSignData(signature)
		})
		.catch(err => {
			spinner.style.display = 'none'
			signButton.disabled = false
			signError = err.message || err
			isDocumentSignedSuccess = false
			sendErrorMsg()
		})
}

function saveSignData(signature) {
	try {
		const bytes = base64ToArrayBuffer(signature)
		const blob = new Blob([bytes], { type: 'application/octet-stream' })
		window.saveAs(blob, '__signed_data__.p7s')
		sendSignedDataToParent(signature, blob)
	} catch (e) {
		console.error(e)
	}
}

function base64ToArrayBuffer(base64) {
	let binary = atob(base64)
	let len = binary.length
	let buffer = new Uint8Array(len)
	for (let i = 0; i < len; i++) {
		buffer[i] = binary.charCodeAt(i)
	}
	return buffer
}

function sendSignedDataToParent(stringBase64, blobData) {
	window.parent.postMessage(
		{
			type: 'signed-data',
			stringBase64,
			blobData,
			isDocumentSignedSuccess,
		},
		'*'
	)
}

function sendErrorMsg() {
	window.parent.postMessage(
		{
			type: 'signed-data-error',
			signError,
		},
		'*'
	)
}

window.onload = function () {
	try {
		document.getElementById('sign-button').addEventListener('click', signData)
		document
			.getElementById('pkTypeFile')
			.addEventListener('click', () => setLibraryType(PK_FORM_TYPE_FILE))
		document
			.getElementById('pkTypeKeyMedia')
			.addEventListener('click', () => setLibraryType(PK_FORM_TYPE_KM))
		document
			.getElementById('pkTypeKSP')
			.addEventListener('click', () => setLibraryType(PK_FORM_TYPE_KSP))
		document.getElementById('pkKSPSelect').addEventListener('change', () => {
			const selected = getSelectedKSP()
			document.getElementById('pkKSPUserIdBlock').style.display =
				selected && selected.confirmationURL ? 'none' : 'block'
		})
		setLibraryType(PK_FORM_TYPE_FILE)
	} catch (e) {
		console.error(e)
	}
}
